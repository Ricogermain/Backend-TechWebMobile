import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class AnneeVehiculeDto {
    @ApiProperty({ example: 2023 })
    @IsInt()
    @Min(1990, { message: 'Année invalide' })
    @Max(new Date().getFullYear() + 1, { message: 'Année invalide' })
    annee: number;
}