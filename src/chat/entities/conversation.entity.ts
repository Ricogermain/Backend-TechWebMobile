import { ApiProperty } from '@nestjs/swagger';
import { Conversation } from '@prisma/client';

export class ConversationEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  participant1: number;

  @ApiProperty()
  participant2: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Dernier message de la conversation (inclu dans la liste). */
  @ApiProperty({ nullable: true })
  lastMessage?: {
    id: number;
    contenu: string;
    senderId: number;
    createdAt: Date;
  } | null;

  /** Nombre de messages non lus pour l'utilisateur courant. */
  @ApiProperty({ nullable: true })
  unreadCount?: number | null;

  /** Infos du second participant (hors l'utilisateur courant). */
  @ApiProperty({ nullable: true })
  otherUser?: {
    id: number;
    nom: string;
    email: string;
  } | null;

  constructor(conversation: Conversation & {
    lastMessage?: ConversationEntity['lastMessage'];
    unreadCount?: number;
    otherUser?: ConversationEntity['otherUser'];
  }) {
    this.id = conversation.id;
    this.participant1 = conversation.participant1;
    this.participant2 = conversation.participant2;
    this.createdAt = conversation.createdAt;
    this.updatedAt = conversation.updatedAt;
    this.lastMessage = conversation.lastMessage ?? null;
    this.unreadCount = conversation.unreadCount ?? null;
    this.otherUser = conversation.otherUser ?? null;
  }
}
