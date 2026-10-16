import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AdminGuard,
  AuthGuard,
} from '../access/access.guards.js';
import type { AccessRequest } from '../access/access.types.js';
import { BranchesService } from './branches.service.js';

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchesController {
  constructor(
    @Inject(BranchesService)
    private readonly branches: BranchesService,
  ) {}

  @Get()
  list(@Req() request: AccessRequest) {
    return this.branches.branches(request.access);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Req() request: AccessRequest,
    @Body() body: unknown,
  ) {
    return this.branches.saveBranch(
      request.access,
      body,
    );
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(
    @Req() request: AccessRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.branches.saveBranch(
      request.access,
      body,
      id,
    );
  }
}