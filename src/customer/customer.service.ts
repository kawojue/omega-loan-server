import { Response } from 'express'
import { validateFile } from 'utils/file'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { CreateCustomerDto } from './dto/customer.dto'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { InfiniteScrollDTO, SearchDTO } from './dto/infinite-scroll.dto'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

@Injectable()
export class CustomerService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly cloudinary: CloudinaryService,
        private readonly encryption: EncryptionService,
    ) { }

    async createCustomer(
        res: Response,
        { sub }: ExpressUser,
        customerDto: CreateCustomerDto,
        cardImage: Express.Multer.File,
        photograph: Express.Multer.File,
    ) {
        try {
            if (!cardImage || !photograph) {
                return this.response.sendError(res, StatusCodes.BadRequest, "Photograph & Means of ID are required")
            }

            const serializedCardImage = validateFile(cardImage, 3 << 20, 'jpg', 'png')
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

            const { secure_url: cardImageUrl } = await this.cloudinary.upload(serializedCardImage.file, header)

            const { secure_url: photographUrl } = await this.cloudinary.upload(serializedPhotographImage.file, header)

            const customer = await this.prisma.customer.create({
                data: {
                    ...customerDto,
                    photographUrl,
                    cardUrl: cardImageUrl,
                    status: 'active',
                    modmin: {
                        connect: { id: sub }
                    }
                }
            })

            this.response.sendSuccess(res, StatusCodes.Created, { data: customer })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchCustomer(
        res: Response,
        { sub, role }: ExpressUser,
        customerId: string
    ) {
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

        const guarantorsCount = await this.prisma.guarantor.count({
            where: { customerId }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: customer, metadata: { guarantorsCount } })
    }

    async fetchCustomers(
        res: Response,
        {
            limit, page, search = ''
        }: InfiniteScrollDTO,
        { sub, role }: ExpressUser,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            search = search?.trim() ?? ''
            const offset = (page - 1) * limit

            const OR: ({
                email: {
                    contains: string
                    mode: "insensitive"
                }
            } | {
                surname: {
                    contains: string
                    mode: "insensitive"
                }
            } | {
                otherNames: {
                    contains: string
                    mode: "insensitive"
                }
            })[] = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { surname: { contains: search, mode: 'insensitive' } },
                    { otherNames: { contains: search, mode: 'insensitive' } },
                ]

            const customers = await this.prisma.customer.findMany({
                where: role === "Admin" ? {
                    OR
                } : {
                    modminId: sub,
                    OR
                },
                take: limit,
                skip: offset,
                select: {
                    email: true,
                    status: true,
                    gender: true,
                    surname: true,
                    otherNames: true,
                    homeAddress: true,
                    membership_fee: true,
                },
                orderBy: { updatedAt: 'desc' },
            })

            const length = await this.prisma.customer.count({
                where: role === "Admin" ? {
                    OR
                } : {
                    modmin: { id: sub },
                    OR
                }
            })

            const totalPages = Math.ceil(length / limit)

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: customers,
                metadata: { length, totalPages }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchAllGuarantors(
        res: Response,
        {
            limit, page, search = ''
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
                    guranted_for: { modminId: sub },
                    OR
                },
                skip: offset,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
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
                    guranted_for: { modminId: sub },
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
            limit, page, search = ''
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
                    guranted_for: { modminId: sub },
                    OR,
                    customerId,
                },
                skip: offset,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
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
                    guranted_for: { modminId: sub },
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

    async customersDropdown(
        res: Response,
        { search }: SearchDTO,
        { role, sub }: ExpressUser
    ) {
        const customers = await this.prisma.customer.findMany({
            where: role === "Admin" ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { surname: { contains: search, mode: 'insensitive' } },
                    { otherNames: { contains: search, mode: 'insensitive' } },
                ]
            } : {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { surname: { contains: search, mode: 'insensitive' } },
                    { otherNames: { contains: search, mode: 'insensitive' } },
                ],
                modminId: sub,
            },
            select: {
                id: true,
                email: true,
                surname: true,
                otherNames: true,
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: customers })
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
                guranted_for: { modminId: sub },
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: guarantors })
    }
}
