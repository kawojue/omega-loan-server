import { Response } from 'express'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LoginDTO } from './dto/auth.dto'
import { AuthService } from './auth.service'
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { InfiniteScrollDTO, SearchDTO } from 'src/customer/dto/infinite-scroll.dto'
import { CreateModeratorDTO } from './dto/moderator.dto'

ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.authService.login(res, body)
  }

  @ApiBearerAuth()
  @Get('/moderators')
  @Roles(Role.Admin, Role.Moderator)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async fetchCustomers(
    @Res() res: Response,
    @Query() query: InfiniteScrollDTO
  ) {
    await this.authService.fetchModerators(res, query)
  }

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @Post('/moderators/add')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async addModerator(
    @Res() res: Response,
    @Body() body: CreateModeratorDTO
  ) {
    await this.authService.addModerator(res, body)
  }

  @Get('/moderators/dropdown')
  @Roles(Role.Admin)
  async guarantorsDropdown(
    @Res() res: Response,
    @Query() query: SearchDTO,
  ) {
    await this.authService.moderatorsDropdown(res, query)
  }
}
