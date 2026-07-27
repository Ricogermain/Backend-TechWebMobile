import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Le terme de recherche ne peut pas être vide' })
  q?: string;
}