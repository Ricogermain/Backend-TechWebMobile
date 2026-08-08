import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateVehiculeDto {
  @ApiProperty({ example: 'Toyota' })
  @IsNotEmpty({ message: 'La marque est requise' })
  @IsString()
  marque: string;

  @ApiProperty({ example: 'Corolla' })
  @IsNotEmpty({ message: 'Le modèle est requis' })
  @IsString()
  modele: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(1990, { message: 'Année invalide' })
  @Max(new Date().getFullYear() + 1, { message: 'Année invalide' })
  annee: number;


  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @IsPositive({ message: 'Le prix doit être positif' })
  prix: number;

  @ApiProperty({ example: 'https://example.com/toyota-corolla.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0, { message: 'Nombre de stock invalide' })
  stock: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  disponible?: boolean;
}