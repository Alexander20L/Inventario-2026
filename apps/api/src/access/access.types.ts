import type { Request } from 'express';

export interface AccessContext {
  sesionId: bigint;
  usuarioId: bigint;
  empresaId: bigint;
  rol: string;
  nombre: string;
  correo: string;
  nombreEmpresa: string;
}

export interface AccessRequest extends Request {
  access: AccessContext;
}
