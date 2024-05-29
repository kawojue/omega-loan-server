import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { LoanService } from './loan.service'
import { MiscService } from 'lib/misc.service'
import { PassportModule } from '@nestjs/passport'
import { LoanController } from './loan.controller'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'

@Module({
  imports: [
    JwtModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [LoanController],
  providers: [
    LoanService,
    MiscService,
    PrismaService,
    ResponseService,
  ],
})
export class LoanModule { }
