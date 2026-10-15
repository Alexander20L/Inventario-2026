import { Module } from '@nestjs/common';
import {
  AuthController,
  InvitationsController,
  UsersController,
} from './access.controller.js';
import { AuthService } from './auth.service.js';
import { InvitationsService } from './invitations.service.js';
import { AdminGuard, AuthGuard, AuthRateGuard } from './access.guards.js';

@Module({
  controllers: [AuthController, InvitationsController, UsersController],
  providers: [
    AuthService,
    InvitationsService,
    AuthGuard,
    AdminGuard,
    AuthRateGuard,
  ],
  exports: [AuthService, AuthGuard, AdminGuard],
})
export class AccessModule {}
