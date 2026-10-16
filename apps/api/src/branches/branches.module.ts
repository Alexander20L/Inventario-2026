import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [AccessModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}