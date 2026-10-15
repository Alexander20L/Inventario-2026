BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PRODUCTOS] (
    [id_producto] BIGINT NOT NULL IDENTITY(1,1),
    [empresa_id] BIGINT NOT NULL,
    [nombre] NVARCHAR(200) NOT NULL,
    [presentacion] NVARCHAR(150),
    [estado] VARCHAR(20) NOT NULL CONSTRAINT [PRODUCTOS_estado_df] DEFAULT 'ACTIVO',
    [creado_en] DATETIME2 NOT NULL CONSTRAINT [PRODUCTOS_creado_en_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizado_en] DATETIME2 NOT NULL,
    CONSTRAINT [PRODUCTOS_pkey] PRIMARY KEY CLUSTERED ([id_producto]),
    CONSTRAINT [PRODUCTOS_id_producto_empresa_id_key] UNIQUE NONCLUSTERED ([id_producto],[empresa_id])
);

-- CreateTable
CREATE TABLE [dbo].[VARIANTES_PRODUCTO] (
    [id_variante] BIGINT NOT NULL IDENTITY(1,1),
    [empresa_id] BIGINT NOT NULL,
    [producto_id] BIGINT NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL CONSTRAINT [VARIANTES_PRODUCTO_nombre_df] DEFAULT 'DEFAULT',
    [precio_venta] DECIMAL(12,2) NOT NULL,
    [stock_minimo] INT NOT NULL CONSTRAINT [VARIANTES_PRODUCTO_stock_minimo_df] DEFAULT 0,
    [creado_en] DATETIME2 NOT NULL CONSTRAINT [VARIANTES_PRODUCTO_creado_en_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizado_en] DATETIME2 NOT NULL,
    CONSTRAINT [VARIANTES_PRODUCTO_precio_no_negativo] CHECK ([precio_venta] >= 0),
    CONSTRAINT [VARIANTES_PRODUCTO_minimo_no_negativo] CHECK ([stock_minimo] >= 0),
    CONSTRAINT [VARIANTES_PRODUCTO_pkey] PRIMARY KEY CLUSTERED ([id_variante]),
    CONSTRAINT [VARIANTES_PRODUCTO_id_variante_empresa_id_key] UNIQUE NONCLUSTERED ([id_variante],[empresa_id]),
    CONSTRAINT [VARIANTES_PRODUCTO_producto_id_empresa_id_nombre_key] UNIQUE NONCLUSTERED ([producto_id],[empresa_id],[nombre])
);

-- CreateTable
CREATE TABLE [dbo].[CODIGOS_BARRAS] (
    [id_codigo] BIGINT NOT NULL IDENTITY(1,1),
    [empresa_id] BIGINT NOT NULL,
    [variante_id] BIGINT NOT NULL,
    [codigo] VARCHAR(64) NOT NULL,
    CONSTRAINT [CODIGOS_BARRAS_pkey] PRIMARY KEY CLUSTERED ([id_codigo]),
    CONSTRAINT [CODIGOS_BARRAS_empresa_id_codigo_key] UNIQUE NONCLUSTERED ([empresa_id],[codigo]),
    CONSTRAINT [CODIGOS_BARRAS_variante_id_empresa_id_key] UNIQUE NONCLUSTERED ([variante_id],[empresa_id])
);

-- CreateTable
CREATE TABLE [dbo].[PROVEEDORES] (
    [id_proveedor] BIGINT NOT NULL IDENTITY(1,1),
    [empresa_id] BIGINT NOT NULL,
    [nombre_contacto] NVARCHAR(150) NOT NULL,
    [distribuidora] NVARCHAR(200),
    [telefono] VARCHAR(30) NOT NULL,
    [correo] VARCHAR(150),
    [direccion] NVARCHAR(300),
    [numero_documento] VARCHAR(20),
    [dias_visita] NVARCHAR(150),
    [notas] NVARCHAR(1000),
    [estado] VARCHAR(20) NOT NULL CONSTRAINT [PROVEEDORES_estado_df] DEFAULT 'ACTIVO',
    [creado_en] DATETIME2 NOT NULL CONSTRAINT [PROVEEDORES_creado_en_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizado_en] DATETIME2 NOT NULL,
    CONSTRAINT [PROVEEDORES_pkey] PRIMARY KEY CLUSTERED ([id_proveedor]),
    CONSTRAINT [PROVEEDORES_id_proveedor_empresa_id_key] UNIQUE NONCLUSTERED ([id_proveedor],[empresa_id])
);

-- CreateTable
CREATE TABLE [dbo].[PRODUCTOS_PROVEEDORES] (
    [empresa_id] BIGINT NOT NULL,
    [producto_id] BIGINT NOT NULL,
    [proveedor_id] BIGINT NOT NULL,
    CONSTRAINT [PRODUCTOS_PROVEEDORES_pkey] PRIMARY KEY CLUSTERED ([empresa_id],[producto_id],[proveedor_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PRODUCTOS_empresa_id_estado_idx] ON [dbo].[PRODUCTOS]([empresa_id], [estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PROVEEDORES_empresa_id_estado_idx] ON [dbo].[PROVEEDORES]([empresa_id], [estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PRODUCTOS_PROVEEDORES_proveedor_id_empresa_id_idx] ON [dbo].[PRODUCTOS_PROVEEDORES]([proveedor_id], [empresa_id]);

-- AddForeignKey
ALTER TABLE [dbo].[PRODUCTOS] ADD CONSTRAINT [PRODUCTOS_empresa_id_fkey] FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[EMPRESAS]([id_empresa]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VARIANTES_PRODUCTO] ADD CONSTRAINT [VARIANTES_PRODUCTO_producto_id_empresa_id_fkey] FOREIGN KEY ([producto_id], [empresa_id]) REFERENCES [dbo].[PRODUCTOS]([id_producto],[empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CODIGOS_BARRAS] ADD CONSTRAINT [CODIGOS_BARRAS_variante_id_empresa_id_fkey] FOREIGN KEY ([variante_id], [empresa_id]) REFERENCES [dbo].[VARIANTES_PRODUCTO]([id_variante],[empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PROVEEDORES] ADD CONSTRAINT [PROVEEDORES_empresa_id_fkey] FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[EMPRESAS]([id_empresa]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PRODUCTOS_PROVEEDORES] ADD CONSTRAINT [PRODUCTOS_PROVEEDORES_producto_id_empresa_id_fkey] FOREIGN KEY ([producto_id], [empresa_id]) REFERENCES [dbo].[PRODUCTOS]([id_producto],[empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PRODUCTOS_PROVEEDORES] ADD CONSTRAINT [PRODUCTOS_PROVEEDORES_proveedor_id_empresa_id_fkey] FOREIGN KEY ([proveedor_id], [empresa_id]) REFERENCES [dbo].[PROVEEDORES]([id_proveedor],[empresa_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
