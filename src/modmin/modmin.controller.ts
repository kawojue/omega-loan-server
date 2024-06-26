import { Response } from 'express'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { ModminService } from './modmin.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CreateModeratorDTO, UpdateModeratorDTO } from './dto/moderator.dto'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res, UseGuards
} from '@nestjs/common'

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
  async fetchModerators(
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
  @Get('/moderators/dropdown')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async moderatorsDropdown(@Res() res: Response, @Query() query: SearchDTO) {
    await this.modminService.moderatorsDropdown(res, query)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Put('/moderators/:moderatorId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateModerator(
    @Res() res: Response,
    @Body() body: UpdateModeratorDTO,
    @Param('moderatorId') moderatorId: string
  ) {
    await this.modminService.updateModerator(res, moderatorId, body)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Get('/moderators/:moderatorId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getModerator(@Res() res: Response, @Param('moderatorId') moderatorId: string) {
    await this.modminService.getModerator(res, moderatorId)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Patch('/toggle-status/:moderatorId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async toggleStatus(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('moderatorId') moderatorId: string,
  ) {
    await this.modminService.toggleStatus(res, moderatorId, req.user)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Moderator)
  @Get('/analytics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async analytics(
    @Res() res: Response,
    @Req() req: IRequest,
  ) {
    await this.modminService.analytics(res, req.user)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Delete('/remove/:modminId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async deleteModmin(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('modminId') modminId: string
  ) {
    await this.modminService.deleteModmin(res, modminId, req.user)
  }
}
