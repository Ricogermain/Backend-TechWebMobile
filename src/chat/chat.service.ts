import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageEntity } from './entities/message.entity';
import { Role } from '@prisma/client';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Récupère les messages d'une commande (pagination descendante).
   * [before] : ID du dernier message chargé pour charger les précédents.
   */
  async getMessages(
    idCommande: number,
    user: CurrentUserPayload,
    limit = 20,
    before?: number,
  ): Promise<MessageEntity[]> {
    await this.ensureAccess(idCommande, user);

    const messages = await this.db.message.findMany({
      where: {
        idCommande,
        ...(before && { id: { lt: before } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map((m) => new MessageEntity(m));
  }

  /**
   * Envoie un message dans la conversation liée à une commande.
   */
  async sendMessage(
    idCommande: number,
    contenu: string,
    user: CurrentUserPayload,
  ): Promise<MessageEntity> {
    await this.ensureAccess(idCommande, user);

    const message = await this.db.message.create({
      data: {
        idCommande,
        idExpediteur: user.id,
        contenu,
      },
    });

    return new MessageEntity(message);
  }

  /**
   * Marque tous les messages reçus d'une commande comme lus.
   */
  async markAsRead(
    idCommande: number,
    user: CurrentUserPayload,
  ): Promise<void> {
    await this.ensureAccess(idCommande, user);

    await this.db.message.updateMany({
      where: {
        idCommande,
        idExpediteur: { not: user.id },
        lu: false,
      },
      data: { lu: true },
    });
  }

  /**
   * Vérifie que l'utilisateur a le droit d'accéder au chat de cette commande.
   * - Le client propriétaire de la commande peut accéder.
   * - Le livreur assigné à la livraison peut accéder.
   * - Un admin peut accéder.
   */
  private async ensureAccess(
    idCommande: number,
    user: CurrentUserPayload,
  ): Promise<void> {
    const commande = await this.db.commande.findUnique({
      where: { id: idCommande },
      include: {
        livraison: {
          select: { idLivreur: true },
        },
      },
    });

    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }

    // Admin : accès total
    if (user.role === Role.ADMIN) return;

    // Client propriétaire de la commande
    if (commande.idClient === user.id) return;

    // Livreur assigné à la livraison
    if (
      user.role === Role.LIVREUR &&
      commande.livraison?.idLivreur === user.id
    ) {
      return;
    }

    throw new ForbiddenException(
      "Vous n'avez pas accès au chat de cette commande",
    );
  }
}
