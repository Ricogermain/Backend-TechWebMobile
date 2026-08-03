import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateLivraisonDto } from './dto/create-livraison.dto';
import { FindLivraisonDto } from './dto/find-livraison.dto';
import { LivraisonService } from './livraison.service';
import { Role } from '.prisma/client/default.js';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import * as currentUserDecorator from 'src/auth/decorators/current-user.decorator';
import { UpdateStatutLivraisonDto } from './dto/update-statut-livraison.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { UpdateLivraisonDto } from './dto/update-livraison.dto';

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

    @Get('liste/:id')
    @ApiOperation({ summary: 'Consulter une livraison - livreur assigné ou ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au livreur assigné ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Livraison non trouvée' })
    findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
        return this.livraisonService.findById(id, user);
    }

    @Patch(':id/statut')
    @ApiOperation({ summary: "Modifier le statut d'une livraison - livreur assigné ou ADMIN" })
    @ApiBody({ type: UpdateStatutLivraisonDto, examples: { exemple: { value: { statut: 'LIVREE' } } } })
    @ApiResponse({ status: 400, description: 'dateLivraison obligatoire pour un statut LIVREE' })
    updateStatut(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateStatutLivraisonDto,
        @CurrentUser() user: CurrentUserPayload,
    ) {
        return this.livraisonService.updateStatut(id, dto, user);
    }

    @Get('entre2date')
    @ApiOperation({ summary: 'Lister les livraisons entre 2 dates - livreur lui-même ou ADMIN' })
    @ApiQuery({ name: 'startDate', required: true, example: '2026-08-01' })
    @ApiQuery({ name: 'endDate', required: true, example: '2026-08-31' })
    findEntre2Date(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @CurrentUser() user: CurrentUserPayload,
    ) {
        return this.livraisonService.findEntre2Date(new Date(startDate), new Date(endDate), user);
    }

    @Patch(':id/annuler')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Annuler une livraison (statut ANNULEE) - ADMIN uniquement' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 400, description: "Déjà livrée ou déjà annulée" })
    @ApiResponse({ status: 404, description: 'Livraison non trouvée' })
    annulerLivraison(@Param('id', ParseIntPipe) id: number) {
        return this.livraisonService.annulerLivraison(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Corriger le livreur assigné et/ou la date de livraison - ADMIN uniquement' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({
        type: UpdateLivraisonDto,
        examples: { exemple: { value: { idLivreur: 3, dateLivraison: '2026-08-05T14:00:00.000Z' } } },
    })
    @ApiResponse({ status: 400, description: "L'utilisateur n'a pas le rôle LIVREUR" })
    @ApiResponse({ status: 404, description: 'Livraison non trouvée' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLivraisonDto) {
        return this.livraisonService.update(id, dto);
    }
}