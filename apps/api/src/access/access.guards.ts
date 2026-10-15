import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { AccessRequest } from './access.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AccessRequest>();
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(
      request.headers.authorization ?? '',
    );
    if (!match)
      throw new UnauthorizedException('Se requiere una sesión Bearer');
    request.access = await this.auth.authenticate(match[1]);
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (
      context.switchToHttp().getRequest<AccessRequest>().access?.rol !==
      'ADMINISTRADOR'
    ) {
      throw new ForbiddenException(
        'Esta operación es exclusiva del administrador',
      );
    }
    return true;
  }
}

// Límite básico por IP y proceso. En despliegues con varias instancias se debe
// trasladar a un almacén compartido o al proxy de entrada.
@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly attempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AccessRequest>();
    const now = Date.now();
    for (const [key, value] of this.attempts) {
      if (value.resetAt <= now) this.attempts.delete(key);
    }
    const key = request.ip ?? 'unknown';
    const value = this.attempts.get(key) ?? { count: 0, resetAt: now + 60000 };
    value.count++;
    this.attempts.set(key, value);
    if (value.count > 30)
      throw new HttpException('Demasiados intentos. Espera un minuto.', 429);
    return true;
  }
}
