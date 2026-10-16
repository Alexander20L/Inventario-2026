import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthRateGuard } from '../access/access.guards.js';
import { PlatformAuthGuard } from './platform-auth.guard.js';
import { PlatformAuthService } from './platform-auth.service.js';
import type { PlatformRequest } from './platform.types.js';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(
    @Inject(PlatformAuthService)
    private readonly auth: PlatformAuthService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthRateGuard)
  login(@Body() body: unknown) {
    return this.auth.login(body);
  }

  @Get('me')
  @UseGuards(PlatformAuthGuard)
  me(@Req() request: PlatformRequest) {
    return {
      administrador: {
        id: request.platformAccess.administradorId.toString(),
        nombre: request.platformAccess.nombre,
        correo: request.platformAccess.correo,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(PlatformAuthGuard)
  logout(@Req() request: PlatformRequest) {
    return this.auth.logout(request.platformAccess);
  }
}