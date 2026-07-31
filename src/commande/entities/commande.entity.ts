import { ApiProperty } from '@nestjs/swagger';
import { Commande, StatutCommande } from '@prisma/client';

export class CommandeEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  idClient: number;

  @ApiProperty()
  idVehicule: number;

  @ApiProperty()
  adresseLivraison: string;

  @ApiProperty()
  dateCommande: Date;

  @ApiProperty({ enum: StatutCommande })
  statut: StatutCommande;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(commande: Commande) {
    this.id = commande.id;
    this.idClient = commande.idClient;
    this.idVehicule = commande.idVehicule;
    this.adresseLivraison = commande.adresseLivraison;
    this.dateCommande = commande.dateCommande;
    this.statut = commande.statut;
    this.createdAt = commande.createdAt;
    this.updatedAt = commande.updatedAt;
  }
}