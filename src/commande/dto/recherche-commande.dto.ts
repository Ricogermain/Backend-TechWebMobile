import { IsOptional, IsString, MinLength } from "class-validator";

export class RechercheCommandeDto {
    @IsOptional()
    @IsString()
    @MinLength(1, { message: 'Le terme de recherche ne peut pas être vide' })
    q?: string;
}