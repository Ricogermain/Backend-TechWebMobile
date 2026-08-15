import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) {}

    async create(dto: CreateUserDto): Promise<UserEntity> {
        const existe = await this.db.utilisateur.findUnique({
            where: { email: dto.email },
        });
        if (existe) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà');
        }

        const hashedPassword = await bcrypt.hash(dto.motDePasse, 10);

        const user = await this.db.utilisateur.create({
            data: {
                nom: dto.nom,
                email: dto.email,
                motDePasse: hashedPassword,
                telephone: dto.telephone,
                ...(dto.role ? { role: dto.role } : {}),
            },
        });

        return new UserEntity(user);
    }

    async findAll(role?: Role): Promise<UserEntity[]> {
        const users = await this.db.utilisateur.findMany({
            where: role ? { role } : undefined,
            orderBy: { id: 'asc' },
        });

        return users.map((user) => new UserEntity(user));
    }

    findOne(id: number): Promise<UserEntity | null> {
        return this.db.utilisateur.findUnique({ where: { id } }).then((user) => {
            return user ? new UserEntity(user) : null;
        });
    }

    findEmail(email: string): Promise<UserEntity | null> {
        return this.db.utilisateur.findUnique({ where: { email } }).then((user) => {
            return user ? new UserEntity(user) : null;
        });
    }

    async recherche(query?: string): Promise<UserEntity[]> {
        if (!query) {
            return this.findAll();
        }
        const users = await this.db.utilisateur.findMany({
            where: {
                OR: [
                    { nom: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { telephone: { contains: query } },
                ],
            },
            orderBy: { id: 'asc' },
        });
        return users.map((user) => new UserEntity(user));
    }

    async update(id: number, dto: UpdateUserDto): Promise<UserEntity> {
        const existe = await this.db.utilisateur.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        if (dto.email && dto.email !== existe.email) {
            const email_existe = await this.db.utilisateur.findUnique({
                where: { email: dto.email },
            });
            if (email_existe) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }
        }
        const updated = await this.db.utilisateur.update({
            where: { id },
            data: dto,
        });
        return new UserEntity(updated);
    }

    async remove(id: number): Promise<UserEntity> {
        const existe = await this.db.utilisateur.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return this.db.utilisateur.delete({
            where: { id },
        });
    }

    async updateRole(id: number, role: Role): Promise<UserEntity> {
        const existe = await this.db.utilisateur.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        const updated = await this.db.utilisateur.update({
            where: { id },
            data: { role },
        });

        return new UserEntity(updated);
    }

    //Pour l'authentification seulement
    async findEmailForAuth(email: string) {
        return this.db.utilisateur.findUnique({ where: { email } });
    }
}