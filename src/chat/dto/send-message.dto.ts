import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 1, description: 'ID de la conversation' })
  @IsNumber()
  conversationId!: number;

  @ApiProperty({ example: 'Bonjour, où est mon véhicule ?', description: 'Contenu du message' })
  @IsString()
  @MaxLength(2000)
  contenu!: string;
}
