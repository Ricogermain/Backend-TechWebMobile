import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { LivraisonEntity } from './entities/livraison.entity';
import { CreateLivraisonDto } from './dto/create-livraison.dto';
import { FindLivraisonDto } from './dto/find-livraison.dto';
import { Role, StatutCommande, StatutLivraison } from '@prisma/client';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { UpdateStatutLivraisonDto } from './dto/update-statut-livraison.dto';
import { UpdateLivraisonDto } from './dto/update-livraison.dto';

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

    async findById(id: number, user: CurrentUserPayload): Promise<LivraisonEntity> {
        const livraison = await this.db.livraison.findUnique({
            where: { id },
            include: {
                commande: {
                    include: {
                        client: {
                            select: { id: true, nom: true, email: true, telephone: true },
                        },
                        vehicule: {
                            select: { id: true, marque: true, modele: true, imageUrl: true },
                        },
                    },
                },
            },
        });
        if (!livraison) {
            throw new NotFoundException('Livraison non trouvée');
        }
        if (user.role !== Role.ADMIN && livraison.idLivreur !== user.id) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres livraisons");
        }
        return new LivraisonEntity(livraison);
    }

    async updateStatut(id: number,dto: UpdateStatutLivraisonDto,user: CurrentUserPayload,): Promise<LivraisonEntity> {
        const livraison = await this.db.livraison.findUnique({ where: { id } });
        if (!livraison) {
            throw new NotFoundException('Livraison non trouvée');
        }
        if (user.role !== Role.ADMIN && livraison.idLivreur !== user.id) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres livraisons");
        }

        let dateLivraison: Date | null = livraison.dateLivraison;
        if (dto.statut === StatutLivraison.LIVREE) {
            dateLivraison = dto.dateLivraison ? new Date(dto.dateLivraison) : (livraison.dateLivraison ?? new Date());
            if (!dateLivraison) {
                throw new BadRequestException('La dateLivraison est obligatoire pour un statut LIVREE');
            }
        }

        const updated = await this.db.$transaction(async (tx) => {
            const livraisonMaj = await tx.livraison.update({
                where: { id },
                data: { statut: dto.statut, dateLivraison },
            });

            if (dto.statut === StatutLivraison.LIVREE) {
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

    async findEntre2Date(dateDebut: Date,dateFin: Date,user: CurrentUserPayload,): Promise<LivraisonEntity[]> {
        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0);

        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);

        const livraisons = await this.db.livraison.findMany({
            where: {
                dateLivraison: { gte: debut, lte: fin },
                ...(user.role !== Role.ADMIN && { idLivreur: user.id }),
            },
            orderBy: { dateLivraison: 'asc' },
        });
        return livraisons.map((l) => new LivraisonEntity(l));
    }

    async annulerLivraison(id: number): Promise<LivraisonEntity> {
        const livraison = await this.db.livraison.findUnique({ where: { id } });
        if (!livraison) {
            throw new NotFoundException('Livraison non trouvée');
        }
        if (livraison.statut === StatutLivraison.LIVREE) {
            throw new BadRequestException("Cette livraison est déjà livrée, impossible de l'annuler");
        }
        if (livraison.statut === StatutLivraison.ANNULEE) {
            throw new BadRequestException('Cette livraison est déjà annulée');
        }

        const updated = await this.db.livraison.update({
            where: { id },
            data: { statut: StatutLivraison.ANNULEE },
        });

        return new LivraisonEntity(updated);
    }

    async update(id: number, dto: UpdateLivraisonDto): Promise<LivraisonEntity> {
        const livraison = await this.db.livraison.findUnique({ where: { id } });
        if (!livraison) {
            throw new NotFoundException('Livraison non trouvée');
        }

        if (dto.idLivreur) {
            await this.verifierEstLivreur(dto.idLivreur);
        }

        const updated = await this.db.livraison.update({
            where: { id },
            data: {
                ...(dto.idLivreur && { idLivreur: dto.idLivreur }),
                ...(dto.dateLivraison && { dateLivraison: new Date(dto.dateLivraison) }),
            },
        });

        return new LivraisonEntity(updated);
    }
}
