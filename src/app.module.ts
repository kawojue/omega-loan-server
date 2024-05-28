import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { MiscService } from 'lib/misc.service'
import { AuthModule } from './auth/auth.module'
import { AppController } from './app.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import cloudinaryConfig from './cloudinary/cloudinary.config'
import { CloudinaryModule } from './cloudinary/cloudinary.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [cloudinaryConfig],
    }),
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MiscService,
    ResponseService,
    EncryptionService,
  ],
})
export class AppModule { }
