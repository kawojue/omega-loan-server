import { YesNo, LoanType } from '.prisma/client'
import { ApiProperty, PartialType } from '@nestjs/swagger'
import {
    IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min
} from 'class-validator'

export class LoanApplicationDTO {
    @ApiProperty({ example: 'SalaryLoan' })
    @IsNotEmpty()
    @IsEnum(LoanType)
    loanType: LoanType

    @ApiProperty({ example: 50000 })
    @IsNotEmpty()
    @IsNumber()
    loanAmount: number

    @ApiProperty({ example: 2500 })
    @IsNotEmpty()
    @IsNumber()
    managementFee: number

    @ApiProperty({ example: 3000 })
    @IsNotEmpty()
    @IsNumber()
    applicationFee: number

    @ApiProperty({ example: 10000 })
    @IsNotEmpty()
    @IsNumber()
    equity: number

    @ApiProperty({ example: '2023-04-22' })
    @IsOptional()
    disbursedDate: Date

    @ApiProperty({ example: 9 })
    @IsNotEmpty()
    @IsNumber()
    @Max(12)
    @Min(1)
    loanTenure: number

    @ApiProperty({ example: 1500 })
    @IsNotEmpty()
    @IsNumber()
    preLoanAmount?: number

    @ApiProperty({ example: 6 })
    @IsOptional()
    @IsNumber()
    @Max(12)
    @Min(1)
    preLoanTenure?: number

    @ApiProperty({ example: '123 Main St, City' })
    @IsNotEmpty()
    @IsString()
    officeAddress: string

    @ApiProperty({ example: '2024-02-23' })
    @IsOptional()
    salaryDate?: Date

    @ApiProperty({ example: 50000 })
    @IsOptional()
    @IsNumber()
    salaryAmount?: number

    @ApiProperty({ example: 'ABC Bank' })
    @IsNotEmpty()
    @IsString()
    bankName: string

    @ApiProperty({ example: '1234567890' })
    @IsNotEmpty()
    @IsString()
    bankAccNumber: string

    @ApiProperty({ example: 'Yes' })
    @IsNotEmpty()
    @IsEnum(YesNo)
    outstandingLoans: YesNo
}

export class UpdateLoanApplicationDTO extends PartialType(LoanApplicationDTO) { }