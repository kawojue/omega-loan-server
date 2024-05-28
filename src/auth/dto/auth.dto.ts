import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { toLowerCase } from 'helpers/transformer'
import { IsEmail, IsString } from 'class-validator'

export class LoginDTO {
    @ApiProperty({
        example: 'kawojue08@gmail.com'
    })
    @IsEmail()
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({
        example: 'Mypswd123'
    })
    @IsString()
    password: string
}