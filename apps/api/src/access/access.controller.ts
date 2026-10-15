import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { InvitationsService } from './invitations.service.js';
import { AdminGuard, AuthGuard, AuthRateGuard } from './access.guards.js';
import type { AccessRequest } from './access.types.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(InvitationsService)
    private readonly invitations: InvitationsService,
  ) {}

  @Post('register-company')
  @UseGuards(AuthRateGuard)
  register(@Body() body: unknown) {
    return this.auth.registerCompany(body);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthRateGuard)
  login(@Body() body: unknown) {
    return this.auth.login(body);
  }

  @Post('accept-invitation')
  @UseGuards(AuthRateGuard)
  accept(@Body() body: unknown) {
    return this.invitations.accept(body);
  }

  @Post('invitation-preview')
  @HttpCode(200)
  @UseGuards(AuthRateGuard)
  preview(@Body() body: unknown) {
    return this.invitations.preview(body);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AccessRequest) {
    const access = request.access;
    return {
      usuario: {
        id: access.usuarioId.toString(),
        nombre: access.nombre,
        correo: access.correo,
      },
      empresa: {
        id: access.empresaId.toString(),
        nombre: access.nombreEmpresa,
      },
      rol: access.rol,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  logout(@Req() request: AccessRequest) {
    return this.auth.logout(request.access);
  }
}

@Controller('invitations')
@UseGuards(AuthGuard, AdminGuard)
export class InvitationsController {
  constructor(
    @Inject(InvitationsService)
    private readonly invitations: InvitationsService,
  ) {}

  @Post()
  create(@Req() request: AccessRequest, @Body() body: unknown) {
    return this.invitations.create(request.access, body);
  }

  @Get()
  list(@Req() request: AccessRequest, @Query('after') after?: string) {
    return this.invitations.list(request.access, after);
  }

  @Post(':id/revoke')
  @HttpCode(200)
  revoke(@Req() request: AccessRequest, @Param('id') id: string) {
    return this.invitations.revoke(request.access, id);
  }
}

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(
    @Inject(InvitationsService)
    private readonly invitations: InvitationsService,
  ) {}

  @Get()
  list(@Req() request: AccessRequest, @Query('after') after?: string) {
    return this.invitations.users(request.access, after);
  }

  @Patch(':id/status')
  status(
    @Req() request: AccessRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.invitations.setWorkerStatus(request.access, id, body);
  }
}
