import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'
import { LoanApplicationDTO, UpdateLoanApplicationDTO } from './dto/apply-loan.dto'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'

@Injectable()
export class LoanService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
    ) { }

    async addLoanCategory(
        res: Response,
        { name, amount }: LoanCategoryDTO
    ) {
        const category = await this.prisma.loanCategory.create({
            data: { name, amount }
        })

        this.response.sendSuccess(res, StatusCodes.Created, { data: category })
    }

    async editLoanCategory(
        res: Response,
        categoryId: string,
        { name, amount }: LoanCategoryDTO
    ) {
        const category = await this.prisma.loanCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return this.response.sendError(res, StatusCodes.NotFound, "Loan category not found")
        }

        const newCategory = await this.prisma.loanCategory.update({
            where: { id: categoryId },
            data: { name, amount }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: newCategory })
    }

    async removeLoanCategory(
        res: Response,
        categoryId: string,
    ) {
        const category = await this.prisma.loanCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return this.response.sendError(res, StatusCodes.NotFound, "Loan category not found")
        }

        const removedCategory = await this.prisma.loanCategory.delete({
            where: { id: categoryId }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: removedCategory })
    }

    async listLoanCategory(
        res: Response,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO
    ) {
        page = Number(page)
        limit = Number(limit)
        search = search?.trim() ?? ''
        const offset = (page - 1) * limit

        const loanCategories = await this.prisma.loanCategory.findMany({
            where: {
                OR: [{ name: { contains: search, mode: 'insensitive' } }]
            },
            orderBy: { updatedAt: 'desc' },
            skip: offset,
            take: limit,
        })

        const length = await this.prisma.loanCategory.count({
            where: {
                OR: [{ name: { contains: search, mode: 'insensitive' } }]
            }
        })

        const totalPages = Math.ceil(length / limit)

        this.response.sendSuccess(res, StatusCodes.OK, {
            data: { loanCategories },
            metadata: { length, totalPages }
        })
    }

    async applyLoanApplication(
        res: Response,
        customerId: string,
        { sub }: ExpressUser,
        dto: LoanApplicationDTO
    ) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId }
            })

            if (!customer) {
                return this.response.sendError(res, StatusCodes.NotFound, "Customer not found")
            }

            const isPendingLoanAvailable = await this.prisma.loanApplication.findFirst({
                where: {
                    remarks: 'PENDING',
                    customerId: customer.id
                }
            })

            if (isPendingLoanAvailable) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Can't apply for a new loan. There is available pending loan")
            }

            const {
                loanType,
                loanAmount,
                managementFee,
                applicationFee,
                equity,
                disbursedDate,
                loanTenure,
                preLoanAmount,
                preLoanTenure,
                officeAddress,
                salaryDate,
                salaryAmount,
                bankName,
                bankAccNumber,
                outstandingLoans,
            } = dto


            const parsedDisbursedDate = new Date(disbursedDate)
            const parsedSalaryDate = salaryDate ? new Date(salaryDate) : null

            const application = await this.prisma.loanApplication.create({
                data: {
                    loanType,
                    loanAmount,
                    managementFee,
                    applicationFee,
                    equity,
                    loanTenure,
                    preLoanAmount,
                    preLoanTenure,
                    officeAddress,
                    salaryAmount,
                    bankName,
                    bankAccNumber,
                    outstandingLoans,
                    salaryDate: parsedSalaryDate,
                    disbursedDate: parsedDisbursedDate,
                    modmin: { connect: { id: sub } },
                    customer: { connect: { id: customerId } },
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: application })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async editLoanApplication(
        res: Response,
        loanApplicationId: string,
        dto: UpdateLoanApplicationDTO
    ) {
        try {
            const loanApplication = await this.prisma.loanApplication.findUnique({
                where: { id: loanApplicationId }
            })

            if (!loanApplication) {
                return this.response.sendError(res, StatusCodes.NotFound, "Loan application not found")
            }

            const {
                loanType,
                loanAmount,
                managementFee,
                applicationFee,
                equity,
                disbursedDate,
                loanTenure,
                preLoanAmount,
                preLoanTenure,
                officeAddress,
                salaryDate,
                salaryAmount,
                bankName,
                bankAccNumber,
                outstandingLoans,
            } = dto

            const parsedDisbursedDate = disbursedDate ? new Date(disbursedDate) : null
            const parsedSalaryDate = salaryDate ? new Date(salaryDate) : null

            const updatedApplication = await this.prisma.loanApplication.update({
                where: { id: loanApplicationId },
                data: {
                    loanType,
                    loanAmount,
                    managementFee,
                    applicationFee,
                    equity,
                    disbursedDate: parsedDisbursedDate,
                    loanTenure,
                    preLoanAmount,
                    preLoanTenure,
                    officeAddress,
                    salaryDate: parsedSalaryDate,
                    salaryAmount,
                    bankName,
                    bankAccNumber,
                    outstandingLoans,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: updatedApplication })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async toggleLoanStatus(
        res: Response,
        loanId: string,
        { sub, role }: ExpressUser,
    ) {
        const loan = await this.prisma.loanApplication.findUnique({
            where: role === "Admin" ? {
                id: loanId
            } : {
                modminId: sub,
                id: loanId
            }
        })

        if (!loan) {
            return this.response.sendError(res, StatusCodes.UnprocessableEntity, "Loan not found or access denied")
        }

        const newLoan = await this.prisma.loanApplication.update({
            where: { id: loanId },
            data: {
                remarks: loan.remarks === "PENDING" ? "PAID" : "PENDING"
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: newLoan })
    }

    async fetchLoans(
        res: Response,
        { sub, role }: ExpressUser,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)
            search = search?.trim() ?? ''
            const offset = (page - 1) * limit

            const OR: ({
                customer: {
                    email: {
                        contains: string
                        mode: "insensitive"
                    }
                }
            } | {
                customer: {
                    surname: {
                        contains: string
                        mode: "insensitive"
                    }
                }
            } | {
                customer: {
                    otherNames: {
                        contains: string
                        mode: "insensitive"
                    }
                }
            })[] = [
                    { customer: { email: { contains: search, mode: 'insensitive' } } },
                    { customer: { surname: { contains: search, mode: 'insensitive' } } },
                    { customer: { otherNames: { contains: search, mode: 'insensitive' } } },
                ]

            const loans = await this.prisma.loanApplication.findMany({
                where: role === "Admin" ? { OR } : {
                    modminId: sub,
                    OR,
                },
                select: {
                    id: true,
                    loanType: true,
                    createdAt: true,
                    loanTenure: true,
                    disbursedDate: true,
                    managementFee: true,
                    applicationFee: true,
                    customer: {
                        select: {
                            id: true,
                            email: true,
                            surname: true,
                            telephone: true,
                            otherNames: true,
                        }
                    },
                },
                take: limit,
                skip: offset,
                orderBy: { updatedAt: 'desc' }
            })

            const length = await this.prisma.loanApplication.count({
                where: role === "Admin" ? { OR } : {
                    modminId: sub,
                    OR,
                }
            })

            const totalPages = Math.ceil(length / limit)

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: loans,
                metadata: { length, totalPages }
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async fetchLoansDropdown(
        res: Response,
        { search }: SearchDTO,
        { sub, role }: ExpressUser,
    ) {
        search = search?.trim() ?? ''

        const OR: ({
            customer: {
                email: {
                    contains: string
                    mode: "insensitive"
                }
            }
        } | {
            customer: {
                surname: {
                    contains: string
                    mode: "insensitive"
                }
            }
        } | {
            customer: {
                otherNames: {
                    contains: string
                    mode: "insensitive"
                }
            }
        })[] = [
                { customer: { email: { contains: search, mode: 'insensitive' } } },
                { customer: { surname: { contains: search, mode: 'insensitive' } } },
                { customer: { otherNames: { contains: search, mode: 'insensitive' } } },
            ]

        const loans = await this.prisma.loanApplication.findMany({
            where: role === "Admin" ? { OR } : {
                modminId: sub,
                OR,
            },
            select: {
                id: true,
                loanType: true,
                createdAt: true,
                loanTenure: true,
                disbursedDate: true,
                managementFee: true,
                applicationFee: true,
                customer: {
                    select: {
                        id: true,
                        email: true,
                        surname: true,
                        telephone: true,
                        otherNames: true,
                    }
                },
            },
            orderBy: { updatedAt: 'desc' }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: loans })
    }
}
