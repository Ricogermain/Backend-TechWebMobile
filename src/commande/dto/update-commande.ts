import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommandeDto {
  @ApiProperty({ example: 'Lot II M 45 Antananarivo', required: false })
  @IsOptional()
  @IsNotEmpty({ message: "L'adresse de livraison ne peut pas être vide" })
  @IsString()
  adresseLivraison?: string;
}