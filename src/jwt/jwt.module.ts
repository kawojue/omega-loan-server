import { Global, Module } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'

@Global()
@Module({
    imports: [
        NestJwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
            global: true,
        }),
    ],
    providers: [JwtStrategy],
    exports: [NestJwtModule],
})
export class JwtModule { }