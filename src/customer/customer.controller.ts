import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import {
  Body, Controller, Get, Param, Post, Query, Req,
  Res, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { CustomerService } from './customer.service'
import { CreateCustomerDto } from './dto/customer.dto'
import { InfiniteScrollDTO } from './dto/infinite-scroll.dto'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags("Customer")
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Post('/create')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'photograph', maxCount: 1 },
    ]),
  )
  @Roles(Role.Admin, Role.Moderator)
  async createCustomer(
    @Res() res: Response,
    @Req() req: IRequest,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[]
      photograph?: Express.Multer.File[]
    },
    @Body() customerDto: CreateCustomerDto,
  ) {
    await this.customerService.createCustomer(res, req.user, customerDto, files.cardImage[0], files.photograph[0])
  }

  @Get('/fetch')
  @Roles(Role.Admin, Role.Moderator)
  async fetchCustomers(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.customerService.fetchCustomers(res, query, req.user)
  }

  @Get('/fetch/:customerId')
  @Roles(Role.Admin, Role.Moderator)
  async fetchCustomer(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('customerId') customerId: string,
  ) {
    await this.customerService.fetchCustomer(res, req.user, customerId)
  }

  @Get('/guarantors/all')
  @Roles(Role.Admin, Role.Moderator)
  async fetchAllGuarantors(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.customerService.fetchAllGuarantors(res, query, req.user)
  }

  @ApiOperation({
    summary: "Fetches the customer guarantors"
  })
  @Get('/guarantors/:customerId')
  @Roles(Role.Admin, Role.Moderator)
  async fetchCustomerGuarantors(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: InfiniteScrollDTO,
    @Param('customerId') customerId: string,
  ) {
    await this.customerService.fetchCustomerGuarantors(res, query, req.user, customerId)
  }
}
