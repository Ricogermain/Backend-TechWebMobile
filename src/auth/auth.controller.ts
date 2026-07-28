import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BlacklistService } from './blacklist.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blacklistService: BlacklistService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion (email + mot de passe)' })
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

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 201, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Token invalide, expiré ou déjà révoqué' })
  logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      this.blacklistService.revoke(token);
    }
    return { message: 'Déconnexion réussie' };
  }
}