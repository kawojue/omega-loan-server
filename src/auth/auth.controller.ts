import { Response } from 'express'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LoginDTO } from './dto/auth.dto'
import { AuthService } from './auth.service'
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common'

ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.authService.login(res, body)
  }
}
