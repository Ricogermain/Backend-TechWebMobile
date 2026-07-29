import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;
    const targetId = Number(params.id);

    if (user.role === Role.ADMIN || user.id === targetId) {
      return true;
    }

    throw new ForbiddenException("Vous ne pouvez accéder qu'à votre propre profil");
  }
}