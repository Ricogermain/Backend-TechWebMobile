import { ApiProperty } from '@nestjs/swagger';
import { Livraison, StatutCommande, StatutLivraison } from '@prisma/client';

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

  /** Commande associée (adresse, client, véhicule) — incluse dans la liste et le détail. */
  @ApiProperty({ nullable: true })
  commande?: {
    id: number;
    adresseLivraison: string;
    statut: StatutCommande;
    client?: {
      id: number;
      nom: string;
      email: string;
      telephone: string | null;
    } | null;
    vehicule?: {
      id: number;
      marque: string;
      modele: string;
      imageUrl: string | null;
    } | null;
  } | null;

  /** Livreur assigné — inclus dans la liste et le détail. */
  @ApiProperty({ nullable: true })
  livreur?: {
    id: number;
    nom: string;
    email: string;
    telephone: string | null;
  } | null;

  constructor(
    livraison: Livraison & {
      commande?: LivraisonEntity['commande'];
      livreur?: LivraisonEntity['livreur'];
    },
  ) {
    this.id = livraison.id;
    this.idCommande = livraison.idCommande;
    this.idLivreur = livraison.idLivreur;
    this.statut = livraison.statut;
    this.datePriseEnCharge = livraison.datePriseEnCharge;
    this.dateLivraison = livraison.dateLivraison;
    this.createdAt = livraison.createdAt;
    this.updatedAt = livraison.updatedAt;
    this.commande = livraison.commande ?? null;
    this.livreur = livraison.livreur ?? null;
  }
}
