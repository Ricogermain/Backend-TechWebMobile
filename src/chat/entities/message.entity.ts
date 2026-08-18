import { ApiProperty } from '@nestjs/swagger';
import { Message } from '@prisma/client';

export class MessageEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  conversationId: number;

  @ApiProperty()
  senderId: number;

  @ApiProperty()
  contenu: string;

  @ApiProperty()
  lu: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(message: Message) {
    this.id = message.id;
    this.conversationId = message.conversationId;
    this.senderId = message.senderId;
    this.contenu = message.contenu;
    this.lu = message.lu;
    this.createdAt = message.createdAt;
  }
}
