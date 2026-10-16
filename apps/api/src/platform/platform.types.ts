import type { Request } from 'express';

export interface PlatformAccessContext {
  sesionId: bigint;
  administradorId: bigint;
  nombre: string;
  correo: string;
}

export interface PlatformRequest extends Request {
  platformAccess: PlatformAccessContext;
}