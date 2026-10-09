import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';

import { PrismaClient } from '../../generated/prisma/client.js';

function parseSqlServerConnectionString(connectionString: string) {
  const prefix = 'sqlserver://';

  if (!connectionString.startsWith(prefix)) {
    throw new Error('DATABASE_URL debe comenzar con sqlserver://');
  }

  const connection = connectionString.slice(prefix.length);
  const firstSemicolon = connection.indexOf(';');

  const serverPart =
    firstSemicolon === -1
      ? connection
      : connection.slice(0, firstSemicolon);

  const parametersPart =
    firstSemicolon === -1
      ? ''
      : connection.slice(firstSemicolon + 1);

  const [server, portText] = serverPart.split(':');

  if (!server) {
    throw new Error('DATABASE_URL no contiene un servidor válido');
  }

  const parameters = new Map<string, string>();
  const parts: string[] = [];

  let current = '';
  let insideBraces = false;

  for (const character of parametersPart) {
    if (character === '{') {
      insideBraces = true;
    } else if (character === '}') {
      insideBraces = false;
    }

    if (character === ';' && !insideBraces) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  if (current) {
    parts.push(current);
  }

  for (const part of parts) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator).trim().toLowerCase();

    let value = part.slice(separator + 1).trim();

    if (value.startsWith('{') && value.endsWith('}')) {
      value = value.slice(1, -1);
    }

    parameters.set(key, value);
  }

  const database = parameters.get('database');
  const user =
    parameters.get('user') ??
    parameters.get('username') ??
    parameters.get('uid');
  const password =
    parameters.get('password') ??
    parameters.get('pwd');

  if (!database || !user || !password) {
    throw new Error(
      'DATABASE_URL debe contener database, user y password',
    );
  }

  return {
    server,
    port: portText ? Number(portText) : 1433,
    database,
    user,
    password,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: parameters.get('encrypt') !== 'false',
      trustServerCertificate:
        parameters.get('trustservercertificate') === 'true',
    },
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const databaseUrl =
      configService.getOrThrow<string>('DATABASE_URL');

    const sqlConfig =
      parseSqlServerConnectionString(databaseUrl);

    const adapter = new PrismaMssql(sqlConfig);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}