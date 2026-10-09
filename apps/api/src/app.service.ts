import { Injectable } from '@nestjs/common';

import { PrismaService } from './infrastructure/database/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDatabaseHealth() {
    const empresas = await this.prisma.empresa.count();

    return {
      status: 'ok',
      database: 'connected',
      empresas,
    };
  }
}