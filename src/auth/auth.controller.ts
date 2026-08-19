import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BlacklistService } from './blacklist.service';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blacklistService: BlacklistService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Inscription (rôle CLIENT, LIVREUR ou ADMIN, CLIENT par défaut)',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      client: {
        summary: 'Inscription client',
        value: {
          nom: 'Rico',
          email: 'rico@example.com',
          motDePasse: 'password123',
          telephone: '0341234567',
          role: 'CLIENT',
        },
      },
      livreur: {
        summary: 'Inscription livreur',
        value: {
          nom: 'Fara',
          email: 'fara@example.com',
          motDePasse: 'password123',
          role: 'LIVREUR',
        },
      },
      admin: {
        summary: 'Inscription admin',
        value: {
          nom: 'Admin',
          email: 'admin@example.com',
          motDePasse: 'password123',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Inscription réussie, token JWT et utilisateur renvoyés',
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute max
  @ApiOperation({ summary: 'Connexion (email + mot de passe)' })
  @ApiBody({
    type: LoginDto,
    examples: {
      exemple: {
        summary: 'Connexion',
        value: { email: 'rico@example.com', motDePasse: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Connexion réussie, token JWT renvoyé',
  })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 201, description: 'Déconnexion réussie' })
  @ApiResponse({
    status: 401,
    description: 'Token invalide, expiré ou déjà révoqué',
  })
  logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      this.blacklistService.revoke(token);
    }
    return { message: 'Déconnexion réussie' };
  }
}
