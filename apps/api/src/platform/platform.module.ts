import { Module } from '@nestjs/common';

import { AuthRateGuard } from '../access/access.guards.js';
import { PlatformAuthController } from './platform-auth.controller.js';
import { PlatformAuthGuard } from './platform-auth.guard.js';
import { PlatformAuthService } from './platform-auth.service.js';

@Module({
  controllers: [PlatformAuthController],
  providers: [
    PlatformAuthService,
    PlatformAuthGuard,
    AuthRateGuard,
  ],
  exports: [
    PlatformAuthService,
    PlatformAuthGuard,
  ],
})
export class PlatformModule {}