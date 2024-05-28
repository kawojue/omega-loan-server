import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"

export class LoanCategoryDTO {
    @ApiProperty({
        example: 'Will'
    })
    @IsString()
    name: string

    @ApiProperty({
        example: 20_000
    })
    @IsNumber()
    amount: number
}