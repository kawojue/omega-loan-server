import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { CreateModeratorDTO } from './dto/moderator.dto'
import { EncryptionService } from 'lib/encryption.service'
import { InfiniteScrollDTO } from 'src/customer/dto/infinite-scroll.dto'

@Injectable()
export class AuthService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async login(res: Response, { email, password }) {
        try {
            const modmin = await this.prisma.modmin.findUnique({
                where: { email }
            })

            if (!modmin) {
                return this.response.sendError(res, StatusCodes.NotFound, "Account does not exist")
            }

            if (modmin.status === "suspended") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Account has been suspended")
            }

            const isMatch = await this.encryption.compareAsync(password, modmin.password)

            if (!isMatch) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Incorrect password")
            }

            const access_token = await this.misc.generateNewAccessToken({
                sub: modmin.id,
                role: modmin.role,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Login Successful",
                data: {
                    role: modmin.role,
                    email: modmin.email,
                },
                access_token,
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

    async fetchModerators(
        res: Response,
        {
            limit, page, search = ''
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
}
