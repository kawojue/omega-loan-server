const ExcelJS = require('exceljs')
import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { PaybackMonth } from '@prisma/client'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import {
    FetchLoansDTO, InfiniteScrollDTO, SearchDTO
} from 'src/customer/dto/infinite-scroll.dto'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'
import { addMonths, isLeapYear, lastDayOfMonth, format } from 'date-fns'
import { LoanApplicationDTO, UpdateLoanApplicationDTO } from './dto/apply-loan.dto'

@Injectable()
export class LoanService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
    ) { }

    private async hasLoanCompleted(loanId: string) {
        const loan = await this.prisma.loanApplication.findUnique({
            where: { id: loanId }
        })

        if (!loan) return

        const isPaybackLeft = await this.prisma.paybackMonth.findFirst({
            where: { loanId, paid: false }
        })

        if (isPaybackLeft) return false
        return true
    }

    private async hasOutstandingLoan(customerId: string): Promise<boolean> {
        const loans = await this.prisma.loanApplication.findMany({
            where: { customerId },
            select: { id: true }
        })

        const remarks = await Promise.all(loans.map(async (loan) => {
            const isCompleted = await this.hasLoanCompleted(loan.id)
            return !isCompleted
        }))

        return remarks.some((remark) => remark)
    }


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

    async removeLoanCategory(res: Response, categoryId: string) {
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

    async getLoanCategory(res: Response, categoryId: string) {
        const category = await this.prisma.loanCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return this.response.sendError(res, StatusCodes.NotFound, "Loan category not found")
        }

        this.response.sendSuccess(res, StatusCodes.OK, { data: category })
    }

    async listLoanCategory(
        res: Response,
        {
            limit = 20, page = 1, search = ''
        }: InfiniteScrollDTO
    ) {
        page = Number(page)
        limit = Number(limit)
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
        { sub, role }: ExpressUser,
        {
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
        }: LoanApplicationDTO
    ) {
        try {
            const customer = await this.prisma.customer.findUnique({
                where: role === "Admin" ? { id: customerId } : { id: customerId, modminId: sub }
            })

            if (!customer) {
                return this.response.sendError(res, StatusCodes.NotFound, "Customer not found")
            }

            const isPendingLoanAvailable = await this.hasOutstandingLoan(customerId)

            if (isPendingLoanAvailable) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Can't apply for a new loan. There is an available pending loan for the customer")
            }

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

            const paybackMonths: PaybackMonth[] = []
            let currentDate = new Date(parsedDisbursedDate)

            for (let i = 0; i < loanTenure; i++) {
                const paybackDate = addMonths(currentDate, i + 1)
                const year = paybackDate.getFullYear()
                const month = paybackDate.getMonth()

                const lastDay = lastDayOfMonth(paybackDate)

                const isLeap = isLeapYear(year)
                const daysInMonth = isLeap ? 29 : lastDay.getDate()

                const amount = loanAmount / loanTenure

                const rate = 5
                const interest = (amount * rate) / 100
                const monthly_repayment = interest + amount

                const payback = await this.prisma.paybackMonth.create({
                    data: {
                        interest, amount, rate, monthly_repayment,
                        payback_date: new Date(year, month, daysInMonth),
                        loan: { connect: { id: application.id } },
                    }
                })

                paybackMonths.push(payback)
            }

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: {
                    application,
                    paybackMonths,
                }
            })
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
                preLoanAmount,
                preLoanTenure,
                officeAddress,
                salaryDate,
                salaryAmount,
                bankName,
                bankAccNumber,
                outstandingLoans,
            } = dto

            const parsedSalaryDate = salaryDate ? new Date(salaryDate) : loanApplication.salaryDate
            const parsedDisbursedDate = disbursedDate ? new Date(disbursedDate) : loanApplication.disbursedDate

            const updatedApplication = await this.prisma.loanApplication.update({
                where: { id: loanApplicationId },
                data: {
                    loanType,
                    loanAmount,
                    managementFee,
                    applicationFee,
                    equity,
                    disbursedDate: parsedDisbursedDate,
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

    async fetchPaybacks(
        res: Response,
        loanId: string,
        { sub, role }: ExpressUser,
    ) {
        try {
            const loan = await this.prisma.loanApplication.findUnique({
                where: role === "Admin" ? { id: loanId } : { modminId: sub, id: loanId }
            })

            if (!loan) {
                return this.response.sendError(res, StatusCodes.UnprocessableEntity, "Loan not found or access denied")
            }

            const paybacks = await this.prisma.paybackMonth.findMany({
                where: { loanId }
            })

            const currentDate = new Date()

            const paybacksWithRemark = paybacks.map(payback => {
                let remark = 'UPCOMING'

                if (payback.paid) {
                    remark = 'PAID'
                } else if (currentDate > new Date(payback.payback_date)) {
                    remark = 'OVERDUE'
                }

                return {
                    ...payback,
                    remark: remark,
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: paybacksWithRemark })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async toggleLoanStatus(
        res: Response,
        loanId: string,
        paybackId: string,
        { sub, role }: ExpressUser,
    ) {
        try {
            const loan = await this.prisma.loanApplication.findUnique({
                where: role === "Admin" ? { id: loanId } : { modminId: sub, id: loanId }
            })

            if (!loan) {
                return this.response.sendError(res, StatusCodes.UnprocessableEntity, "Loan not found or access denied")
            }

            const payback = await this.prisma.paybackMonth.findUnique({
                where: { loanId, id: paybackId }
            })

            if (!payback) {
                return this.response.sendError(res, StatusCodes.NotFound, "Payback month not found")
            }

            const updatedPayback = await this.prisma.paybackMonth.update({
                where: { loanId, id: paybackId },
                data: {
                    paid: !payback.paid
                }
            })

            this.response.sendSuccess(res, StatusCodes.OK, { data: updatedPayback })
        } catch (error) {
            console.error("Error toggling loan status:", error)
            this.response.sendError(res, StatusCodes.InternalServerError, "Failed to toggle loan status")
        }
    }

    async fetchLoans(
        res: Response,
        { sub, role }: ExpressUser,
        {
            limit = 20, page = 1, search = '', type
        }: FetchLoansDTO,
    ) {
        try {
            page = Number(page)
            limit = Number(limit)

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
                where: role === "Admin" ? { OR, loanType: type ? type : undefined } : {
                    modminId: sub,
                    OR,
                    loanType: type ? type : undefined
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            email: true,
                            surname: true,
                            telephone: true,
                            otherNames: true,
                            modmin: {
                                select: {
                                    id: true,
                                    email: true,
                                    surname: true,
                                    otherNames: true,
                                }
                            },
                        }
                    },
                },
                take: limit,
                skip: offset,
                orderBy: { updatedAt: 'desc' }
            })

            const length = await this.prisma.loanApplication.count({
                where: role === "Admin" ? { OR, loanType: type ? type : undefined } : {
                    modminId: sub,
                    OR,
                    loanType: type ? type : undefined
                },
            })

            const totalPages = Math.ceil(length / limit)

            const loansWithRemark = await Promise.all(loans.map(async (loan) => {
                return {
                    ...loan,
                    remark: await this.hasLoanCompleted(loan.id) ? 'COMPLETED' : 'ONGOING'
                }
            }))

            this.response.sendSuccess(res, StatusCodes.OK, {
                data: loansWithRemark,
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

    async getLoanApplication(
        res: Response,
        loanApplicationId: string,
        { sub, role }: ExpressUser,
    ) {
        const loan = await this.prisma.loanApplication.findUnique({
            where: role === "Admin" ? {
                id: loanApplicationId
            } : {
                id: loanApplicationId,
                customer: { modminId: sub }
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        email: true,
                        surname: true,
                        telephone: true,
                        otherNames: true,
                        modmin: {
                            select: {
                                id: true,
                                email: true,
                                surname: true,
                                otherNames: true,
                            }
                        },
                    }
                },
            },
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: loan })
    }

    async deleteLoanApplication(
        res: Response,
        loanApplicationId: string,
    ) {
        try {
            const loanApplication = await this.prisma.loanApplication.findUnique({
                where: { id: loanApplicationId },
            })

            if (!loanApplication) {
                return this.response.sendError(res, StatusCodes.NotFound, "Loan application not found")
            }

            await this.prisma.$transaction([
                this.prisma.paybackMonth.deleteMany({
                    where: { loanId: loanApplication.id }
                }),
                this.prisma.loanApplication.delete({
                    where: { id: loanApplicationId }
                })
            ])

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Loan application deleted successfully"
            })
        } catch (err) {
            this.misc.handleServerError(res, err, "Error deleting loan application")
        }
    }

    async fetchLoansByModerator(res: Response, moderatorId: string) {
        const moderator = await this.prisma.modmin.findUnique({
            where: { id: moderatorId }
        })

        if (!moderator) {
            return this.response.sendError(res, StatusCodes.NotFound, "Account officer not found")
        }

        const loans = await this.prisma.loanApplication.findMany({
            where: { modminId: moderatorId },
            include: {
                customer: {
                    select: {
                        id: true,
                        email: true,
                        surname: true,
                        telephone: true,
                        otherNames: true,
                        modmin: {
                            select: {
                                id: true,
                                email: true,
                                surname: true,
                                otherNames: true,
                            }
                        },
                    }
                },
            }
        })

        this.response.sendSuccess(res, StatusCodes.OK, { data: loans })
    }

    async exportLoans({ sub, role }: ExpressUser) {
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Omega Loans'
        const worksheet = workbook.addWorksheet('Loans')

        const loans = await this.prisma.loanApplication.findMany({
            where: role === "Admin" ? {} : { modminId: sub },
            include: {
                customer: {
                    select: {
                        id: true,
                        email: true,
                        surname: true,
                        telephone: true,
                        otherNames: true,
                        modmin: {
                            select: {
                                id: true,
                                email: true,
                                surname: true,
                                otherNames: true,
                            }
                        },
                    }
                },
            },
        })

        const headerRow = worksheet.addRow([
            'S/N', 'Customer Email', 'Customer Surname',
            'Customer Telephone', 'Customer Other Names',
            'Officer Email', 'Officer Surname', 'Officer Other Names',
            'Loan Amount', 'Management Fee', 'Application Fee', 'Equity',
            'Loan Tenure', 'Pre-Loan Amount', 'Pre-Loan Tenure',
            'Office Address', 'Salary Date', 'Salary Amount', 'Bank Name',
            'Bank Account Number', 'Outstanding Loans', 'Remarks',
            'Created At', 'Last Updated', 'Disbursed Date'
        ])

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 14 }
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
        })

        let sn = 0

        await Promise.all(loans.map(async (loan) => {
            const customer = loan.customer
            const modmin = customer.modmin
            sn += 1

            const remark = await this.hasLoanCompleted(loan.id) ? "COMPLETED" : "ONGOING"

            worksheet.addRow([
                sn,
                customer.email,
                customer.surname,
                customer.telephone,
                customer.otherNames,
                modmin.email,
                modmin.surname,
                modmin.otherNames,
                loan.loanAmount,
                loan.managementFee,
                loan.applicationFee,
                loan.equity,
                loan.loanTenure,
                loan.preLoanAmount,
                loan.preLoanTenure,
                loan.officeAddress,
                loan.salaryDate ? new Date(loan.salaryDate).toDateString() : '',
                loan.salaryAmount,
                loan.bankName,
                loan.bankAccNumber,
                loan.outstandingLoans,
                remark,
                new Date(loan.createdAt).toDateString(),
                new Date(loan.updatedAt).toDateString(),
                loan.disbursedDate ? new Date(loan.disbursedDate).toDateString() : ''
            ])
        }))

        worksheet.columns.forEach(column => {
            let maxLength = 0
            column.eachCell({ includeEmpty: true }, cell => {
                maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 10)
            })
            column.width = maxLength + 10
        })

        return await workbook.xlsx.writeBuffer() as Buffer
    }

    async exportLoan(
        res: Response,
        loanApplicationId: string,
        { sub, role }: ExpressUser,
    ) {
        try {
            const loan = await this.prisma.loanApplication.findUnique({
                where: role === "Admin" ? {
                    id: loanApplicationId
                } : {
                    id: loanApplicationId,
                    customer: { modminId: sub }
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            email: true,
                            surname: true,
                            telephone: true,
                            otherNames: true,
                            modmin: {
                                select: {
                                    id: true,
                                    email: true,
                                    surname: true,
                                    otherNames: true,
                                }
                            },
                        }
                    },
                    paybacks: true,
                },
            })

            if (!loan) {
                return this.response.sendError(res, StatusCodes.NotFound, "Loan Application not found")
            }

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'Omega Loans'
            const worksheet = workbook.addWorksheet(`Loan - ${loan.customer.surname}`)

            const headerRow = worksheet.addRow([
                'Customer Email', 'Customer Surname',
                'Customer Telephone', 'Customer Other Names',
                'Officer Email', 'Officer Surname', 'Officer Other Names',
                'Loan Amount', 'Management Fee', 'Application Fee', 'Equity',
                'Loan Tenure', 'Pre-Loan Amount', 'Pre-Loan Tenure',
                'Office Address', 'Salary Date', 'Salary Amount', 'Bank Name',
                'Bank Account Number', 'Outstanding Loans', 'Overall Remark',
                'Created At', 'Updated At', 'Disbursed Date',
                'Amount', 'Monthly Repayment', 'Payback Date', 'Interest', 'Paid', 'Remark'
            ])

            headerRow.eachCell((cell) => {
                cell.font = { bold: true, size: 14 }
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
            })

            const customer = loan.customer
            const modmin = customer.modmin

            const overallRemark = await this.hasLoanCompleted(loan.id) ? "COMPLETED" : "ONGOING"

            worksheet.addRow([
                customer.email,
                customer.surname,
                customer.telephone,
                customer.otherNames,
                modmin.email,
                modmin.surname,
                modmin.otherNames,
                loan.loanAmount,
                loan.managementFee,
                loan.applicationFee,
                loan.equity,
                loan.loanTenure,
                loan.preLoanAmount,
                loan.preLoanTenure,
                loan.officeAddress,
                loan.salaryDate ? format(new Date(loan.salaryDate), 'MMM dd, yyyy') : '',
                loan.salaryAmount,
                loan.bankName,
                loan.bankAccNumber,
                loan.outstandingLoans,
                overallRemark,
                format(new Date(loan.createdAt), 'MMM dd, yyyy'),
                format(new Date(loan.updatedAt), 'MMM dd, yyyy'),
                loan.disbursedDate ? format(new Date(loan.disbursedDate), 'MMM dd, yyyy') : ''
            ])

            loan.paybacks.forEach(payback => {
                const paybackDateFormatted = payback.payback_date ? format(new Date(payback.payback_date), 'MMM dd, yyyy') : ''
                const paidStatus = payback.paid ? 'Yes' : 'No'
                const remark = payback.paid ? 'PAID' : (new Date() > new Date(payback.payback_date) ? 'OVERDUE' : 'UPCOMING')

                worksheet.addRow([
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    payback.amount.toFixed(2),
                    payback.monthly_repayment.toFixed(2),
                    paybackDateFormatted,
                    payback.interest.toFixed(2),
                    paidStatus,
                    remark
                ])
            })

            worksheet.columns.forEach(column => {
                let maxLength = 0
                column.eachCell({ includeEmpty: true }, cell => {
                    maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 10)
                })
                column.width = maxLength + 2
            })

            const buffer = await workbook.xlsx.writeBuffer()
            return buffer
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
