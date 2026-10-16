/*
Warnings:

- A unique constraint covering the columns `[id_sucursal,empresa_id]` on the table `SUCURSALES` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[EXISTENCIAS] (
    [id_existencia] BIGINT NOT NULL IDENTITY(1, 1),
    [empresa_id] BIGINT NOT NULL,
    [sucursal_id] BIGINT NOT NULL,
    [variante_id] BIGINT NOT NULL,
    [stock_actual] INT NOT NULL CONSTRAINT [EXISTENCIAS_stock_actual_df] DEFAULT 0,
    [actualizado_en] DATETIME2 NOT NULL,
    CONSTRAINT [EXISTENCIAS_stock_no_negativo] CHECK ([stock_actual] >= 0),
    CONSTRAINT [EXISTENCIAS_pkey] PRIMARY KEY CLUSTERED ([id_existencia]),
    CONSTRAINT [EXISTENCIAS_sucursal_id_variante_id_key] UNIQUE NONCLUSTERED ([sucursal_id], [variante_id])
);

-- CreateIndex
CREATE NONCLUSTERED
INDEX [EXISTENCIAS_empresa_id_sucursal_id_idx] ON [dbo].[EXISTENCIAS] ([empresa_id], [sucursal_id]);

-- CreateIndex
CREATE NONCLUSTERED
INDEX [EXISTENCIAS_empresa_id_variante_id_idx] ON [dbo].[EXISTENCIAS] ([empresa_id], [variante_id]);

-- CreateIndex
ALTER TABLE [dbo].[SUCURSALES]
ADD CONSTRAINT [SUCURSALES_id_sucursal_empresa_id_key] UNIQUE NONCLUSTERED ([id_sucursal], [empresa_id]);

-- AddForeignKey
ALTER TABLE [dbo].[EXISTENCIAS]
ADD CONSTRAINT [EXISTENCIAS_sucursal_id_empresa_id_fkey] FOREIGN KEY ([sucursal_id], [empresa_id]) REFERENCES [dbo].[SUCURSALES] ([id_sucursal], [empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EXISTENCIAS]
ADD CONSTRAINT [EXISTENCIAS_variante_id_empresa_id_fkey] FOREIGN KEY ([variante_id], [empresa_id]) REFERENCES [dbo].[VARIANTES_PRODUCTO] ([id_variante], [empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY BEGIN CATCH IF @@TRANCOUNT > 0 BEGIN ROLLBACK TRAN;

END;

THROW END CATCH
