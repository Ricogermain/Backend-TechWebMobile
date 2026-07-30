import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBooleanString } from 'class-validator';

export class FindVehiculesDto {
  @ApiProperty({ required: false, example: 'true', description: 'Filtrer par disponibilité' })
  @IsOptional()
  @IsBooleanString({ message: 'disponible doit être true ou false' })
  disponible?: string;
}