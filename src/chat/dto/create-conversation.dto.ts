import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: 2, description: 'ID du second participant' })
  @IsNumber()
  participantId!: number;
}
