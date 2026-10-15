import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, AdminGuard } from '../access/access.guards.js';
import type { AccessRequest } from '../access/access.types.js';
import { CatalogService } from './catalog.service.js';
import type { searchInput } from './catalog.input.js';

type Search = Parameters<typeof searchInput>[0];

@Controller('products')
@UseGuards(AuthGuard, AdminGuard)
export class ProductsController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  @Get()
  list(@Req() request: AccessRequest, @Query() query: Search) {
    return this.catalog.products(request.access, query);
  }

  @Get(':id')
  detail(@Req() request: AccessRequest, @Param('id') id: string) {
    return this.catalog.product(request.access, id);
  }

  @Post()
  create(@Req() request: AccessRequest, @Body() body: unknown) {
    return this.catalog.saveProduct(request.access, body);
  }

  @Put(':id')
  update(
    @Req() request: AccessRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.saveProduct(request.access, body, id);
  }
}

@Controller('suppliers')
@UseGuards(AuthGuard, AdminGuard)
export class SuppliersController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  @Get()
  list(@Req() request: AccessRequest, @Query() query: Search) {
    return this.catalog.suppliers(request.access, query);
  }

  @Get(':id')
  detail(
    @Req() request: AccessRequest,
    @Param('id') id: string,
    @Query('after') after?: string,
  ) {
    return this.catalog.supplier(request.access, id, after);
  }

  @Post()
  create(@Req() request: AccessRequest, @Body() body: unknown) {
    return this.catalog.saveSupplier(request.access, body);
  }

  @Put(':id')
  update(
    @Req() request: AccessRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.saveSupplier(request.access, body, id);
  }
}
