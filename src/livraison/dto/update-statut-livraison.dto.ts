import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutLivraison } from '@prisma/client';

export class UpdateStatutLivraisonDto {
  @ApiProperty({ enum: StatutLivraison, example: StatutLivraison.EN_ROUTE })
  @IsEnum(StatutLivraison, { message: 'Statut de livraison invalide' })
  statut: StatutLivraison;
}