import {
    IsEnum,
    IsString,
    MinLength,
    IsNotEmpty,
    IsEmail,
    IsOptional,
} from 'class-validator'
import { Gender } from '@prisma/client'
import { Transform } from 'class-transformer'
import { ApiProperty, PartialType } from '@nestjs/swagger'
import { titleText, toLowerCase } from 'helpers/transformer'

export class CreateGuarantorDTO {
    @ApiProperty({
        example: 'ABC XYZ',
        required: true,
    })
    @MinLength(3)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => titleText(value))
    name: string

    @ApiProperty({
        example: 'abc@xyz.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    @Transform(({ value }) => toLowerCase(value))
    email: string

    @ApiProperty({
        example: '11, qwerty street, dotcom road',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    address: string

    @ApiProperty({ example: 'Male', required: true })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender: Gender

    @ApiProperty({
        example: 'Nigeria',
        required: false,
    })
    @IsString()
    @IsOptional()
    nationality: string

    @ApiProperty({
        example: 'Company XYZ',
        required: false,
    })
    @IsString()
    @IsOptional()
    placeOfWork: string

    @ApiProperty({
        example: '123 Business St',
        required: false,
    })
    @IsString()
    @IsOptional()
    addressOfBusiness: string

    @ApiProperty({
        example: '456 Home St',
        required: false,
    })
    @IsString()
    @IsOptional()
    homeAddress: string

    @ApiProperty({
        example: '+2341234567890',
        required: false,
    })
    @IsString()
    @IsOptional()
    telephone1: string

    @ApiProperty({
        example: '+2349087654321',
        required: false,
    })
    @IsString()
    @IsOptional()
    telephone2: string

    @ApiProperty({
        example: 'Manager',
        required: false,
    })
    @IsString()
    @IsOptional()
    positionHeld: string
}

export class UpdateGuarantorDTO extends PartialType(CreateGuarantorDTO) { }