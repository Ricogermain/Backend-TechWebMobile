import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatutLivraison } from '@prisma/client';

export class UpdateStatutLivraisonDto {
  @ApiProperty({ enum: StatutLivraison, example: StatutLivraison.LIVREE })
  @IsEnum(StatutLivraison, { message: 'Statut de livraison invalide' })
  statut: StatutLivraison;

  @ApiProperty({ example: '2026-08-05T14:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Date de livraison invalide' })
  dateLivraison?: string;
}