import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('commande')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages')
  @ApiOperation({
    summary: "Récupérer les messages d'une commande (pagination)",
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la commande' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'before',
    required: false,
    description: 'ID du dernier message chargé',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des messages (les plus récents en premier)',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.chatService.getMessages(
      id,
      user!,
      limit ? parseInt(limit, 10) : 20,
      before ? parseInt(before, 10) : undefined,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: "Envoyer un message dans le chat d'une commande" })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la commande' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { contenu: { type: 'string', example: 'Bonjour !' } },
      required: ['contenu'],
    },
  })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body('contenu') contenu: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.sendMessage(id, contenu, user);
  }

  @Patch(':id/messages/read')
  @ApiOperation({
    summary: "Marquer tous les messages reçus d'une commande comme lus",
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Messages marqués comme lus' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.markAsRead(id, user);
  }
}
