import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { LoanService } from './loan.service'
import { AuthGuard } from '@nestjs/passport'
import {
  Body, Controller, Delete, Param, Patch,
  Post, Put, Query, Req, Res, Get, UseGuards,
} from '@nestjs/common'
import {
  InfiniteScrollDTO, SearchDTO
} from 'src/customer/dto/infinite-scroll.dto'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'
import { LoanApplicationDTO, UpdateLoanApplicationDTO } from './dto/apply-loan.dto'

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
  @Roles(Role.Admin, Role.Moderator)
  async applyLoanApplication(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: LoanApplicationDTO,
    @Param('customerId') customerId: string
  ) {
    await this.loanService.applyLoanApplication(res, customerId, req.user, body)
  }

  @Get('/get/:loanApplicationId')
  @Roles(Role.Admin, Role.Moderator)
  async getLoanApplication(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('loanApplicationId') loanApplicationId: string
  ) {
    await this.loanService.getLoanApplication(res, loanApplicationId, req.user)
  }

  @Roles(Role.Admin)
  @Put('/edit/:loanApplicationId')
  async editLoanApplication(
    @Res() res: Response,
    @Body() body: UpdateLoanApplicationDTO,
    @Param('loanApplicationId') loanApplicationId: string
  ) {
    await this.loanService.editLoanApplication(res, loanApplicationId, body)
  }

  @Patch('/toogle-status/:loanId')
  @Roles(Role.Admin, Role.Moderator)
  async toggleLoanStatus(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('loanId') loanId: string
  ) {
    await this.loanService.toggleLoanStatus(res, loanId, req.user)
  }

  @Get('/fetch')
  @Roles(Role.Admin, Role.Moderator)
  async fetchLoans(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.loanService.fetchLoans(res, req.user, query)
  }

  @Get('/dropdown')
  @Roles(Role.Admin, Role.Moderator)
  async fetchLoansDropdown(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: SearchDTO
  ) {
    await this.loanService.fetchLoansDropdown(res, query, req.user)
  }
}
