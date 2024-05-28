type UserStatus = 'active' | 'suspended'
type Roles = 'User' | 'Admin' | 'Moderator'

interface ExpressUser extends Express.User {
    sub: string
    role: Roles
    userStatus?: UserStatus
}

interface IRequest extends Request {
    user: ExpressUser
}

interface JwtPayload {
    sub: string
    role: Roles
    status?: UserStatus
}

interface CloudinaryModuleOptions {
    cloudName: string
    apiKey: string
    apiSecret: string
}

interface FileDest {
    folder: string
    resource_type: 'image' | 'video'
}

interface Attachment {
    public_id: string
    public_url: string
    secure_url: string
}