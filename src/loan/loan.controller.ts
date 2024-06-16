import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { LoanService } from './loan.service'
import { AuthGuard } from '@nestjs/passport'
import {
  Body, Controller, Delete, Param, Patch,
  Post, Put, Query, Req, Res, Get, UseGuards,
  HttpException,
} from '@nestjs/common'
import {
  FetchLoansDTO, InfiniteScrollDTO, SearchDTO
} from 'src/customer/dto/infinite-scroll.dto'
import { StatusCodes } from 'enums/statusCodes'
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

  @Roles(Role.Admin, Role.Moderator)
  @Get('loan-category/:categoryId')
  async getLoanCategory(
    @Res() res: Response,
    @Param('categoryId') categoryId: string
  ) {
    await this.loanService.getLoanCategory(res, categoryId)
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

  @Roles(Role.Admin)
  @Get('/loans-by-officers/:moderatorId')
  async fetchLoansByModerator(@Res() res: Response, @Param('moderatorId') moderatorId: string) {
    await this.loanService.fetchLoansByModerator(res, moderatorId)
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
    @Query() query: FetchLoansDTO
  ) {
    await this.loanService.fetchLoans(res, req.user, query)
  }

  @Roles(Role.Admin)
  @Delete('/remove/:loanApplicationId')
  async deleteLoanApplication(
    @Res() res: Response,
    @Param('loanApplicationId') loanApplicationId: string
  ) {
    await this.loanService.deleteLoanApplication(res, loanApplicationId)
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

  @Get('/export')
  @Roles(Role.Admin, Role.Moderator)
  async exportLoans(@Res() res: Response, @Req() req: IRequest) {
    try {
      const excelData: Buffer = await this.loanService.exportLoans(req.user)

      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=loans.xlsx',
        'Content-Length': excelData.length
      })

      res.end(excelData)
    } catch (err) {
      console.error(err)
      throw new HttpException("Error downloading report", StatusCodes.InternalServerError)
    }
  }

  @Get('/export/:loanApplicationId')
  @Roles(Role.Admin, Role.Moderator)
  async exportLoan(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('loanApplicationId') loanApplicationId: string
  ) {
    try {
      const excelData: Buffer = await this.loanService.exportLoan(res, loanApplicationId, req.user)

      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=loan.xlsx',
        'Content-Length': excelData.length
      })

      res.end(excelData)
    } catch (err) {
      console.error(err)
      throw new HttpException("Error downloading report", StatusCodes.InternalServerError)
    }
  }
}
