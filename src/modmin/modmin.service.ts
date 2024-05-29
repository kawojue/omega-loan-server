import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { CreateModeratorDTO, UpdateModeratorDTO } from './dto/moderator.dto'
import { EncryptionService } from 'lib/encryption.service'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'

@Injectable()
export class ModminService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async signup(
        res: Response,
        {
            otherNames, password,
            email, surname, gender,
        }: CreateModeratorDTO
    ) {
        try {
            const isExist = await this.prisma.modmin.findUnique({
                where: { email }
            })

            if (isExist) {
                return this.response.sendError(res, StatusCodes.Conflict, "Admin already exist")
            }

            password = await this.encryption.hashAsync(password)

            await this.prisma.modmin.create({
                data: {
                    role: 'Admin',
                    status: 'active',
                    otherNames, password,
                    email, surname, gender,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Admin created successfully"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async addModerator(
        res: Response,
        {
            otherNames, password,
            email, surname, gender,
        }: CreateModeratorDTO
    ) {
        try {
            const isExist = await this.prisma.modmin.findUnique({
                where: { email }
            })

            if (isExist) {
                return this.response.sendError(res, StatusCodes.Conflict, "Moderator already exist")
            }

            password = await this.encryption.hashAsync(password)

            const moderator = await this.prisma.modmin.create({
                data: {
                    status: 'active',
                    role: 'Moderator',
                    otherNames, password,
                    email, surname, gender,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: moderator,
                message: "Moderator created successfully"
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async updateModerator(
        res: Response,
        moderatorId: string,
        updateModeratorDto: UpdateModeratorDTO
    ) {
        try {
            const existingModerator = await this.prisma.modmin.findUnique({
                where: { id: moderatorId },
            })

            if (!existingModerator) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Moderator not found')
            }

            if (updateModeratorDto.email && updateModeratorDto.email !== existingModerator.email) {
                const isEmailTaken = await this.prisma.modmin.findUnique({
                    where: { email: updateModeratorDto.email },
                })
                if (isEmailTaken) {
                    return this.response.sendError(res, StatusCodes.Conflict, 'Email is already in use')
                }
            }

            if (updateModeratorDto.password) {
                updateModeratorDto.password = await this.encryption.hashAsync(updateModeratorDto.password)
            }

            const updatedModerator = await this.prisma.modmin.update({
                where: { id: moderatorId },
                data: {
                    ...updateModeratorDto,
                },
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: updatedModerator,
                message: 'Moderator updated successfully',
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchModerators(
        res: Response,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            search = search?.trim() ?? ''
            const offset = (page - 1) * limit

            const moderators = await this.prisma.modmin.findMany({
                where: {
                    role: 'Moderator',
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { surname: { contains: search, mode: 'insensitive' } },
                        { otherNames: { contains: search, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            })

            const length = await this.prisma.modmin.count({
                where: {
                    role: 'Moderator',
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { surname: { contains: search, mode: 'insensitive' } },
                        { otherNames: { contains: search, mode: 'insensitive' } },
                    ],
                }
            })

            const totalPages = Math.ceil(length / limit)

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: moderators,
                metadata: { length, totalPages }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async moderatorsDropdown(
        res: Response,
        { search }: SearchDTO,
    ) {
        const moderators = await this.prisma.modmin.findMany({
            where: {
                role: 'Admin',
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { surname: { contains: search, mode: 'insensitive' } },
                    { otherNames: { contains: search, mode: 'insensitive' } },
                ]
            },
            select: {
                id: true,
                email: true,
                surname: true,
                otherNames: true,
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: moderators })
    }

    async toggleStatus(
        res: Response,
        moderatorId: string,
        { sub }: ExpressUser,
    ) {
        const modmin = await this.prisma.modmin.findUnique({
            where: { id: moderatorId }
        })

        if (!modmin) {
            return this.response.sendError(res, StatusCodes.NotFound, "Moderator or Admin not found")
        }

        if (modmin.id === sub) {
            return this.response.sendError(res, StatusCodes.BadRequest, "You can't disable yourself")
        }

        const newModmin = await this.prisma.modmin.update({
            where: { id: moderatorId },
            data: {
                status: modmin.status === "active" ? 'suspended' : 'active'
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: newModmin })
    }
}
