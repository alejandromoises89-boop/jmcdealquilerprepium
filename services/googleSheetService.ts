
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
    console.log("[JM-CLOUD] Conectando con Google Sheets...");
    
    // El cache_bust es vital para que no lea datos viejos
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Google Sheets no respondió (Código: ${response.status})`);
    }

    const csvText = await response.text();
    
    // Verificación de acceso público
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('login')) {
      throw new Error("ACCESO DENEGADO: La planilla debe estar en 'Cualquier persona con el enlace puede leer'.");
    }

    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      alert("⚠️ Sincronización exitosa, pero la planilla parece no tener datos de reservas.");
      return [];
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const parsed = dataRows.map((row, index): Reservation | null => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const idx = headers.indexOf(h.toLowerCase());
          if (idx !== -1 && row[idx] !== undefined) return row[idx].replace(/^"(.*)"$/, '$1').trim();
        }
        return '';
      };

      const startStr = getVal(['salida', 'entrega', 'inicio', 'desde', 'fecha_inicio', 'fecha_salida', 'fecha']);
      const endStr = getVal(['retorno', 'devolución', 'regreso', 'fin', 'hasta', 'fecha_fin', 'fecha_retorno']);
      
      if (!startStr) return null;

      const rawMonto = getVal(['total', 'monto', 'brl', 'precio', 'valor', 'monto_total']);
      // Limpieza de caracteres no numéricos (como R$ o puntos de miles)
      const cleanMonto = parseFloat(rawMonto.replace(/[^0-9]/g, '')) || 0;

      return {
        id: getVal(['id', 'reserva_id', 'nro']) || `CLOUD-${Date.now()}-${index}`,
        cliente: getVal(['cliente', 'nombre', 'arrendatario']) || 'Sin Nombre',
        ci: getVal(['ci', 'documento', 'rg']) || 'N/A',
        celular: getVal(['celular', 'whatsapp', 'contacto']) || 'N/A',
        auto: getVal(['auto', 'vehículo', 'unidad']).toLowerCase(),
        inicio: startStr,
        fin: endStr || startStr,
        total: cleanMonto,
        status: 'Confirmed',
        admissionStatus: 'Approved',
        includeInCalendar: true
      };
    }).filter((r): r is Reservation => r !== null);

    console.log(`[JM-CLOUD] Sincronización exitosa: ${parsed.length} reservas.`);
    return parsed;
  } catch (error: any) {
    console.error("[JM-CLOUD] Error crítico:", error.message);
    alert(`❌ ERROR DE NUBE: ${error.message}`);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  try {
    if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('XXXXX')) {
      console.warn("URL de Script no configurada.");
      return false;
    }

    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res),
    });
    return true;
  } catch (error) {
    return false;
  }
};
