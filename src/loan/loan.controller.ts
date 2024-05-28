import {
  Body, Controller, Delete, Get, Param,
  Post, Put, Query, Req, Res, UseGuards,
} from '@nestjs/common'
import { LoanService } from './loan.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { LoanCategoryDTO } from './dto/loan-catogory.dto'
import { InfiniteScrollDTO } from 'src/customer/dto/infinite-scroll.dto'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { Roles } from 'src/role.decorator'
import { Role } from '@prisma/client'
import { LoanApplicationDTO } from './dto/apply-loan.dto'

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

  @Post('/apply/customerId')
  async applyLoanApplication(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: LoanApplicationDTO,
    @Param('customerId') customerId: string
  ) {
    await this.loanService.applyLoanApplication(res, customerId, req.user, body)
  }
}
