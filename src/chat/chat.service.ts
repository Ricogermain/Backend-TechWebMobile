import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}

  // ──────────────── Conversations ────────────────

  async createConversation(
    dto: CreateConversationDto,
    userId: number,
  ): Promise<ConversationEntity> {
    if (dto.participantId === userId) {
      throw new BadRequestException('Vous ne pouvez pas créer une conversation avec vous-même');
    }

    const otherUser = await this.db.utilisateur.findUnique({ where: { id: dto.participantId } });
    if (!otherUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Ordonner les IDs pour éviter les doublons (conversation unique entre deux users)
    const [p1, p2] = [userId, dto.participantId].sort((a, b) => a - b);

    const existing = await this.db.conversation.findUnique({
      where: { participant1_participant2: { participant1: p1, participant2: p2 } },
    });
    if (existing) {
      return this.buildConversationEntity(existing.id, userId);
    }

    const conversation = await this.db.conversation.create({
      data: { participant1: p1, participant2: p2 },
    });

    return this.buildConversationEntity(conversation.id, userId);
  }

  async findConversations(userId: number): Promise<ConversationEntity[]> {
    const conversations = await this.db.conversation.findMany({
      where: {
        OR: [{ participant1: userId }, { participant2: userId }],
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      conversations.map((c) => this.buildConversationEntity(c.id, userId)),
    );
  }

  async findConversationById(id: number, userId: number): Promise<ConversationEntity> {
    const conversation = await this.db.conversation.findUnique({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    this.ensureParticipant(conversation, userId);
    return this.buildConversationEntity(id, userId);
  }

  // ──────────────── Messages ────────────────

  async sendMessage(
    dto: SendMessageDto,
    userId: number,
  ): Promise<MessageEntity> {
    const conversation = await this.db.conversation.findUnique({
      where: { id: dto.conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    this.ensureParticipant(conversation, userId);

    const message = await this.db.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        contenu: dto.contenu,
      },
    });

    // Mettre à jour updatedAt de la conversation
    await this.db.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    return new MessageEntity(message);
  }

  async findMessages(
    conversationId: number,
    userId: number,
    page = 1,
    limit = 50,
  ): Promise<{ data: MessageEntity[]; total: number; page: number; totalPages: number }> {
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    this.ensureParticipant(conversation, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.db.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.map((m) => new MessageEntity(m)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(conversationId: number, userId: number): Promise<{ count: number }> {
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    this.ensureParticipant(conversation, userId);

    // Marquer tous les messages reçus (pas envoyés par l'utilisateur) comme lus
    const result = await this.db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        lu: false,
      },
      data: { lu: true },
    });

    return { count: result.count };
  }

  // ──────────────── Helpers ────────────────

  private ensureParticipant(conversation: { participant1: number; participant2: number }, userId: number) {
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new ForbiddenException("Vous ne faites pas partie de cette conversation");
    }
  }

  private async buildConversationEntity(conversationId: number, userId: number): Promise<ConversationEntity> {
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    this.ensureParticipant(conversation, userId);

    const otherUserId = conversation.participant1 === userId
      ? conversation.participant2
      : conversation.participant1;

    const [otherUser, lastMessage, unreadCount] = await Promise.all([
      this.db.utilisateur.findUnique({
        where: { id: otherUserId },
        select: { id: true, nom: true, email: true },
      }),
      this.db.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, contenu: true, senderId: true, createdAt: true },
      }),
      this.db.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          lu: false,
        },
      }),
    ]);

    return new ConversationEntity({
      ...conversation,
      lastMessage,
      unreadCount,
      otherUser,
    });
  }
}
