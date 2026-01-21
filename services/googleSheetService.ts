
import { Reservation } from '../types';
import { GOOGLE_SHEET_RESERVATIONS_URL, GOOGLE_SHEET_WEBAPP_URL } from '../constants';

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
    console.log("%c[JM-SYSTEM] Extrayendo datos de logística desde Google Sheets...", "color: #800000; font-weight: bold;");
    
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&t=${Date.now()}`);
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) return null;

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

      // Mapeo específico para Salida (Inicio) y Retorno (Fin)
      const startStr = getVal(['salida', 'entrega', 'inicio', 'desde', 'fecha_inicio', 'fecha_salida', 'fecha']);
      const endStr = getVal(['retorno', 'devolución', 'devuelta', 'regreso', 'fin', 'hasta', 'fecha_fin', 'fecha_retorno']);
      
      if (!startStr) return null;

      // Normalizar el nombre del auto para facilitar el matching
      const autoName = getVal(['auto', 'vehículo', 'unidad', 'carro']).toLowerCase();

      return {
        id: getVal(['id', 'reserva_id', 'nro', 'número']) || `sheet-${index}-${Date.now()}`,
        cliente: getVal(['cliente', 'nombre', 'arrendatario']) || 'Cliente Externo',
        ci: getVal(['ci', 'documento', 'rg', 'cpf']) || 'N/A',
        celular: getVal(['celular', 'whatsapp', 'tel', 'contacto']) || 'N/A',
        auto: autoName || 'Desconocido',
        inicio: startStr,
        fin: endStr || startStr,
        total: parseFloat(getVal(['total', 'monto', 'brl', 'precio', 'valor']).replace(/[^0-9.]/g, '')) || 0,
        status: 'Confirmed',
        includeInCalendar: true
      };
    }).filter((r): r is Reservation => r !== null);

    return parsed;
  } catch (error) {
    console.error("[JM-SYSTEM] Error en sincronización de logística:", error);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  try {
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res),
    });
    console.log(`%c[JM-SYSTEM] Backup en la nube completado: ${res.id}`, "color: #008000; font-weight: bold;");
    return true;
  } catch (error) {
    console.error("[JM-SYSTEM] Error al guardar backup:", error);
    return false;
  }
};
