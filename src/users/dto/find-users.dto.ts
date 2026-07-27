import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class FindUsersDto {
  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide (CLIENT, ADMIN ou LIVREUR)' })
  role?: Role;
}