import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VehiculesService } from './vehicules.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { FindVehiculesDto } from './dto/find-vehicules.dto';
import { SearchVehiculeDto } from './dto/search-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';

@ApiTags('vehicules')
@ApiBearerAuth()
@Controller('vehicules')
export class VehiculesController {
    constructor(private readonly vehiculeService: VehiculesService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: "Ajout d'un véhicule - ADMIN"})
    @ApiBody({
        type: CreateVehiculeDto,
        examples: {
            exemple: {
                summary: "Ajout d' une véhicule",
                value: {
                    marque: "Toyota",
                    modele: "Corolla",
                    annee: 2023,
                    stock: 5,
                    prix: 25000000,
                    imageUrl: "https://images.unsplash.com/photo-1623869675184-6b6c2c3b6b3c",
                    disponible: true}
                }
        }
    })
    @ApiResponse({ status: 201, description: 'Véhicule ajoutée'})
    create(@Body() dto: CreateVehiculeDto) {
        return this.vehiculeService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lister tous les véhicules (filtrable par disponibilité, ce champ peut être vide)' })
    @ApiQuery({ name: 'disponible', required: false, example: 'true' })
    findAll(@Query() query: FindVehiculesDto) {
        return this.vehiculeService.findAll(query.disponible);
    }
    
    @Get('recherche')
    @ApiOperation({ summary: 'Recherche un véhicule par marque, model' })
    @ApiQuery({ name: 'q', required: false, example: 'Toyota' })
    recherche(@Query() query: SearchVehiculeDto) {
        return this.vehiculeService.recherche(query.q);
    }

    @Get('annee/:annee')
    @ApiOperation({ summary: 'Rechercher des véhicules par année' })
    @ApiParam({ name: 'annee', example: 2026 })
    async findAnnee(@Param('annee', ParseIntPipe) annee: number) {
        const vehicules = await this.vehiculeService.findAnnee(annee);
        if (vehicules.length === 0) {
            throw new NotFoundException(`Aucun véhicule trouvé pour l'année ${annee}`);
        }
        return vehicules;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Consulter un véhicule' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
      const vehicule = await this.vehiculeService.findOne(id);
      if (!vehicule) {
        throw new NotFoundException('Véhicule non trouvé');
      }
      return vehicule;
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Modifier un véhicule - ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({
      type: UpdateVehiculeDto,
      examples: {
        exemple: { 
            summary: "Mise à jour d'un véhicule",
            value: {
                marque: "Toyota",
                modele: "Corolla",
                annee: 2023,
                stock: 5,
                prix: 25000000,
                imageUrl: "https://images.unsplash.com/photo-1623869675184-6b6c2c3b6b3c",
                disponible: true}
            } 
        },
    })
    @ApiResponse({ status: 403, description: "Réservé à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehiculeDto) {
        return this.vehiculeService.update(id, dto);
    } 

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Supprimer un vehicule - ADMIN uniquement' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 200, description: 'Véhicule supprimé' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Véhicule non trouvé' })
    async remove(@Param('id', ParseIntPipe) id: number) {
      const vehicule = await this.vehiculeService.remove(id);
      if (!vehicule) {
        throw new NotFoundException('Véhicule non trouvé');
      }
      return vehicule;
    }    
}
