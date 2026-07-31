import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { CommandeEntity } from './entities/commande.entity';
import { StatutCommande } from '@prisma/client';

@Injectable()
export class CommandeService {
    constructor(private readonly db: DatabaseService) {}

    async create(dto: CreateCommandeDto, idClient: number): Promise<CommandeEntity>{
        const vehicule = await this.db.vehicule.findUnique({
            where: { id: dto.idVehicule },
        });

        if (!vehicule) {
            throw new NotFoundException('Véhicule non trouvé');
        }
        if (!vehicule.disponible || vehicule.stock < 1) {
            throw new BadRequestException('Véhicule indisponible ou en rupture de stock');
        }

        const commande = await this.db.$transaction(async (transaction) => {
            const nouveauStock = vehicule.stock - 1;

            await transaction.vehicule.update({
                where: { id: vehicule.id },
                data: {
                    stock: nouveauStock,
                    disponible: nouveauStock > 0,
                },
            });

            return transaction.commande.create({
                data: {
                    idClient,
                    idVehicule: dto.idVehicule,
                    adresseLivraison: dto.adresseLivraison,
                },
            });
        });

        return new CommandeEntity(commande);
    }  
    
    async findAll(statut?: StatutCommande): Promise<CommandeEntity[]> {
        const commande = await this.db.commande.findMany({
            where: statut ? { statut } : undefined,
            orderBy: { id: 'asc' },
        });

        return commande.map((commande) => new CommandeEntity(commande));
    }

    async findById(id: number): Promise<CommandeEntity[]> {
        const commande = await this.db.commande.findMany({
            where: { id: id },
            orderBy: { id: 'asc' }
        })

        return commande.map((commande) => new CommandeEntity(commande));
    }

    async findByIdClient(idClient: number): Promise<CommandeEntity[]> {
        const commande = await this.db.commande.findMany({
            where: { idClient: idClient },
            orderBy: { id: 'asc' }
        })

        return commande.map((commande) => new CommandeEntity(commande));
    }

    async updateStatut(id: number, statut: StatutCommande): Promise<CommandeEntity> {
        const existe = await this.db.commande.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Aucune commande trouvé');
        }

        const updated = await this.db.commande.update({
            where: { id },
            data: { statut },
        });

        return new CommandeEntity(updated);
    }
}
