import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { MiscService } from 'lib/misc.service'
import { AuthModule } from './auth/auth.module'
import { LoanModule } from './loan/loan.module'
import { AppController } from './app.controller'
import { ModminModule } from './modmin/modmin.module'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { CustomerModule } from './customer/customer.module'
import cloudinaryConfig from './cloudinary/cloudinary.config'
import { GuarantorModule } from './guarantor/guarantor.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [cloudinaryConfig],
    }),
    AuthModule,
    LoanModule,
    ModminModule,
    CustomerModule,
    GuarantorModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    MiscService,
    ResponseService,
    EncryptionService,
  ],
})
export class AppModule { }
