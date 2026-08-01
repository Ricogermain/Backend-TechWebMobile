import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { CommandeEntity } from './entities/commande.entity';
import { Role, StatutCommande } from '@prisma/client';
import { UpdateCommandeDto } from './dto/update-commande';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { RechercheCommandeDto } from './dto/recherche-commande.dto';

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

    async findByIdClient(idClient: number, user: CurrentUserPayload): Promise<CommandeEntity[]> {
        if (user.role !== Role.ADMIN && user.id !== idClient) {
            throw new ForbiddenException("Vous ne pouvez consulter que vos propres commandes");
        }

        const commande = await this.db.commande.findMany({
            where: { idClient },
            orderBy: { id: 'asc' },
        });

        return commande.map((c) => new CommandeEntity(c));
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

    async update(dto: UpdateCommandeDto, id: number, user: CurrentUserPayload): Promise<CommandeEntity> {
        const existe = await this.db.commande.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Aucune commande trouvée');
        }
        if (user.role !== Role.ADMIN && existe.idClient !== user.id) {
            throw new ForbiddenException("Vous ne pouvez modifier que votre propre commande");
        }

        const updated = await this.db.commande.update({
            where: { id },
            data: { adresseLivraison: dto.adresseLivraison },
        });

        return new CommandeEntity(updated);
    }

    async annulerCommander(id: number, user: CurrentUserPayload): Promise<CommandeEntity> {
        const existe = await this.db.commande.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Aucune commande trouvée');
        }
        if (user.role !== Role.ADMIN && existe.idClient !== user.id) {
            throw new ForbiddenException("Vous ne pouvez annuler que votre propre commande");
        }
        if (existe.statut === StatutCommande.LIVREE) {
            throw new ForbiddenException("Elle est déjà livrée, impossible de l'annuler");
        }

        const annuler = await this.db.commande.update({
            where: { id },
            data: { statut: StatutCommande.ANNULEE },
        });

        return new CommandeEntity(annuler);
    }

    async recherche(q: string | undefined, user: CurrentUserPayload): Promise<CommandeEntity[]> {
        const filtreRecherche = q
            ? {
                OR: [
                    { adresseLivraison: { contains: q, mode: 'insensitive' as const } },
                    { client: { nom: { contains: q, mode: 'insensitive' as const } } },
                    { vehicule: { marque: { contains: q, mode: 'insensitive' as const } } },
                    { vehicule: { modele: { contains: q, mode: 'insensitive' as const } } },
                ],
            }
            : {};

        const liste = await this.db.commande.findMany({
            where:
                user.role === Role.ADMIN
                    ? filtreRecherche
                    : { idClient: user.id, ...filtreRecherche },
        });

        return liste.map((c) => new CommandeEntity(c));
    }

    async findByDate(date: Date, user: CurrentUserPayload): Promise<CommandeEntity[]> {
        const debutJour = new Date(date);
        debutJour.setHours(0, 0, 0, 0);

        const finJour = new Date(date);
        finJour.setHours(23, 59, 59, 999);

        const commandes = await this.db.commande.findMany({
            where: {
                dateCommande: { gte: debutJour, lte: finJour },
                ...(user.role !== Role.ADMIN && { idClient: user.id }),
            },
        });
        return commandes.map((c) => new CommandeEntity(c));
    }

    async findEntre2Date(startDate: Date, endDate: Date, user: CurrentUserPayload): Promise<CommandeEntity[]> {
        const commandes = await this.db.commande.findMany({
            where: {
                dateCommande: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(user.role !== Role.ADMIN && { idClient: user.id }),
            },
            orderBy: { dateCommande: 'asc' },
        });
        return commandes.map((c) => new CommandeEntity(c));
    }

    async statistiquesCommandesParMois( user: CurrentUserPayload,): Promise<{ mois: string; totalCommandes: number }[]> {
        const commandes = await this.db.commande.findMany({
            where: user.role !== Role.ADMIN ? { idClient: user.id } : {},
            select: { dateCommande: true },
        });

        const compteur = new Map<string, number>();
        for (const c of commandes) {
            const mois = `${c.dateCommande.getFullYear()}-${String(c.dateCommande.getMonth() + 1).padStart(2, '0')}`;
            compteur.set(mois, (compteur.get(mois) ?? 0) + 1);
        }

        return Array.from(compteur.entries())
            .map(([mois, totalCommandes]) => ({ mois, totalCommandes }))
            .sort((a, b) => a.mois.localeCompare(b.mois));
    }

    async statistiquesCommandesParStatut(user: CurrentUserPayload,): Promise<{ statut: StatutCommande; totalCommandes: number }[]> {
        const resultats = await this.db.commande.groupBy({
            by: ['statut'],
            _count: { statut: true },
            ...(user.role !== Role.ADMIN && { where: { idClient: user.id } }),
        });

        const statistiques = Object.values(StatutCommande).map((statut) => ({
            statut,
            totalCommandes: 0,
        }));

        for (const stat of statistiques) {
            const trouve = resultats.find((r) => r.statut === stat.statut);
            if (trouve) {
                stat.totalCommandes = trouve._count.statut;
            }
        }

        return statistiques;
    }
}
