import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { MiscService } from 'lib/misc.service'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from 'src/jwt/jwt.strategy'
import { PrismaService } from 'lib/prisma.service'
import { AuthController } from './auth.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'

@Module({
  imports: [
    JwtModule, CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    MiscService,
    PrismaService,
    ConfigService,
    ResponseService,
    EncryptionService,
  ],
})
export class AuthModule { }
