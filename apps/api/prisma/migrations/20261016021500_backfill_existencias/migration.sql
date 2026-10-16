BEGIN TRY

BEGIN TRAN;

INSERT INTO [dbo].[EXISTENCIAS]
(
    [empresa_id],
    [sucursal_id],
    [variante_id],
    [stock_actual],
    [actualizado_en]
)
SELECT
    v.[empresa_id],
    s.[id_sucursal],
    v.[id_variante],
    0,
    CURRENT_TIMESTAMP
FROM [dbo].[VARIANTES_PRODUCTO] v
INNER JOIN [dbo].[SUCURSALES] s
    ON s.[empresa_id] = v.[empresa_id]
WHERE NOT EXISTS
(
    SELECT 1
    FROM [dbo].[EXISTENCIAS] e
    WHERE e.[sucursal_id] = s.[id_sucursal]
      AND e.[variante_id] = v.[id_variante]
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