import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutLivraison } from '@prisma/client';

export class FindLivraisonDto {
  @ApiProperty({ enum: StatutLivraison, required: false })
  @IsOptional()
  @IsEnum(StatutLivraison, { message: 'Statut de livraison invalide' })
  statut?: StatutLivraison;

  @ApiProperty({ required: false, example: 2, description: 'Filtrer par livreur' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idLivreur?: number;
}