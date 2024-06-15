import { LoanType } from '@prisma/client'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class SearchDTO {
    @ApiProperty({
        example: 'kawojue'
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value.trim())
    search?: string
}

export class InfiniteScrollDTO extends SearchDTO {
    @ApiProperty({
        example: 1
    })
    @IsOptional()
    page?: number

    @ApiProperty({
        example: 30
    })
    @IsOptional()
    limit?: number
}

export class LoanPaginationDTO {
    @ApiProperty({
        example: 1
    })
    @IsOptional()
    page?: number

    @ApiProperty({
        example: 30
    })
    @IsOptional()
    limit?: number

    @ApiProperty({
        enum: LoanType
    })
    @IsOptional()
    @IsEnum(LoanType)
    type?: LoanType
}

export class FetchLoansByLoanTypeDTO extends InfiniteScrollDTO {
    @ApiProperty({
        enum: LoanType
    })
    @IsEnum(LoanType)
    type: LoanType
}