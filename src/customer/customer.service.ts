import { Response } from 'express'
import { validateFile } from 'utils/file'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CreateCustomerDTO, UpdateCustomerDTO } from './dto/customer.dto'
import { InfiniteScrollDTO, SearchDTO } from './dto/infinite-scroll.dto'

@Injectable()
export class CustomerService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async createCustomer(
        res: Response,
        { sub }: ExpressUser,
        customerDto: CreateCustomerDTO,
        cardImage: Express.Multer.File,
        photograph: Express.Multer.File,
    ) {
        try {
            const customer = await this.prisma.customer.findFirst({
                where: {
                    OR: [
                        { email: { equals: customerDto.email, mode: 'insensitive' } },
                        { telephone: { equals: customerDto.telephone, mode: 'insensitive' } },
                    ]
                }
            })

            if (customer) {
                return this.response.sendError(res, StatusCodes.Conflict, "Existing customer")
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

            const newCustomer = await this.prisma.customer.create({
                data: {
                    ...customerDto,
                    photograph: {
                        secure_url: photographUrl,
                        public_id: photographPublicId,
                    },
                    cardImage: {
                        secure_url: cardImageUrl,
                        public_id: cardPublicId,
                    },
                    status: 'active',
                    modmin: {
                        connect: { id: sub }
                    }
                }
            })

            this.response.sendSuccess(res, StatusCodes.Created, { data: newCustomer })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async updateCustomer(
        res: Response,
        { sub, role }: ExpressUser,
        customerId: string,
        customerDto: UpdateCustomerDTO,
        cardImage?: Express.Multer.File,
        photograph?: Express.Multer.File,
    ) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: role === "Admin" ? { id: customerId } : {
                    id: customerId,
                    modminId: sub,
                },
            })

            if (!customer) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Customer not found')
            }

            let cardImageUrl = customer.cardImage?.secure_url
            let cardPublicId = customer.cardImage?.public_id
            let photographUrl = customer.photograph?.secure_url
            let photographPublicId = customer.photograph?.public_id

            if (cardImage) {
                const serializedCardImage = validateFile(cardImage, 3 << 20, 'jpg', 'png')
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
                const serializedPhotographImage = validateFile(photograph, 3 << 20, 'jpg', 'png')
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

            const updatedCustomer = await this.prisma.customer.update({
                where: { id: customerId },
                data: {
                    ...customerDto,
                    photograph: photographUrl ? {
                        secure_url: photographUrl,
                        public_id: photographPublicId,
                    } : customer.photograph,
                    cardImage: cardImageUrl ? {
                        secure_url: cardImageUrl,
                        public_id: cardPublicId,
                    } : customer.cardImage,
                },
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: updatedCustomer })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async deleteCustomer(
        res: Response,
        customerId: string
    ) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
            })

            if (!customer) {
                return this.response.sendError(res, StatusCodes.NotFound, 'Customer not found')
            }

            if (customer.cardImage?.public_id) {
                await this.cloudinary.delete(customer.cardImage.public_id)
            }

            if (customer.photograph?.public_id) {
                await this.cloudinary.delete(customer.photograph.public_id)
            }

            await this.prisma.customer.delete({
                where: { id: customerId },
            })

            this.response.sendSuccess(res, StatusCodes.NoContent, null)
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
                    id: true,
                    email: true,
                    status: true,
                    gender: true,
                    surname: true,
                    telephone: true,
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
}
