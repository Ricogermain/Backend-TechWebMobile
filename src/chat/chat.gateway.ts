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

  private onlineUsers = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new UnauthorizedException();

      const payload = this.jwtService.verify<{ sub: number; email: string }>(
        token,
      );
      const userId = payload.sub;

      (client as any).userId = userId;

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

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

  @SubscribeMessage('joinCommande')
  handleJoinCommande(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { commandeId: number },
  ) {
    const room = `commande_${data.commandeId}`;
    client.join(room);
    console.log(`[WS] Socket ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveCommande')
  handleLeaveCommande(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { commandeId: number },
  ) {
    const room = `commande_${data.commandeId}`;
    client.leave(room);
    console.log(`[WS] Socket ${client.id} left room ${room}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { commandeId: number; contenu: string },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return { error: 'Non authentifié' };

    try {
      const message = await this.chatService.sendMessage(
        data.commandeId,
        data.contenu,
        { id: userId, email: '', role: '' },
      );

      this.server.to(`commande_${data.commandeId}`).emit('newMessage', message);

      return message;
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { commandeId: number },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return;

    client.to(`commande_${data.commandeId}`).emit('userTyping', {
      userId,
      commandeId: data.commandeId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { commandeId: number },
  ) {
    const userId: number = (client as any).userId;
    if (!userId) return;

    client.to(`commande_${data.commandeId}`).emit('userStopTyping', {
      userId,
      commandeId: data.commandeId,
    });
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }
}
