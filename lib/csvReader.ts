import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import csv from "csv-parser";

export interface ADUser {
  nombre: string;
  email: string;
  grupo: string;
}

type RawCsvRow = Record<string, string | undefined>;

const DEFAULT_AD_CSV_PATH = path.join(process.cwd(), "data", "ad_users.csv");

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapRowToADUser(row: RawCsvRow): ADUser {
  return {
    nombre: row.nombre?.trim() ?? "",
    email: row.email?.trim().toLowerCase() ?? "",
    grupo: row.grupo?.trim() ?? "",
  };
}

/**
 * Lee usuarios desde un CSV exportado de Active Directory usando streams.
 *
 * Formato esperado de columnas: Nombre, Email, Grupo
 * (se normalizan a minúsculas y sin acentos para tolerar variaciones).
 *
 * Integración sugerida en Korpia:
 * - Iterar este array y hacer upsert en User (por email).
 * - Resolver/crear Group por nombre (grupo) y asignar user.groupId.
 * - Si Korpia usa Auth.js + credenciales, decidir si crear passwords temporales
 *   o sincronizar solo identidades para un proveedor SSO externo.
 */
export async function readADUsersFromCsv(
  csvFilePath: string = DEFAULT_AD_CSV_PATH
): Promise<ADUser[]> {
  const absolutePath = path.isAbsolute(csvFilePath)
    ? csvFilePath
    : path.join(process.cwd(), csvFilePath);

  try {
    await access(absolutePath);
  } catch {
    throw new Error(`No existe el archivo CSV en: ${absolutePath}`);
  }

  return new Promise<ADUser[]>((resolve, reject) => {
    const users: ADUser[] = [];

    createReadStream(absolutePath)
      .on("error", (error) => {
        reject(new Error(`No se pudo leer el CSV: ${error.message}`));
      })
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeHeader(header),
          skipLines: 0,
        })
      )
      .on("data", (row: RawCsvRow) => {
        users.push(mapRowToADUser(row));
      })
      .on("error", (error) => {
        reject(new Error(`Error parseando CSV: ${error.message}`));
      })
      .on("end", () => {
        resolve(users);
      });
  });
}
