import { Injectable, NotFoundException } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from 'src/database/database.service';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { VehiculeEntity } from './entities/vehicule.entity';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';
import { buildPhotoUrl, VEHICULE_PHOTO_DIR } from './vehicules-upload.config';

@Injectable()
export class VehiculesService {
    constructor(private readonly db: DatabaseService) {}

    /**
     * Associe un fichier uploadé au véhicule et nettoie l'ancienne photo si
     * celle-ci avait déjà été uploadée sur le serveur.
     */
    async uploadPhoto(id: number, file: Express.Multer.File): Promise<VehiculeEntity> {
        const existe = await this.db.vehicule.findUnique({ where: { id } });
        if (!existe) {
            this.deletePhotoFileOnDisk(file.path);
            throw new NotFoundException('Vehicule non trouvé');
        }

        const photoUrl = buildPhotoUrl(file.filename);
        const updated = await this.db.vehicule.update({
            where: { id },
            data: { imageUrl: photoUrl },
        });

        // L'ancienne photo n'est supprimée qu'après la mise à jour réussie.
        this.deletePhotoFileOnDisk(existe.imageUrl);
        return new VehiculeEntity(updated);
    }

    /**
     * Supprime le fichier photo associé à une URL de la forme /uploads/vehicules/...
     * Les URLs externes (http, data:, asset:) sont ignorées.
     */
    private deletePhotoFileOnDisk(imageUrl?: string | null): void {
        if (!imageUrl) return;

        const marker = `/${VEHICULE_PHOTO_DIR}/`;
        if (!imageUrl.startsWith(marker)) return;

        const filename = imageUrl.substring(marker.length);
        if (!filename || filename.includes('..') || filename.includes('/')) return;

        try {
            unlinkSync(join(process.cwd(), VEHICULE_PHOTO_DIR, filename));
        } catch {
            // Fichier déjà absent : rien à faire.
        }
    }

    async create(dto: CreateVehiculeDto): Promise<VehiculeEntity>{
        const vehicule = await this.db.vehicule.create({
            data: {
                marque: dto.marque,      
                modele: dto.modele,
                annee: dto.annee,
                prix: dto.prix,
                stock: dto.stock,
                imageUrl: dto.imageUrl,
                disponible: dto.disponible,
            }
        });

        return new VehiculeEntity(vehicule)
    }
    
    async findAll(disponible?: string): Promise<VehiculeEntity[]> {
        const vehicule = await this.db.vehicule.findMany({
            where: disponible !== undefined ? { disponible: disponible === 'true' } : undefined,
            orderBy: { id: 'asc' },
        });

        return vehicule.map((vehicule) => new VehiculeEntity(vehicule));
    }

    findOne(id: number): Promise<VehiculeEntity | null> {
        return this.db.vehicule.findUnique({ where: { id } }).then((vehicule) => {
            return vehicule ? new VehiculeEntity(vehicule) : null;
        });
    }
    
    async findAnnee(annee: number): Promise<VehiculeEntity[]> {
        const vehicules = await this.db.vehicule.findMany({
            where: { annee: annee },
            orderBy: { id: 'asc' },
        });

        return vehicules.map((vehicule) => new VehiculeEntity(vehicule));
    }

    async recherche(query?: string): Promise<VehiculeEntity[]> {
        if (!query) {
            return this.findAll();
        }
        const vehicule = await this.db.vehicule.findMany({
            where: {
                OR: [
                    { marque: { contains: query, mode: 'insensitive' } },
                    { modele: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { id: 'asc' },
        });
        return vehicule.map((vehicule) => new VehiculeEntity(vehicule));
    }

    async update(id: number, dto: UpdateVehiculeDto): Promise<VehiculeEntity> {
        const existe = await this.db.vehicule.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Vehicule non trouvé');
        }
        
        const updated = await this.db.vehicule.update({
            where: { id },
            data: dto,
        });
        return new VehiculeEntity(updated);
    }

    async remove(id: number): Promise<VehiculeEntity> {
        const existe = await this.db.vehicule.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Vehicule non trouvé');
        }
        const supprimer = await this.db.vehicule.delete({
            where: { id },
        });

        // Supprime aussi la photo éventuellement uploadée sur le serveur.
        this.deletePhotoFileOnDisk(existe.imageUrl);

        return new VehiculeEntity(supprimer);
    }
}
