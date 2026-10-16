import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard, AuthGuard } from '../access/access.guards.js';
import { id } from '../access/access.input.js';
import type { AccessRequest } from '../access/access.types.js';
import { movementInput, movementSearchInput } from './inventory.input.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventory: InventoryService,
  ) {}

  @Get('stock/:sucursalId')
  stock(
    @Req() request: AccessRequest,
    @Param('sucursalId') sucursalId: string,
  ) {
    return this.inventory.stockPorSucursal(
      request.access,
      id(sucursalId, 'sucursalId'),
    );
  }
  @Get('movements')
  movements(
    @Req() request: AccessRequest,
    @Query()
    query: {
      sucursalId?: string;
      varianteId?: string;
      after?: string;
    },
  ) {
    return this.inventory.movimientos(
      request.access,
      movementSearchInput(query),
    );
  }

  @Post('movements')
  @UseGuards(AdminGuard)
  movement(@Req() request: AccessRequest, @Body() body: unknown) {
    const input = movementInput(body);

    const esSalida =
      input.tipoMovimiento === 'SALIDA_MANUAL' ||
      input.tipoMovimiento === 'AJUSTE_NEGATIVO';

    return this.inventory.registrarMovimiento(request.access, {
      ...input,
      cantidad: esSalida ? -input.cantidad : input.cantidad,
    });
  }
}
