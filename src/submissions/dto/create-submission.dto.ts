import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sourceCode: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  languageId: number;

  @IsNotEmpty()
  @IsNotEmpty()
  @ApiProperty()
  problemId: string;
}
