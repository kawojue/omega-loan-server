import { Response } from 'express'
import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { StatusCodes } from 'enums/statusCodes'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

    async generateNewAccessToken({ sub, role, status }: JwtPayload) {
        return await this.jwtService.signAsync({ sub, role, status }, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1d'
        })
    }

    async login(res: Response, { email, password }) {
        try {
            const modmin = await this.prisma.modmin.findUnique({
                where: { email }
            })

            if (!modmin) {
                return this.response.sendError(res, StatusCodes.NotFound, "Account does not exist")
            }

            if (modmin.status === "suspended") {
                return this.response.sendError(res, StatusCodes.Forbidden, "Account has been suspended")
            }

            const isMatch = await this.encryption.compareAsync(password, modmin.password)

            if (!isMatch) {
                return this.response.sendError(res, StatusCodes.Unauthorized, "Incorrect password")
            }

            const access_token = await this.generateNewAccessToken({
                sub: modmin.id,
                role: modmin.role,
                status: modmin.status,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Login Successful",
                data: {
                    role: modmin.role,
                    email: modmin.email,
                    surname: modmin.surname,
                    otherNames: modmin.otherNames,
                },
                access_token,
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }

    async me(res: Response, { sub }: ExpressUser) {
        const profile = await this.prisma.modmin.findUnique({
            where: { id: sub },
            select: {
                role: true,
                email: true,
                gender: true,
                status: true,
                surname: true,
                createdAt: true,
                otherNames: true,
            }
        })

        if (!profile) {
            return this.response.sendError(res, StatusCodes.NotFound, "Profile not found")
        }

        this.response.sendSuccess(res, StatusCodes.OK, { data: profile })
    }
}
