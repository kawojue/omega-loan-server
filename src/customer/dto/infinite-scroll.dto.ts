import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class SearchDTO {
    @ApiProperty({
        example: 'kawojue'
    })
    @IsString()
    @IsOptional()
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