import { Reflector } from '@nestjs/core'
import { MiscService } from 'lib/misc.service'
import { PrismaService } from 'lib/prisma.service'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private reflector: Reflector,
        private misc: MiscService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler())
        if (!roles) return true

        const ctx = context.switchToHttp()
        const request = ctx.getRequest()

        const token = request.headers.authorization?.split('Bearer ')[1]
        if (!token) return false

        try {
            const decoded = await this.misc.validateAndDecodeToken(token)
            if (decoded?.sub) {
                return this.prisma.modmin.findUnique({
                    where: { id: decoded.sub }
                }).then(user => {
                    if ((decoded.status !== user.status) || (decoded.status === 'suspended')) return false
                    request.user = decoded
                    return roles.includes(decoded.role)
                }).catch(err => {
                    console.error(err)
                    return false
                })
            }
            request.user = decoded
            return roles.includes(decoded.role)
        } catch (error) {
            return false
        }
    }
}