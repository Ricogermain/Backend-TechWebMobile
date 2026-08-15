import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Rico', description: 'Nom complet' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'rico@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  motDePasse: string;

  @ApiProperty({ example: '0341234567', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({
    enum: Role,
    example: Role.CLIENT,
    required: false,
    description: "Rôle de l'utilisateur : CLIENT, LIVREUR ou ADMIN (CLIENT par défaut)",
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide (CLIENT, LIVREUR ou ADMIN)' })
  role?: Role;
}