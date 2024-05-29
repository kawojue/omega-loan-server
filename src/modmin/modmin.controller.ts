import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { ModminService } from './modmin.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CreateModeratorDTO } from './dto/moderator.dto'
import {
  Body, Controller, Get, Param, Patch, Post, Put, Query, Req, Res, UseGuards
} from '@nestjs/common'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'
import { UpdateCustomerDTO } from 'src/customer/dto/customer.dto'

@ApiTags("Modmin")
@Controller('modmin')
export class ModminController {
  constructor(private readonly modminService: ModminService) { }

  // @Post('/signup')
  async signup(
    @Res() res: Response,
    @Body() body: CreateModeratorDTO
  ) {
    await this.modminService.signup(res, body)
  }

  @ApiBearerAuth()
  @Get('/moderators')
  @Roles(Role.Admin, Role.Moderator)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async fetchCustomers(
    @Res() res: Response,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.modminService.fetchModerators(res, query)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Post('/moderators/add')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async addModerator(
    @Res() res: Response,
    @Body() body: CreateModeratorDTO
  ) {
    await this.modminService.addModerator(res, body)
  }

  @ApiBearerAuth()
  @Put('/moderators/:moderatorId')
  @Roles(Role.Admin)
  async updateModerator(
    @Res() res: Response,
    @Body() body: UpdateCustomerDTO,
    @Param('moderatorId') moderatorId: string
  ) {
    await this.modminService.updateModerator(res, moderatorId, body)
  }

  @ApiBearerAuth()
  @Get('/moderators/dropdown')
  @Roles(Role.Admin)
  async moderatorsDropdown(
    @Res() res: Response,
    @Query() query: SearchDTO,
  ) {
    await this.modminService.moderatorsDropdown(res, query)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Patch('/toggle-status')
  async toggleStatus(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('moderatorId') moderatorId: string,
  ) {
    await this.modminService.toggleStatus(res, moderatorId, req.user)
  }
}
