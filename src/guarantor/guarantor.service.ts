import { Response } from 'express'
import { validateFile } from 'utils/file'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CreateGuarantorDTO, UpdateGuarantorDTO } from './dto/guarantor.dto'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'

@Injectable()
export class GuarantorService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async createGuarantor(
        res: Response,
        customerId: string,
        { sub, role }: ExpressUser,
        cardImage: Express.Multer.File,
        photograph: Express.Multer.File,
        guarantorDTO: CreateGuarantorDTO,
    ) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: role === "Admin" ? {
                    id: customerId
                } : {
                    id: customerId,
                    modminId: sub
                }
            })

            if (!customer) {
                return this.response.sendError(res, StatusCodes.NotFound, "Customer not found")
            }

            const serializedCardImage = validateFile(cardImage, 3 << 20, 'jpg', 'png', 'jpeg')
            if (serializedCardImage?.status) {
                return this.response.sendError(res, serializedCardImage.status, serializedCardImage.message)
            }

            const serializedPhotographImage = validateFile(photograph, 3 << 20, 'jpg', 'png')
            if (serializedCardImage?.status) {
                return this.response.sendError(res, serializedPhotographImage.status, serializedPhotographImage.message)
            }

            const header = {
                folder: 'OmegaLoan',
                resource_type: 'image',
            } as FileDest

            const [{
                public_id: cardPublicId,
                secure_url: cardImageUrl,
            }, {
                secure_url: photographUrl,
                public_id: photographPublicId
            }] = await Promise.all([
                this.cloudinary.upload(serializedCardImage.file, header),
                this.cloudinary.upload(serializedPhotographImage.file, header)
            ])

            const guarantor = await this.prisma.guarantor.create({
                data: {
                    ...guarantorDTO,
                    photograph: {
                        secure_url: photographUrl,
                        public_id: photographPublicId,
                    },
                    cardImage: {
                        secure_url: cardImageUrl,
                        public_id: cardPublicId,
                    },
                    customer: { connect: { id: customerId } }
                }
            })

            this.response.sendSuccess(res, StatusCodes.Created, { data: guarantor })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async updateGuarantor(
        res: Response,
        guarantorId: string,
        { sub, role }: ExpressUser,
        guarantorDto: UpdateGuarantorDTO,
        cardImage?: Express.Multer.File,
        photograph?: Express.Multer.File,
    ) {
        try {
            const guarantor = await this.prisma.guarantor.findUnique({
                where: role === "Admin" ? { id: guarantorId } : {
                    id: guarantorId,
                    customer: { modminId: sub },
                },
            })

            if (!guarantor) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Customer not found')
            }

            let cardImageUrl = guarantor.cardImage?.secure_url
            let cardPublicId = guarantor.cardImage?.public_id
            let photographUrl = guarantor.photograph?.secure_url
            let photographPublicId = guarantor.photograph?.public_id

            if (cardImage) {
                const serializedCardImage = validateFile(cardImage, 3 << 20, 'jpg', 'png', 'jpeg')
                if (serializedCardImage?.status) {
                    return this.response.sendError(res, serializedCardImage.status, serializedCardImage.message)
                }

                if (cardPublicId) {
                    await this.cloudinary.delete(cardPublicId)
                }

                const uploadedCardImage = await this.cloudinary.upload(serializedCardImage.file, { folder: 'OmegaLoan', resource_type: 'image' })
                cardImageUrl = uploadedCardImage.secure_url
                cardPublicId = uploadedCardImage.public_id
            }

            if (photograph) {
                const serializedPhotographImage = validateFile(photograph, 3 << 20, 'jpg', 'png', 'jpeg')
                if (serializedPhotographImage?.status) {
                    return this.response.sendError(res, serializedPhotographImage.status, serializedPhotographImage.message)
                }

                if (photographPublicId) {
                    await this.cloudinary.delete(photographPublicId)
                }
                const uploadedPhotograph = await this.cloudinary.upload(serializedPhotographImage.file, { folder: 'OmegaLoan', resource_type: 'image' })
                photographUrl = uploadedPhotograph.secure_url
                photographPublicId = uploadedPhotograph.public_id
            }

            const updatedCustomer = await this.prisma.guarantor.update({
                where: { id: guarantorId },
                data: {
                    ...guarantorDto,
                    photograph: {
                        secure_url: photographUrl,
                        public_id: photographPublicId,
                    },
                    cardImage: {
                        secure_url: cardImageUrl,
                        public_id: cardPublicId,
                    }
                },
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: updatedCustomer })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async guarantorsDropdown(
        res: Response,
        { search }: SearchDTO,
        { role, sub }: ExpressUser
    ) {
        const guarantors = await this.prisma.guarantor.findMany({
            where: role === "Admin" ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ]
            } : {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ],
                customer: { modminId: sub },
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: guarantors })
    }

    async fetchAllGuarantors(
        res: Response,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO,
        { sub, role }: ExpressUser,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            search = search?.trim() ?? ''
            const offset = (page - 1) * limit

            const OR: ({
                name: {
                    contains: string
                    mode: "insensitive"
                }
            } | {
                email: {
                    contains: string
                    mode: "insensitive"
                }
            })[] = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]

            const guarantors = await this.prisma.guarantor.findMany({
                where: role === "Admin" ? {
                    OR
                } : {
                    customer: { modminId: sub },
                    OR
                },
                skip: offset,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    address: true,
                    telephone1: true,
                    telephone2: true,
                    homeAddress: true,
                    addressOfBusiness: true,
                }
            })

            const length = await this.prisma.guarantor.count({
                where: role === "Admin" ? {
                    OR
                } : {
                    customer: { modminId: sub },
                    OR
                }
            })

            const totalPages = Math.ceil(length / limit)

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: guarantors,
                metadata: { length, totalPages }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchCustomerGuarantors(
        res: Response,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO,
        { sub, role }: ExpressUser,
        customerId: string,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            search = search?.trim() ?? ''
            const offset = (page - 1) * limit

            const OR: ({
                name: {
                    contains: string
                    mode: "insensitive"
                }
            } | {
                email: {
                    contains: string
                    mode: "insensitive"
                }
            })[] = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]

            const guarantors = await this.prisma.guarantor.findMany({
                where: role === "Admin" ? {
                    OR,
                    customerId,
                } : {
                    customer: { modminId: sub },
                    OR,
                    customerId,
                },
                skip: offset,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    address: true,
                    telephone1: true,
                    telephone2: true,
                    homeAddress: true,
                    addressOfBusiness: true,
                }
            })

            const length = await this.prisma.guarantor.count({
                where: role === "Admin" ? {
                    OR,
                    customerId,
                } : {
                    customer: { modminId: sub },
                    OR,
                    customerId,
                },
            })

            const totalPages = Math.ceil(length / limit)

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: guarantors,
                metadata: { length, totalPages }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchGuarantor(
        res: Response,
        guarantorId: string,
        { sub, role }: ExpressUser,
    ) {
        const guarantor = await this.prisma.guarantor.findUnique({
            where: role === "Admin" ? {
                id: guarantorId
            } : {
                id: guarantorId,
                customer: { modminId: sub }
            }
        })

        if (!guarantor) {
            return this.response.sendError(res, StatusCodes.NotFound, "Guarantor not found")
        }

        this.response.sendSuccess(res, StatusCodes.OK, { data: guarantor })
    }

    async deleteGuarantor(
        res: Response,
        guarantorId: string
    ) {
        try {
            const guarantor = await this.prisma.guarantor.findUnique({
                where: { id: guarantorId },
            })

            if (!guarantor) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Guarantor not found')
            }

            if (guarantor.cardImage?.public_id) {
                await this.cloudinary.delete(guarantor.cardImage.public_id)
            }

            if (guarantor.photograph?.public_id) {
                await this.cloudinary.delete(guarantor.photograph.public_id)
            }

            await this.prisma.guarantor.delete({
                where: { id: guarantorId },
            })

            this.response.sendSuccess(res, StatusCodes.NoContent, null)
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
