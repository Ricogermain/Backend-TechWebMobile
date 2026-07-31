import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandeService } from './commande.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FindCommandeDto } from './dto/find-commande.dto';
import { SelfOrAdminGuard } from 'src/auth/guards/self-or-admin.guard';
import { UpdateCommandeStatutDto } from './dto/update-commande-statut.dto';

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

    @Get('ParIdClient/:id')
    @UseGuards(SelfOrAdminGuard)
    @ApiOperation({ summary: 'Consulter les commandes - soi-même ou ADMIN' })
    @ApiParam({ name: 'idClient', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async findByIdClient(@Param('id', ParseIntPipe) id: number) {
        const commande = await this.commandeService.findByIdClient(id);
        if (!commande) {
            throw new NotFoundException('Aucune commande trouvé');
        }
        return commande;
    } 
    
    @Patch(':id/statut')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: "Changer le statut d'une commande - ADMIN uniquement" })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateCommandeStatutDto, examples: { exemple: { value: { statut: 'CONFIRMEE' } } } })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Commande non trouvé' })
    updateStatut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommandeStatutDto) {
        return this.commandeService.updateStatut(id, dto.statut);
    }   

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Consulter les commandes par idCommande - ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Aucune commande trouvé' })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const commande = await this.commandeService.findById(id);
        if (!commande) {
            throw new NotFoundException('Aucune commande trouvé');
        }
        return commande;
    }

}
