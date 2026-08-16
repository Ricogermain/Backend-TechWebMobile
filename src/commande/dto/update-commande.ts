import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCommandeDto {
  @ApiProperty({ example: 'Lot II M 45 Antananarivo', required: false })
  @IsOptional()
  @IsNotEmpty({ message: "L'adresse de livraison ne peut pas être vide" })
  @IsString()
  adresseLivraison?: string;

  @ApiProperty({
    example: 2,
    required: false,
    description: "Nouveau véhicule (uniquement si la commande est EN_ATTENTE)",
  })
  @IsOptional()
  @IsInt({ message: 'idVehicule doit être un nombre entier' })
  @Min(1, { message: 'idVehicule doit être supérieur ou égal à 1' })
  idVehicule?: number;
}
