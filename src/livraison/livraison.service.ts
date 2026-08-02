import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { LivraisonEntity } from './entities/livraison.entity';
import { CreateLivraisonDto } from './dto/create-livraison.dto';
import { FindLivraisonDto } from './dto/find-livraison.dto';
import { Role, StatutCommande, StatutLivraison } from '@prisma/client';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';

@Injectable()
export class LivraisonService {
    constructor(private readonly db: DatabaseService) {}

    async create(dto: CreateLivraisonDto): Promise<LivraisonEntity> {
        const commande = await this.db.commande.findUnique({ where: { id: dto.idCommande } });
        if (!commande) {
        throw new NotFoundException('Commande non trouvée');
        }

        const existante = await this.db.livraison.findUnique({ where: { idCommande: dto.idCommande } });
        if (existante) {
        throw new BadRequestException('Une livraison existe déjà pour cette commande');
        }

        if (dto.idLivreur) {
            await this.verifierEstLivreur(dto.idLivreur);
        }

        const livraison = await this.db.livraison.create({
        data: {
            idCommande: dto.idCommande,
            idLivreur: dto.idLivreur,
            datePriseEnCharge: new Date(),
            dateLivraison: dto.dateLivraison ? new Date(dto.dateLivraison) : null,
        },
        });

        return new LivraisonEntity(livraison);
    }

    async findAll(dto: FindLivraisonDto): Promise<LivraisonEntity[]> {
        const livraisons = await this.db.livraison.findMany({
            where: {
                ...(dto.statut && { statut: dto.statut }),
                ...(dto.idLivreur && { idLivreur: dto.idLivreur }),
            },
            orderBy: { id: 'asc' },
        });
        return livraisons.map((l) => new LivraisonEntity(l));
    }

    async updateStatut(id: number, statut: StatutLivraison, user: CurrentUserPayload): Promise<LivraisonEntity> {
        const livraison = await this.db.livraison.findUnique({ where: { id } });
        if (!livraison) {
            throw new NotFoundException('Livraison non trouvée');
        }
        if (user.role !== Role.ADMIN && livraison.idLivreur !== user.id) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres livraisons");
        }

        const updated = await this.db.$transaction(async (tx) => {
            const livraisonMaj = await tx.livraison.update({
                where: { id },
                data: {
                    statut,
                    ...(statut === StatutLivraison.LIVREE && { dateLivraison: new Date() }),
                },
            });

            if (statut === StatutLivraison.LIVREE) {
                await tx.commande.update({
                    where: { id: livraisonMaj.idCommande },
                    data: { statut: StatutCommande.LIVREE },
                });
            }

            return livraisonMaj;
        });

        return new LivraisonEntity(updated);
    }

    private async verifierEstLivreur(idLivreur: number): Promise<void> {
        const livreur = await this.db.utilisateur.findUnique({ where: { id: idLivreur } });
        if (!livreur) {
            throw new NotFoundException('Livreur non trouvé');
        }
        if (livreur.role !== Role.LIVREUR) {
            throw new BadRequestException("Cet utilisateur n'a pas le rôle LIVREUR");
        }
    }
}
