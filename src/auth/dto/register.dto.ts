import { CreateUserDto } from '../../users/dto/create-user.dto';

/**
 * DTO d'inscription : reprend tous les champs du CreateUserDto,
 * y compris le rôle optionnel (CLIENT, LIVREUR ou ADMIN).
 */
export class RegisterDto extends CreateUserDto {}
