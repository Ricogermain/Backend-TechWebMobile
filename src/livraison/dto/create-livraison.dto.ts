import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateLivraisonDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive({ message: "L'identifiant de la commande doit être positif" })
  idCommande: number;

  @ApiProperty({ example: 2, required: false, description: 'Livreur assigné (optionnel à la création)' })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: "L'identifiant du livreur doit être positif" })
  idLivreur?: number;

  @ApiProperty({ example: '2026-08-05T14:00:00.000Z', required: false, description: 'Date de livraison prévue/effective' })
  @IsOptional()
  @IsDateString({}, { message: 'Date de livraison invalide' })
  dateLivraison?: string;
}