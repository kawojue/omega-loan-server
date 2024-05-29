import { Response } from 'express'
import { ApiTags } from '@nestjs/swagger'
import { LoginDTO } from './dto/auth.dto'
import { AuthService } from './auth.service'
import { Body, Controller, Post, Res } from '@nestjs/common'

ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    await this.authService.login(res, body)
  }
}
