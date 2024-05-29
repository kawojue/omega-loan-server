import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { MiscService } from 'lib/misc.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { GuarantorService } from './guarantor.service'
import { ResponseService } from 'lib/response.service'
import { GuarantorController } from './guarantor.controller'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

@Module({
  imports: [
    JwtModule, CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [GuarantorController],
  providers: [
    GuarantorService,
    ConfigService,
    PrismaService,
    MiscService,
    ResponseService,
    CloudinaryService,
  ],
})
export class GuarantorModule { }
