import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateLivraisonDto {
  @ApiProperty({ example: 3, required: false, description: 'Corriger le livreur assigné' })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: "L'identifiant du livreur doit être positif" })
  idLivreur?: number;

  @ApiProperty({ example: '2026-08-05T14:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Date de livraison invalide' })
  dateLivraison?: string;
}