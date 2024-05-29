import { Response } from 'express'
import { Role } from '@prisma/client'
import { LoginDTO } from './dto/auth.dto'
import { Roles } from 'src/role.decorator'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { RolesGuard } from 'src/jwt/jwt-auth.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.authService.login(res, body)
  }

  @Get('/me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async me(@Res() res: Response, @Req() req: IRequest) {
    await this.authService.me(res, req.user)
  }
}
