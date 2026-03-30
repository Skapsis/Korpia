/**
 * Valor típico de Prisma `DashboardLink.url`: UUID del dashboard en Superset,
 * o en algunos entornos una URL completa (p. ej. con localhost). El SDK
 * `embedDashboard` necesita solo el id (UUID); el host siempre debe ser
 * `NEXT_PUBLIC_SUPERSET_URL`.
 */
const DASHBOARD_UUID_RE =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

export function resolveSupersetEmbedDashboardId(rawFromDb: string): string {
  const trimmed = rawFromDb.trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(DASHBOARD_UUID_RE);
  if (match) {
    return match[0];
  }
  return trimmed;
}
