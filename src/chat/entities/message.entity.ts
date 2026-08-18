import { ApiProperty } from '@nestjs/swagger';
import { Message } from '@prisma/client';

export class MessageEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  idCommande: number;

  @ApiProperty()
  idExpediteur: number;

  @ApiProperty()
  contenu: string;

  @ApiProperty()
  lu: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(message: Message) {
    this.id = message.id;
    this.idCommande = message.idCommande;
    this.idExpediteur = message.idExpediteur;
    this.contenu = message.contenu;
    this.lu = message.lu;
    this.createdAt = message.createdAt;
  }
}
