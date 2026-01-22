
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
    console.log("[JM-SYSTEM] Solicitando datos a la nube...");
    
    // El timestamp t= evita que el navegador use datos viejos guardados
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Error de conexión con Google (Status: ${response.status})`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      console.warn("[JM-SYSTEM] La planilla parece estar vacía.");
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
      const endStr = getVal(['retorno', 'devolución', 'devuelta', 'regreso', 'fin', 'hasta', 'fecha_fin', 'fecha_retorno']);
      
      if (!startStr) return null;

      // Normalización de monto: quita letras y símbolos para dejar solo el número
      const rawMonto = getVal(['total', 'monto', 'brl', 'precio', 'valor']);
      const cleanMonto = parseFloat(rawMonto.replace(/[^0-9.]/g, '')) || 0;

      return {
        id: getVal(['id', 'reserva_id', 'nro', 'número']) || `CLOUD-${Date.now()}-${index}`,
        cliente: getVal(['cliente', 'nombre', 'arrendatario']) || 'Sin Nombre',
        ci: getVal(['ci', 'documento', 'rg', 'cpf']) || 'N/A',
        celular: getVal(['celular', 'whatsapp', 'tel', 'contacto']) || 'N/A',
        auto: getVal(['auto', 'vehículo', 'unidad', 'carro']).toLowerCase(),
        inicio: startStr,
        fin: endStr || startStr,
        total: cleanMonto,
        status: 'Confirmed',
        admissionStatus: 'Approved',
        includeInCalendar: true
      };
    }).filter((r): r is Reservation => r !== null);

    return parsed;
  } catch (error: any) {
    console.error("[JM-SYSTEM] Fallo al leer de la nube:", error);
    alert("⚠️ Error de Sincronización: Asegúrate de que la planilla sea PÚBLICA (Cualquiera con el enlace puede leer) y que la pestaña se llame 'Reservas'.");
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  try {
    if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('XXXXX')) {
      console.warn("[JM-SYSTEM] Script URL no configurado. El guardado no se enviará a la nube.");
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
    console.error("[JM-SYSTEM] Error al guardar en nube:", error);
    return false;
  }
};
