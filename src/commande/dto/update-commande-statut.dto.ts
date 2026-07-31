import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutCommande } from '@prisma/client';

export class UpdateCommandeStatutDto {
  @ApiProperty({ enum: StatutCommande, example: StatutCommande.CONFIRMEE })
  @IsEnum(StatutCommande, { message: 'Statut invalide' })
  statut: StatutCommande;
}