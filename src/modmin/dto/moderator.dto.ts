import { Gender } from '@prisma/client'
import { Transform } from 'class-transformer'
import { ApiProperty, PartialType } from '@nestjs/swagger'
import { titleText, toLowerCase } from 'helpers/transformer'
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator'

export class CreateModeratorDTO {
    @ApiProperty({
        example: 'John',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({ value }) => titleText(value))
    surname: string

    @ApiProperty({
        example: 'Doe',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({ value }) => titleText(value))
    otherNames: string

    @ApiProperty({
        example: 'admin@omega.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({
        example: 'admin123',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    password: string

    @ApiProperty({ example: 'Male', required: false })
    @IsNotEmpty()
    @IsEnum(Gender)
    gender: Gender
}

export class UpdateModeratorDTO extends PartialType(CreateModeratorDTO) { }