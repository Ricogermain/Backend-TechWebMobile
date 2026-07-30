import { ApiProperty } from '@nestjs/swagger';
import { Vehicule } from '@prisma/client';
import { Transform } from 'class-transformer';

export class VehiculeEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  marque: string;

  @ApiProperty()
  modele: string;

  @ApiProperty()
  annee: number;

  @ApiProperty({ description: 'Prix en Ariary' })
  @Transform(({ value }) => Number(value))
  prix: number;

  @ApiProperty({ nullable: true, required: false })
  imageUrl: string | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  disponible: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

   constructor(vehicule: Vehicule) {
    this.id = vehicule.id;
    this.marque = vehicule.marque;
    this.modele = vehicule.modele;
    this.annee = vehicule.annee;
    this.prix = Number(vehicule.prix);
    this.imageUrl = vehicule.imageUrl;
    this.stock = vehicule.stock;
    this.disponible = vehicule.disponible;
    this.createdAt = vehicule.createdAt;
    this.updatedAt = vehicule.updatedAt;
  }
}