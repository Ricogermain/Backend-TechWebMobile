import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateCommandeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive({ message: "L'identifiant du véhicule doit être positif" })
  idVehicule: number;

  @ApiProperty({ example: 'Fianarantsoa, Antanambao, Lot II M 45 ' })
  @IsNotEmpty({ message: "L'adresse de livraison est requise" })
  @IsString()
  adresseLivraison: string;
}