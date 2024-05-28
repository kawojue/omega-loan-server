import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'
import { StatusCodes } from 'enums/statusCodes'
import { Response } from 'express'
import { InfiniteScrollDTO } from 'src/customer/dto/infinite-scroll.dto'

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
}
