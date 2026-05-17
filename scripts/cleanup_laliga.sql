-- ============================================================================
-- Limpieza de partidos de La Liga y sus predicciones
-- ----------------------------------------------------------------------------
-- Deja en la BD únicamente partidos del Mundial 2026 (GROUP_STAGE,
-- ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, FINAL) y sus predicciones.
--
-- Los partidos de La Liga se identifican por Stage que contiene "REGULAR"
-- (e.g. REGULAR_SEASON). Es el mismo criterio que usa SyncResultsFunction.
--
-- Ejecución sugerida:
--   1. Conéctate a la base de datos dbfrancachela.
--   2. Corre todo el script tal cual: queda dentro de una transacción y
--      al final hace ROLLBACK por seguridad, mostrándote los conteos.
--   3. Si los conteos son los esperados, cambia el ROLLBACK final por
--      COMMIT y vuelve a ejecutar.
-- ============================================================================

SET NOCOUNT ON;

BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. Previsualización: qué se va a borrar
-- ----------------------------------------------------------------------------
PRINT '--- Partidos de La Liga que serán eliminados ---';
SELECT Id, HomeTeam, AwayTeam, Stage, MatchDate, Status
FROM Matches
WHERE Stage LIKE '%REGULAR%'
ORDER BY MatchDate;

PRINT '--- Predicciones asociadas que serán eliminadas ---';
SELECT p.Id, p.UserId, p.MatchId, p.PredictedHomeScore, p.PredictedAwayScore, p.PointsEarned
FROM Predictions p
INNER JOIN Matches m ON m.Id = p.MatchId
WHERE m.Stage LIKE '%REGULAR%';

DECLARE @predictionsBefore INT = (
    SELECT COUNT(*) FROM Predictions p
    INNER JOIN Matches m ON m.Id = p.MatchId
    WHERE m.Stage LIKE '%REGULAR%'
);
DECLARE @matchesBefore INT = (
    SELECT COUNT(*) FROM Matches WHERE Stage LIKE '%REGULAR%'
);

PRINT CONCAT('Total predicciones a borrar: ', @predictionsBefore);
PRINT CONCAT('Total partidos a borrar:     ', @matchesBefore);

-- ----------------------------------------------------------------------------
-- 2. Borrado explícito de predicciones (antes que matches por claridad,
--    aunque el FK tiene ON DELETE CASCADE configurado por EF Core).
-- ----------------------------------------------------------------------------
DELETE p
FROM Predictions p
INNER JOIN Matches m ON m.Id = p.MatchId
WHERE m.Stage LIKE '%REGULAR%';

DECLARE @predictionsDeleted INT = @@ROWCOUNT;
PRINT CONCAT('Predicciones eliminadas: ', @predictionsDeleted);

-- ----------------------------------------------------------------------------
-- 3. Borrado de partidos de La Liga
-- ----------------------------------------------------------------------------
DELETE FROM Matches
WHERE Stage LIKE '%REGULAR%';

DECLARE @matchesDeleted INT = @@ROWCOUNT;
PRINT CONCAT('Partidos eliminados:     ', @matchesDeleted);

-- ----------------------------------------------------------------------------
-- 4. Verificación post-borrado (debe devolver únicamente partidos del Mundial)
-- ----------------------------------------------------------------------------
PRINT '--- Resumen de partidos restantes por Stage ---';
SELECT Stage, COUNT(*) AS Total
FROM Matches
GROUP BY Stage
ORDER BY Stage;

PRINT '--- Resumen de predicciones restantes ---';
SELECT COUNT(*) AS PrediccionesRestantes FROM Predictions;

-- ----------------------------------------------------------------------------
-- 5. Seguridad: por defecto se hace ROLLBACK. Revisa los resultados arriba y,
--    si todo está OK, comenta el ROLLBACK y descomenta el COMMIT.
-- ----------------------------------------------------------------------------
ROLLBACK TRANSACTION;
-- COMMIT TRANSACTION;
