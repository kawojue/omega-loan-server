import { Response } from 'express'
import { Role } from '@prisma/client'
import {
  Body, Controller, Delete, Get, Param,
  Patch,
  Post, Put, Query, Req, Res, UseGuards,
} from '@nestjs/common'
import { Roles } from 'src/role.decorator'
import { LoanService } from './loan.service'
import { AuthGuard } from '@nestjs/passport'
import {
  InfiniteScrollDTO, SearchDTO
} from 'src/customer/dto/infinite-scroll.dto'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LoanApplicationDTO } from './dto/apply-loan.dto'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'

@ApiTags("Loan")
@ApiBearerAuth()
@Controller('loan')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoanController {
  constructor(private readonly loanService: LoanService) { }

  @Post('loan-category')
  @Roles(Role.Admin)
  async addLoanCategory(
    @Res() res: Response,
    @Body() body: LoanCategoryDTO
  ) {
    await this.loanService.addLoanCategory(res, body)
  }

  @Get('loan-category')
  @Roles(Role.Admin, Role.Moderator)
  async listLoanCategory(
    @Res() res: Response,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.loanService.listLoanCategory(res, query)
  }

  @Put('loan-category/:categoryId')
  @Roles(Role.Admin)
  async editLoanCategory(
    @Res() res: Response,
    @Body() body: LoanCategoryDTO,
    @Param('categoryId') categoryId: string
  ) {
    await this.loanService.editLoanCategory(res, categoryId, body)
  }

  @Delete('loan-category/:categoryId')
  @Roles(Role.Admin)
  async removeLoanCategory(
    @Res() res: Response,
    @Param('categoryId') categoryId: string
  ) {
    await this.loanService.removeLoanCategory(res, categoryId)
  }

  @Post('/apply/:customerId')
  async applyLoanApplication(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: LoanApplicationDTO,
    @Param('customerId') customerId: string
  ) {
    await this.loanService.applyLoanApplication(res, customerId, req.user, body)
  }

  @Patch('/toogle-status/:loanId')
  async toggleLoanStatus(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('loanId') loanId: string
  ) {
    await this.loanService.toggleLoanStatus(res, loanId, req.user)
  }

  @Get('/fetch')
  async fetchLoans(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.loanService.fetchLoans(res, req.user, query)
  }

  @Get('/dropdown')
  async fetchLoansDropdown(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: SearchDTO
  ) {
    await this.loanService.fetchLoansDropdown(res, query, req.user)
  }
}
