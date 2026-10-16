BEGIN TRY

BEGIN TRAN;

INSERT INTO [dbo].[SUCURSALES]
(
    [empresa_id],
    [nombre],
    [direccion],
    [telefono],
    [estado],
    [creado_en],
    [actualizado_en]
)
SELECT
    e.[id_empresa],
    N'Sucursal Principal',
    e.[direccion],
    e.[telefono],
    'ACTIVO',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM [dbo].[EMPRESAS] e
WHERE NOT EXISTS
(
    SELECT 1
    FROM [dbo].[SUCURSALES] s
    WHERE s.[empresa_id] = e.[id_empresa]
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH