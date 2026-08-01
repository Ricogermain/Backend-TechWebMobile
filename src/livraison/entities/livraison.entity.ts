import { ApiProperty } from '@nestjs/swagger';
import { Livraison, StatutLivraison } from '@prisma/client';

export class LivraisonEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  idCommande: number;

  @ApiProperty({ nullable: true })
  idLivreur: number | null;

  @ApiProperty({ enum: StatutLivraison })
  statut: StatutLivraison;

  @ApiProperty({ nullable: true })
  datePriseEnCharge: Date | null;

  @ApiProperty({ nullable: true })
  dateLivraison: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(livraison: Livraison) {
    this.id = livraison.id;
    this.idCommande = livraison.idCommande;
    this.idLivreur = livraison.idLivreur;
    this.statut = livraison.statut;
    this.datePriseEnCharge = livraison.datePriseEnCharge;
    this.dateLivraison = livraison.dateLivraison;
    this.createdAt = livraison.createdAt;
    this.updatedAt = livraison.updatedAt;
  }
}