import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class FindUsersDto {
  @ApiProperty({ enum: Role, required: false, example: Role.CLIENT })
  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide (CLIENT, ADMIN ou LIVREUR)' })
  role?: Role;
}