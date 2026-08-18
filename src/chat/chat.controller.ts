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
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { FindMessagesDto } from './dto/find-messages.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ──────────────── Conversations ────────────────

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation entre deux utilisateurs' })
  @ApiBody({
    type: CreateConversationDto,
    examples: { exemple: { value: { participantId: 2 } } },
  })
  @ApiResponse({ status: 201, description: 'Conversation créée ou existante retournée' })
  @ApiResponse({ status: 400, description: 'Tentative de conversation avec soi-même' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.createConversation(dto, user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations de l\'utilisateur courant' })
  @ApiResponse({ status: 200, description: 'Liste des conversations avec dernier message et nombre de non-lus' })
  findConversations(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.findConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Consulter le détail d\'une conversation' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Détail de la conversation' })
  @ApiResponse({ status: 403, description: 'Vous ne faites pas partie de cette conversation' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  findConversationById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.findConversationById(id, user.id);
  }

  // ──────────────── Messages ────────────────

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message dans une conversation' })
  @ApiBody({
    type: SendMessageDto,
    examples: { exemple: { value: { conversationId: 1, contenu: 'Bonjour !' } } },
  })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  @ApiResponse({ status: 403, description: 'Vous ne faites pas partie de cette conversation' })
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.sendMessage(dto, user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lister les messages d\'une conversation (pagination)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Messages paginés' })
  findMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindMessagesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.findMessages(id, user.id, query.page, query.limit);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer tous les messages reçus d\'une conversation comme lus' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Nombre de messages marqués comme lus' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.markAsRead(id, user.id);
  }
}
