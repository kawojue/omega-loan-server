import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MiscService } from 'lib/misc.service'
import { ModminService } from './modmin.service'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from 'lib/prisma.service'
import { ModminController } from './modmin.controller'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'

@Module({
  imports: [
    JwtModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ModminController],
  providers: [
    ModminService,
    MiscService,
    PrismaService,
    ResponseService,
    EncryptionService,
  ],
})
export class ModminModule { }
