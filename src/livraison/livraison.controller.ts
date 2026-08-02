import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateLivraisonDto } from './dto/create-livraison.dto';
import { FindLivraisonDto } from './dto/find-livraison.dto';
import { LivraisonService } from './livraison.service';
import { Role } from '.prisma/client/default.js';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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
}