import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateLivraisonDto } from './dto/create-livraison.dto';
import { FindLivraisonDto } from './dto/find-livraison.dto';
import { LivraisonService } from './livraison.service';
import { Role } from '.prisma/client/default.js';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import * as currentUserDecorator from 'src/auth/decorators/current-user.decorator';
import { UpdateStatutLivraisonDto } from './dto/update-statut-livraison.dto';

@ApiTags('livraison')
@ApiBearerAuth()
@Controller('livraison')
export class LivraisonController {
    constructor(private readonly livraisonService: LivraisonService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Créer une livraison pour une commande' })
    @ApiBody({
        type: CreateLivraisonDto,
        examples: { exemple: { value: { idCommande: 1, idLivreur: 2 } } },
    })
    @ApiResponse({ status: 400, description: 'Livraison déjà existante pour cette commande' })
    @ApiResponse({ status: 404, description: 'Commande non trouvée' })
    create(@Body() dto: CreateLivraisonDto) {
        return this.livraisonService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lister les livraisons (filtre optionnel par statut et/ou livreur)' })
    @ApiResponse({ status: 200, description: 'Liste des livraisons' })
    findAll(@Query() dto: FindLivraisonDto) {
        return this.livraisonService.findAll(dto);
    }

    @Patch('statut/:id')
    @ApiOperation({ summary: "Modifier le statut d'une livraison - livreur assigné ou ADMIN" })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateStatutLivraisonDto, examples: { exemple: { value: { statut: 'EN_ROUTE' } } } })
    @ApiResponse({ status: 403, description: 'Réservé au livreur assigné ou à l\'ADMIN' })
    @ApiResponse({ status: 404, description: 'Livraison non trouvée' })
    updateStatut(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateStatutLivraisonDto,
        @currentUserDecorator.CurrentUser() user: currentUserDecorator.CurrentUserPayload,
    ) {
        return this.livraisonService.updateStatut(id, dto.statut, user);
    }
}