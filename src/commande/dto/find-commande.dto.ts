import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StatutCommande } from '@prisma/client';

export class FindCommandeDto {
  @ApiProperty({ enum: StatutCommande, required: false, example: StatutCommande.EN_ATTENTE })
  @IsOptional()
  @IsEnum(StatutCommande, { message: 'Statut invalide' })
  statut?: StatutCommande;
}