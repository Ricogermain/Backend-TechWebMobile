import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion (email + mot de passe) avec  JWT' })
  @ApiBody({
    type: LoginDto,
    examples: {
      exemple: { summary: 'Connexion', value: { email: 'rico@example.com', motDePasse: 'password123' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Connexion réussie, token JWT renvoyé' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}