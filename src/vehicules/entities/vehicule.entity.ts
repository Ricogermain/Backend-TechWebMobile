import { ApiProperty } from '@nestjs/swagger';
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
  disponible: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<VehiculeEntity>) {
    Object.assign(this, partial);
  }
}