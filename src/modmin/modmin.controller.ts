import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ModminService } from './modmin.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { AuthGuard } from '@nestjs/passport'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'
import { CreateModeratorDTO } from 'src/auth/dto/moderator.dto'
import { Response } from 'express'

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

  @Get('/moderators/dropdown')
  @Roles(Role.Admin)
  async guarantorsDropdown(
    @Res() res: Response,
    @Query() query: SearchDTO,
  ) {
    await this.modminService.moderatorsDropdown(res, query)
  }
}
