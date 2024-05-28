import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { MiscService } from 'lib/misc.service'
import { AuthModule } from './auth/auth.module'
import { AppController } from './app.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { CustomerModule } from './customer/customer.module'
import cloudinaryConfig from './cloudinary/cloudinary.config'
import { CloudinaryModule } from './cloudinary/cloudinary.module'
import { LoanModule } from './loan/loan.module';
import { ModminModule } from './modmin/modmin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [cloudinaryConfig],
    }),
    CloudinaryModule,
    AuthModule,
    CustomerModule,
    LoanModule,
    ModminModule,
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
