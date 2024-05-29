import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { StatusCodes } from 'enums/statusCodes'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { CustomerService } from './customer.service'
import { ResponseService } from 'lib/response.service'
import {
  Res, UploadedFiles, UseGuards, UseInterceptors, Req,
  Body, Controller, Delete, Get, Param, Post, Put, Query,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { InfiniteScrollDTO, SearchDTO } from './dto/infinite-scroll.dto'
import { CreateCustomerDTO, UpdateCustomerDTO } from './dto/customer.dto'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiBearerAuth()
@ApiTags("Customer")
@Controller('customer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomerController {
  constructor(
    private readonly response: ResponseService,
    private readonly customerService: CustomerService
  ) { }

  @ApiConsumes('multipart/form-data', 'image/png', 'image/jpeg')
  @ApiOperation({
    summary: 'cardImage, photograph'
  })
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
    @Body() customerDto: CreateCustomerDTO,
  ) {
    if (!files.cardImage?.length || !files.photograph?.length) {
      return this.response.sendError(res, StatusCodes.BadRequest, "Photograph & Means of ID are required")
    }

    await this.customerService.createCustomer(res, req.user, customerDto, files.cardImage[0], files.photograph[0])
  }

  @ApiConsumes('multipart/form-data', 'image/png', 'image/jpeg')
  @ApiOperation({
    summary: 'cardImage, photograph'
  })
  @Put('/update/:customerId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'photograph', maxCount: 1 },
    ]),
  )
  @Roles(Role.Admin)
  async updateCustomer(
    @Res() res: Response,
    @Req() req: IRequest,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[]
      photograph?: Express.Multer.File[]
    },
    @Body() customerDto: UpdateCustomerDTO,
    @Param('customerId') customerId: string,
  ) {
    const cardImage = files.cardImage
    const photograph = files.photograph

    await this.customerService.updateCustomer(res, req.user, customerId, customerDto, cardImage?.length ? cardImage[0] : undefined, photograph?.length ? photograph[0] : undefined)
  }

  @Delete('/remove/:customerId')
  @Roles(Role.Admin)
  async deleteCustomer(
    @Res() res: Response,
    @Param('customerId') customerId: string,
  ) {
    await this.customerService.deleteCustomer(res, customerId)
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

  @Get('/dropdown')
  @Roles(Role.Admin, Role.Moderator)
  async customersDropdown(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: SearchDTO,
  ) {
    await this.customerService.customersDropdown(res, query, req.user)
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
}
