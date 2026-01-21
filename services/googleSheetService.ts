
import { Reservation } from '../types';
import { GOOGLE_SHEET_RESERVATIONS_URL } from '../constants';

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (currentField || row.length > 0) {
          row.push(currentField.trim());
          result.push(row);
        }
        row = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField || row.length > 0) {
    row.push(currentField.trim());
    result.push(row);
  }

  return result;
};

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  try {
    console.log("[JM-SYSTEM] Iniciando extracción desde Google Sheets (Pestaña Reservas)...");
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      console.warn("[JM-SYSTEM] No se encontraron datos en la planilla.");
      return null;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const parsed = dataRows.map((row, index): Reservation | null => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const idx = headers.indexOf(h.toLowerCase());
          if (idx !== -1 && row[idx] !== undefined) return row[idx].replace(/^"(.*)"$/, '$1');
        }
        return '';
      };

      const startStr = getVal(['entrega', 'inicio', 'desde', 'fecha_inicio', 'fecha']);
      const endStr = getVal(['devolución', 'devuelta', 'fin', 'hasta', 'fecha_fin', 'fecha retorno']);
      
      if (!startStr) return null;

      // Intentar limpiar nombres de autos (Ej: "Tucson" de "Hyundai Tucson Blanco")
      let rawAuto = getVal(['auto', 'vehiculo', 'unidad']).toLowerCase();

      return {
        id: getVal(['id', 'reserva_id', 'nro', 'numero']) || `sheet-${index}`,
        cliente: getVal(['cliente', 'nombre', 'arrendatario']) || 'Cliente Externo',
        ci: getVal(['ci', 'documento', 'rg', 'cpf']) || 'N/A',
        celular: getVal(['celular', 'whatsapp', 'tel', 'contacto']) || 'N/A',
        auto: rawAuto || 'Desconocido',
        inicio: startStr,
        fin: endStr || startStr,
        total: parseFloat(getVal(['total', 'monto', 'brl', 'precio']).replace(/[^0-9.]/g, '')) || 0,
        status: 'Confirmed'
      };
    }).filter((r): r is Reservation => r !== null);

    console.log(`[JM-SYSTEM] Sincronización exitosa: ${parsed.length} registros cargados.`);
    return parsed;
  } catch (error) {
    console.error("[JM-SYSTEM] Error crítico en sincronización:", error);
    return null;
  }
};
