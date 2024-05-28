import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    IsEnum,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { Gender, cardType } from '.prisma/client'
import { titleText, toLowerCase } from 'helpers/transformer'

export class CreateCustomerDto {
    @ApiProperty({ example: 'Kawojue', required: true })
    @MinLength(3)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => titleText(value))
    surname: string

    @ApiProperty({ example: 'Raheem Olumuyiwa', required: true })
    @MinLength(3)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => titleText(value))
    otherNames: string

    @ApiProperty({ example: 'Male', required: true })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender: Gender

    @ApiProperty({ example: 'alwaysappear@gmail.com', required: true })
    @IsEmail()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({ example: '123 Main St', required: false })
    @IsString()
    @IsOptional()
    address: string

    @ApiProperty({ example: '1000', required: true })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    membership_fee: string

    @ApiProperty({ example: 'Nigeria', required: false })
    @IsString()
    @IsOptional()
    nationality: string

    @ApiProperty({ example: 'NIN', required: false })
    @IsEnum(cardType)
    @IsOptional()
    cardType: cardType

    @ApiProperty({ example: '123 Home St', required: false })
    @IsString()
    @IsOptional()
    homeAddress: string

    @ApiProperty({ example: '456 Office Rd', required: false })
    @IsString()
    @IsOptional()
    officeAddress: string

    @ApiProperty({ example: '1234567890', required: false })
    @IsString()
    @IsOptional()
    telephone: string
}