import { Module } from '@nestjs/common'
import { LoanService } from './loan.service'
import { LoanController } from './loan.controller'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from 'lib/prisma.service'
import { PassportModule } from '@nestjs/passport'
import { ResponseService } from 'lib/response.service'
import { MiscService } from 'lib/misc.service'

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
