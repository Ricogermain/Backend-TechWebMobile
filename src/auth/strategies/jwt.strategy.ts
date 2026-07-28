import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { BlacklistService } from '../blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly blacklistService: BlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: number; email: string; role: string }) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && this.blacklistService.isRevoked(token)) {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}