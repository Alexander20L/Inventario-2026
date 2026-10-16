BEGIN TRY BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[MOVIMIENTOS_INVENTARIO] (
    [id_movimiento] BIGINT NOT NULL IDENTITY(1, 1),
    [empresa_id] BIGINT NOT NULL,
    [sucursal_id] BIGINT NOT NULL,
    [variante_id] BIGINT NOT NULL,
    [usuario_id] BIGINT NOT NULL,
    [tipo_movimiento] VARCHAR(40) NOT NULL,
    [cantidad] INT NOT NULL,
    [stock_anterior] INT NOT NULL,
    [stock_posterior] INT NOT NULL,
    [costo_unitario] DECIMAL(12, 2),
    [referencia_tipo] VARCHAR(40),
    [referencia_id] BIGINT,
    [observacion] NVARCHAR(500),
    [fecha_hora] DATETIME2 NOT NULL CONSTRAINT [MOVIMIENTOS_INVENTARIO_fecha_hora_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_cantidad_no_cero] CHECK ([cantidad] <> 0),
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_stock_anterior_no_negativo] CHECK ([stock_anterior] >= 0),
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_stock_posterior_no_negativo] CHECK ([stock_posterior] >= 0),
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_stock_consistente] CHECK ([stock_posterior] = [stock_anterior] + [cantidad]),
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_costo_no_negativo] CHECK (
        [costo_unitario] IS NULL
        OR [costo_unitario] >= 0
    ),
    CONSTRAINT [MOVIMIENTOS_INVENTARIO_pkey] PRIMARY KEY CLUSTERED ([id_movimiento])
);

-- CreateIndex
CREATE NONCLUSTERED
INDEX [MOVIMIENTOS_INVENTARIO_empresa_id_sucursal_id_fecha_hora_idx] ON [dbo].[MOVIMIENTOS_INVENTARIO] ([empresa_id], [sucursal_id], [fecha_hora]);

-- CreateIndex
CREATE NONCLUSTERED
INDEX [MOVIMIENTOS_INVENTARIO_empresa_id_variante_id_fecha_hora_idx] ON [dbo].[MOVIMIENTOS_INVENTARIO] ([empresa_id], [variante_id], [fecha_hora]);

-- CreateIndex
CREATE NONCLUSTERED
INDEX [MOVIMIENTOS_INVENTARIO_empresa_id_usuario_id_fecha_hora_idx] ON [dbo].[MOVIMIENTOS_INVENTARIO] ([empresa_id], [usuario_id], [fecha_hora]);

-- AddForeignKey
ALTER TABLE [dbo].[MOVIMIENTOS_INVENTARIO]
ADD CONSTRAINT [MOVIMIENTOS_INVENTARIO_empresa_id_fkey] FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[EMPRESAS] ([id_empresa]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MOVIMIENTOS_INVENTARIO]
ADD CONSTRAINT [MOVIMIENTOS_INVENTARIO_sucursal_id_empresa_id_fkey] FOREIGN KEY ([sucursal_id], [empresa_id]) REFERENCES [dbo].[SUCURSALES] ([id_sucursal], [empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MOVIMIENTOS_INVENTARIO]
ADD CONSTRAINT [MOVIMIENTOS_INVENTARIO_variante_id_empresa_id_fkey] FOREIGN KEY ([variante_id], [empresa_id]) REFERENCES [dbo].[VARIANTES_PRODUCTO] ([id_variante], [empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MOVIMIENTOS_INVENTARIO]
ADD CONSTRAINT [MOVIMIENTOS_INVENTARIO_usuario_id_empresa_id_fkey] FOREIGN KEY ([usuario_id], [empresa_id]) REFERENCES [dbo].[USUARIOS_EMPRESAS] ([usuario_id], [empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY BEGIN CATCH IF @@TRANCOUNT > 0 BEGIN ROLLBACK TRAN;

END;

THROW END CATCH
