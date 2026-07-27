import { Exclude } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserEntity {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  motDePasse: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}