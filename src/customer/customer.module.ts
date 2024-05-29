import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { MiscService } from 'lib/misc.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { CustomerService } from './customer.service'
import { ResponseService } from 'lib/response.service'
import { CustomerController } from './customer.controller'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

@Module({
  imports: [
    JwtModule, CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    ConfigService,
    PrismaService,
    MiscService,
    ResponseService,
    CloudinaryService,
  ],
})
export class CustomerModule { }
