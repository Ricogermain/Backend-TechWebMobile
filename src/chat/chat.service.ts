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
   * Nombre total de messages non lus pour l'utilisateur courant.
   * - Client : messages non lus sur ses propres commandes.
   * - Livreur : messages non lus sur les commandes dont il assure la livraison.
   */
  async getUnreadCount(user: CurrentUserPayload): Promise<number> {
    const where = this.buildAccessibleCommandeWhere(user, { statut: { in: ['EN_LIVRAISON'] } });

    const count = await this.db.message.count({
      where: {
        lu: false,
        idExpediteur: { not: user.id },
        commande: where,
      },
    });

    return count;
  }

  /**
   * Liste les commandes actives (en livraison) avec le dernier message
   * et le nombre de non-lus, pour l'icône de chat dans l'AppBar.
   */
  async getActiveConversations(user: CurrentUserPayload) {
    const where = this.buildAccessibleCommandeWhere(user, { statut: { in: ['EN_LIVRAISON'] } });

    const commandes = await this.db.commande.findMany({
      where,
      include: {
        livraison: {
          select: {
            idLivreur: true,
            livreur: { select: { id: true, nom: true } },
          },
        },
        client: {
          select: { id: true, nom: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = await Promise.all(
      commandes.map(async (cmd) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.db.message.findFirst({
            where: { idCommande: cmd.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, contenu: true, idExpediteur: true, createdAt: true },
          }),
          this.db.message.count({
            where: {
              idCommande: cmd.id,
              idExpediteur: { not: user.id },
              lu: false,
            },
          }),
        ]);

        return {
          idCommande: cmd.id,
          client: cmd.client,
          livreur: cmd.livraison?.livreur ?? null,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return result;
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
   * Construit le filtre Prisma pour les commandes accessibles par l'utilisateur.
   */
  private buildAccessibleCommandeWhere(
    user: CurrentUserPayload,
    extra?: any,
  ): any {
    let base: any = {};

    if (user.role === Role.CLIENT) {
      base = { idClient: user.id };
    } else if (user.role === Role.LIVREUR) {
      base = { livraison: { idLivreur: user.id } };
    }
    // ADMIN : pas de filtre

    return { ...base, ...(extra ?? {}) };
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
