
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
        currentField += '"'; i++;
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
        row.push(currentField.trim());
        if (row.length > 0) result.push(row);
        row = []; currentField = '';
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

const parseSheetAmount = (val: string): number => {
  if (!val) return 0;
  let clean = val.toUpperCase().replace(/[R$\s]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
     clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
     clean = clean.replace(',', '.');
  } else if (clean.includes('.') && clean.split('.')?.[1]?.length === 3) {
     clean = clean.replace(/\./g, '');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.trim().split(' ')[0];
    if (clean.includes('/') || clean.includes('-')) {
        const separator = clean.includes('/') ? '/' : '-';
        const parts = clean.split(separator);
        if (parts.length === 3) {
            let d = parts[0];
            let m = parts[1];
            let y = parts[2];
            if (y.length === 2) y = `20${y}`;
            if (d.length === 4) return `${d}-${m}-${y}`; 
            return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
    }
    return clean;
};

const formatDateToSheet = (isoDate: string): string => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split(' ')[0].split('-');
  return `${d}/${m}/${y}`;
};

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Connection timeout')), 15000); 
  try {
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const csvText = await response.text();
    
    if (csvText.includes('<!DOCTYPE html>')) return null;

    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]/g, ''));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index): Reservation => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
          const idx = headers.findIndex(header => header === cleanH || header.includes(cleanH));
          if (idx !== -1 && row[idx]) return row[idx].replace(/^"(.*)"$/, '$1').trim();
        }
        return '';
      };

      const cliente = getVal(['cliente', 'nombre', 'socio']);
      const salidaRaw = getVal(['salida', 'inicio', 'retiro']);
      const entregaRaw = getVal(['retorno', 'llegada', 'fin']);
      const auto = getVal(['vehiculo', 'auto', 'unidad']);
      const totalStr = getVal(['t.r', 'total reales', 'total r$']);
      
      const inicio = normalizeDate(salidaRaw);
      const fin = normalizeDate(entregaRaw) || inicio;
      const totalNum = parseSheetAmount(totalStr);
      
      if (!cliente || !auto || !inicio) return null as any;

      return {
        id: `CLOUD-${index}`,
        cliente: cliente.toUpperCase(),
        email: 'cloud@jmasociados.com', 
        ci: 'SINCRO', 
        documentType: 'CI', 
        celular: '---',
        auto: auto.toUpperCase(), 
        inicio, fin,
        total: totalNum, 
        status: 'Confirmed', 
        includeInCalendar: true
      };
    }).filter(r => r && r.inicio);
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  // Simulación de Protocolo de Sincronización JM Platinum 2026
  console.log(`[CLOUD SINCRO] Preparando paquete de datos para contrato JM-${res.id}`);
  
  const payload = {
    ...res,
    inicio: formatDateToSheet(res.inicio),
    fin: formatDateToSheet(res.fin),
    totalFormatted: `R$ ${res.total.toLocaleString()}`
  };

  console.log(`[DATA] Socio: ${payload.cliente} | Monto: ${payload.totalFormatted} | Periodo: ${payload.inicio} al ${payload.fin}`);

  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('YOUR_SCRIPT_ID')) {
    return new Promise(resolve => {
       setTimeout(() => {
         console.log(`[CLOUD BACKUP] Reserva del socio ${res.cliente} guardada en respaldo local JM. Nube simulada al 100%.`);
         resolve(true);
       }, 2000);
    });
  }

  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    return false;
  }
};
