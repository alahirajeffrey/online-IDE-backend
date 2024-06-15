import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ default: 1 })
  @Type(() => Number)
  page: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ default: 10 })
  @Type(() => Number)
  pageSize: number;
}
