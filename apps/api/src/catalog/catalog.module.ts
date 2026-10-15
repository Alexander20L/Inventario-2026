import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import {
  ProductsController,
  SuppliersController,
} from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [AccessModule],
  controllers: [ProductsController, SuppliersController],
  providers: [CatalogService],
})
export class CatalogModule {}
