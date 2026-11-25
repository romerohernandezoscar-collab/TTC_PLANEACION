// Fase 2: parseo y validacion de archivos Excel de flujo de caja.
//
// Formato esperado (hoja 1, fila 1 = encabezados; no sensible a mayusculas
// ni a acentos):
//   Fecha | Concepto | Macrocategoria | Cargo | Abono
//
// - Fecha: fecha de Excel o texto parseable (YYYY-MM-DD, DD/MM/YYYY).
// - Concepto: texto libre, obligatorio.
// - Macrocategoria: debe existir ya en el catalogo (tabla macrocategoria);
//   no se crean categorias nuevas automaticamente para mantener control
//   sobre el catalogo (seccion de confidencialidad/trazabilidad del
//   prompt original).
// - Cargo / Abono: numericos, al menos uno distinto de cero por fila.
//
// Cada fila fallida se reporta con su numero de fila y el motivo, sin
// detener el procesamiento de las demas (carga parcial controlada).
import * as XLSX from "xlsx";

const ENCABEZADOS_ESPERADOS = ["fecha", "concepto", "macrocategoria", "cargo", "abono"];

function normalizarEncabezado(txt) {
  return String(txt ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function excelSerialADate(valor) {
  // XLSX con cellDates:true ya entrega objetos Date para celdas de fecha
  // reales; esta funcion cubre el caso de una fecha almacenada como texto.
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;
  if (typeof valor === "number") {
    const parsed = XLSX.SSF.parse_date_code(valor);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  if (typeof valor === "string") {
    const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    const dmy = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
  }
  return null;
}

function aNumero(valor) {
  if (valor === undefined || valor === null || valor === "") return 0;
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * @param {Buffer} buffer contenido del archivo .xlsx subido
 * @param {Set<string>} macrocategoriasValidas nombres normalizados en minusculas
 * @returns {{ filas: Array, errores: Array<{fila:number, motivo:string}>, columnasFaltantes: string[] }}
 */
export function parseMovimientosExcel(buffer, macrocategoriasValidas) {
  const libro = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) {
    return { filas: [], errores: [{ fila: 0, motivo: "El archivo no contiene hojas" }], columnasFaltantes: [] };
  }

  const registros = XLSX.utils.sheet_to_json(hoja, { defval: null, raw: true });
  if (registros.length === 0) {
    return { filas: [], errores: [{ fila: 0, motivo: "La hoja no tiene filas de datos" }], columnasFaltantes: [] };
  }

  // Verificar encabezados contra la primera fila convertida a objeto
  const encabezadosPresentes = Object.keys(registros[0]).map(normalizarEncabezado);
  const columnasFaltantes = ENCABEZADOS_ESPERADOS.filter((col) => !encabezadosPresentes.includes(col));
  if (columnasFaltantes.length > 0) {
    return { filas: [], errores: [], columnasFaltantes };
  }

  // Mapear cada fila a sus columnas normalizadas sin importar el orden
  const mapaClaves = {};
  for (const key of Object.keys(registros[0])) {
    mapaClaves[normalizarEncabezado(key)] = key;
  }

  const filas = [];
  const errores = [];

  registros.forEach((registro, idx) => {
    const numeroFila = idx + 2; // +1 por encabezado, +1 por indice base 0
    const fechaRaw = registro[mapaClaves["fecha"]];
    const concepto = String(registro[mapaClaves["concepto"]] ?? "").trim();
    const macroRaw = String(registro[mapaClaves["macrocategoria"]] ?? "").trim();
    const cargo = aNumero(registro[mapaClaves["cargo"]]);
    const abono = aNumero(registro[mapaClaves["abono"]]);

    const fecha = excelSerialADate(fechaRaw);

    if (!fecha) {
      errores.push({ fila: numeroFila, motivo: "Fecha invalida o vacia" });
      return;
    }
    if (!concepto) {
      errores.push({ fila: numeroFila, motivo: "Concepto vacio" });
      return;
    }
    if (!macroRaw) {
      errores.push({ fila: numeroFila, motivo: "Macrocategoria vacia" });
      return;
    }
    const macroNormalizada = normalizarEncabezado(macroRaw);
    if (!macrocategoriasValidas.has(macroNormalizada)) {
      errores.push({
        fila: numeroFila,
        motivo: `Macrocategoria desconocida: "${macroRaw}" (no existe en el catalogo)`,
      });
      return;
    }
    if (Number.isNaN(cargo) || Number.isNaN(abono)) {
      errores.push({ fila: numeroFila, motivo: "Cargo o abono no es un numero valido" });
      return;
    }
    if (cargo === 0 && abono === 0) {
      errores.push({ fila: numeroFila, motivo: "Cargo y abono son ambos cero" });
      return;
    }

    filas.push({
      fecha: fecha.toISOString().slice(0, 10),
      concepto,
      macrocategoriaNombre: macroRaw,
      macrocategoriaNormalizada: macroNormalizada,
      cargo,
      abono,
    });
  });

  return { filas, errores, columnasFaltantes: [] };
}
