import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandeService } from './commande.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role, StatutCommande } from '@prisma/client';
import { FindCommandeDto } from './dto/find-commande.dto';
import { SelfOrAdminGuard } from 'src/auth/guards/self-or-admin.guard';
import { UpdateCommandeStatutDto } from './dto/update-commande-statut.dto';
import { UpdateCommandeDto } from './dto/update-commande';
import { RechercheCommandeDto } from './dto/recherche-commande.dto';

@ApiTags('commande')
@ApiBearerAuth()
@Controller('commande')
export class CommandeController {
    constructor(private readonly commandeService: CommandeService) {}

    @Post()
    @ApiOperation({ summary: "Faire une commande"})
    @ApiBody({
        type: CreateCommandeDto,
        examples:{
            exemple: {
                summary: "Ajout d' une commande",
                value: {idVehicule: 1, adresseLivraison: "Fianarantso, Antanambao, Lot II M 45"}
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Commande envoyée'})
    @ApiResponse({ status: 404, description: 'Véhicule indisponible'})
    create(@Body() dto: CreateCommandeDto, @CurrentUser() user: CurrentUserPayload) {
        return this.commandeService.create(dto, user.id);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Lister toutes les commande (filtrable par statut, ce champ peut être vide) - ADMIN uniquement' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiQuery({ name: 'statut', required: false, example: 'EN_ATTENTE' })
    findAll(@Query() query: FindCommandeDto) {
      return this.commandeService.findAll(query.statut);
    }

    @Get('client/:idClient')
    @ApiOperation({ summary: 'Lister les commandes d\'un client - le client lui-même ou ADMIN' })
    @ApiParam({ name: 'idClient', example: 3 })
    @ApiResponse({ status: 403, description: "Accès refusé" })
    findByIdClient(
        @Param('idClient', ParseIntPipe) idClient: number,
        @CurrentUser() user: CurrentUserPayload,
    ) {
        return this.commandeService.findByIdClient(idClient, user);
    } 
    
    @Patch('/statut/:id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: "Modifier status d'une commande - ADMIN" })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateCommandeStatutDto, examples: { exemple: { value: { statut: StatutCommande.CONFIRMEE } } } })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Commande non trouvé' })
    updateStatut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommandeStatutDto) {
        return this.commandeService.updateStatut(id, dto.statut);
    }  
    
    @Get('recherche')
    @ApiOperation({ summary: 'Recherche par nom, marque, modele ou adresse client' })
    @ApiQuery({ name: 'q', required: false, example: 'rico' })
    @ApiResponse({ status: 200, description: 'Liste des commandes trouvées' })
    recherche(@Query() dto: RechercheCommandeDto, @CurrentUser() user: CurrentUserPayload) {
        return this.commandeService.recherche(dto.q, user);
    }

    @Patch('Modifier/:id')
    @ApiOperation({ summary: "Modifier une commande (addresse seulement) - soi même ou ADMIN" })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({
        type: UpdateCommandeDto,
        examples: { exemple: { value: { adresseLivraison: 'Fianarantsoa, Andrainjato, Bat A00' } } },
    })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Commande non trouvée' })
    update(@Param('id', ParseIntPipe) id: number, 
        @Body() dto: UpdateCommandeDto, @CurrentUser() user: CurrentUserPayload) {
        return this.commandeService.update(dto, id, user);
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Consulter les commandes par idCommande - ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Commande non trouvée' })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const commande = await this.commandeService.findById(id);
        if (!commande) {
            throw new NotFoundException('Aucune commande trouvé');
        }
        return commande;
    }

    @Patch('Annuler/:id')
    @ApiOperation({ summary: "Annuler une commande - soi même ou ADMIN" })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Commande non trouvée' })
    annulerCommander(@Param('id', ParseIntPipe) id: number,@CurrentUser() user: CurrentUserPayload) {
        return this.commandeService.annulerCommander(id, user);
    }

}
