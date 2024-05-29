import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { StatusCodes } from 'enums/statusCodes'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import {
  Req, Res, UploadedFiles, Param, UseInterceptors,
  Body, Controller, Get, UseGuards, Post, Put, Query,
  Delete,
} from '@nestjs/common'
import { ResponseService } from 'lib/response.service'
import { GuarantorService } from './guarantor.service'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { CreateGuarantorDTO, UpdateGuarantorDTO } from './dto/guarantor.dto'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'

@ApiBearerAuth()
@ApiTags("Guarantor")
@Controller('guarantor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GuarantorController {
  constructor(
    private readonly response: ResponseService,
    private readonly guarantorService: GuarantorService
  ) { }

  @ApiConsumes('multipart/form-data', 'image/png', 'image/jpeg')
  @ApiOperation({
    summary: 'cardImage, photograph'
  })
  @Post('/create/:customerId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'photograph', maxCount: 1 },
    ]),
  )
  @Roles(Role.Admin, Role.Moderator)
  async createGuarantor(
    @Res() res: Response,
    @Req() req: IRequest,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[]
      photograph?: Express.Multer.File[]
    },
    @Body() guarantorDto: CreateGuarantorDTO,
    @Param('customerId') customerId: string,
  ) {
    if (!files.cardImage?.length || !files.photograph?.length) {
      return this.response.sendError(res, StatusCodes.BadRequest, "Photograph & Means of ID are required")
    }

    await this.guarantorService.createGuarantor(res, customerId, req.user, files.cardImage[0], files.photograph[0], guarantorDto)
  }

  @ApiConsumes('multipart/form-data', 'image/png', 'image/jpeg')
  @ApiOperation({
    summary: 'cardImage, photograph'
  })
  @Put('/update/:guarantorId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'photograph', maxCount: 1 },
    ]),
  )
  @Roles(Role.Admin)
  async updateGuarantor(
    @Res() res: Response,
    @Req() req: IRequest,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File[]
      photograph?: Express.Multer.File[]
    },
    @Body() guarantorDto: UpdateGuarantorDTO,
    @Param('guarantorId') guarantorId: string,
  ) {
    const cardImage = files.cardImage
    const photograph = files.photograph

    await this.guarantorService.updateGuarantor(res, guarantorId, req.user, guarantorDto, cardImage?.length ? cardImage[0] : undefined, photograph?.length ? photograph[0] : undefined)
  }

  @Get('/fetch/all')
  @Roles(Role.Admin, Role.Moderator)
  async fetchAllGuarantors(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.guarantorService.fetchAllGuarantors(res, query, req.user)
  }

  @ApiOperation({
    summary: "Fetches the customer's guarantors"
  })
  @Get('/fetch/all/:customerId')
  @Roles(Role.Admin, Role.Moderator)
  async fetchCustomerGuarantors(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: InfiniteScrollDTO,
    @Param('customerId') customerId: string,
  ) {
    await this.guarantorService.fetchCustomerGuarantors(res, query, req.user, customerId)
  }

  @Roles(Role.Admin, Role.Moderator)
  @Get('/get/:guarantorId')
  async fetchGuarantor(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('guarantorId') guarantorId: string
  ) {
    await this.guarantorService.fetchGuarantor(res, guarantorId, req.user)
  }

  @Get('/dropdown')
  @Roles(Role.Admin, Role.Moderator)
  async guarantorsDropdown(
    @Res() res: Response,
    @Req() req: IRequest,
    @Query() query: SearchDTO,
  ) {
    await this.guarantorService.guarantorsDropdown(res, query, req.user)
  }

  @Delete('/remove/:guarantorId')
  @Roles(Role.Admin)
  async deleteGuarantor(
    @Res() res: Response,
    @Param('guarantorId') guarantorId: string,
  ) {
    await this.guarantorService.deleteGuarantor(res, guarantorId)
  }
}
