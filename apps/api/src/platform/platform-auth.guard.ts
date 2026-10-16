import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PlatformAuthService } from './platform-auth.service.js';
import type { PlatformRequest } from './platform.types.js';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(
    @Inject(PlatformAuthService)
    private readonly auth: PlatformAuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<PlatformRequest>();

    const match = /^Bearer ([a-f0-9]{64})$/i.exec(
      request.headers.authorization ?? '',
    );

    if (!match) {
      throw new UnauthorizedException(
        'Se requiere una sesión de plataforma',
      );
    }

    request.platformAccess =
      await this.auth.authenticate(match[1]);

    return true;
  }
}