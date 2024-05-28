import { Injectable } from '@nestjs/common'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { ResponseService } from 'lib/response.service'
import { EncryptionService } from 'lib/encryption.service'
import { Response } from 'express'
import { StatusCodes } from 'enums/statusCodes'

@Injectable()
export class AuthService {
    constructor(
        private readonly misc: MiscService,
        private readonly prisma: PrismaService,
        private readonly response: ResponseService,
        private readonly encryption: EncryptionService,
    ) { }

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

            }

            const access_token = await this.misc.generateNewAccessToken({
                sub: modmin.id,
                role: modmin.role,
            })

            this.response.sendSuccess(res, StatusCodes.OK, {
                message: "Login Successful",
                data: {
                    role: modmin.role,
                    email: modmin.email,
                },
                access_token,
            })
        } catch (err) {
            this.misc.handleServerError(res, err)
        }
    }
}
