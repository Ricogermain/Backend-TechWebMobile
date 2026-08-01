import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignerLivreurDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive({ message: "L'identifiant du livreur doit être positif" })
  idLivreur: number;
}