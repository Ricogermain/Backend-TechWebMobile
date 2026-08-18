import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // userId → Set<socketId>
  private onlineUsers = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Connexion / Déconnexion ──

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new UnauthorizedException();

      const payload = this.jwtService.verify<{ sub: number; email: string }>(token);
      const userId = payload.sub;

      // Stocker l'userId dans le socket pour retrouver l'utilisateur
      (client as any).userId = userId;

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Notifier les autres que cet utilisateur est en ligne
      this.server.emit('userOnline', { userId });

      console.log(`[WS] User ${userId} connected (socket ${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId: number | undefined = (client as any).userId;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('userOffline', { userId });
        }
      }
      console.log(`[WS] User ${userId} disconnected (socket ${client.id})`);
    }
  }

  // ── Rejoindre / Quitter une room de conversation ──

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.join(room);
    console.log(`[WS] Socket ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.leave(room);
    console.log(`[WS] Socket ${client.id} left room ${room}`);
  }

  // ── Envoi de message en temps réel ──

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; contenu: string },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return { error: 'Non authentifié' };

    try {
      const message = await this.chatService.sendMessage(
        { conversationId: data.conversationId, contenu: data.contenu },
        userId,
      );

      // Diffuser le message à tous les participants de la room
      this.server
        .to(`conversation_${data.conversationId}`)
        .emit('newMessage', message);

      return message;
    } catch (err: any) {
      return { error: err.message };
    }
  }

  // ── Indicateur de frappe ──

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return;

    // Émettre à tous SAUF l'expéditeur
    client.to(`conversation_${data.conversationId}`).emit('userTyping', {
      userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return;

    client.to(`conversation_${data.conversationId}`).emit('userStopTyping', {
      userId,
      conversationId: data.conversationId,
    });
  }

  // ── Marquer comme lu ──

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return { error: 'Non authentifié' };

    try {
      const result = await this.chatService.markAsRead(data.conversationId, userId);
      return result;
    } catch (err: any) {
      return { error: err.message };
    }
  }

  // ── Utilitaires ──

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  emitToUser(userId: number, event: string, data: any) {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}
