import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.LIVREUR })
  @IsEnum(Role, { message: 'Rôle invalide' })
  role: Role;
}