import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { rawSalesData } from '@/data/sales-data';

export interface SalesRecord {
  orderNumber: string;
  product: string;
  price: number;
  date: string;
  paymentMethod: string;
}

function normalizeRow(row: any): SalesRecord {
  let price = 0;
  if (typeof row['Price'] === 'number') {
    price = row['Price'];
  } else if (typeof row['Price'] === 'string') {
    price = parseFloat(row['Price'].replace(/[^0-9.-]+/g, ''));
  }

  // Handle Excel date numbers if necessary, or assume string
  let date = row['Date'];
  if (typeof date === 'number') {
    // If parsed as raw number, we might need to format it, but with raw: false, it's usually a string.
    date = String(date);
  }

  return {
    orderNumber: String(row['Order Number'] || ''),
    product: String(row['Product'] || ''),
    price: price || 0,
    date: String(date || ''),
    paymentMethod: String(row['Payment Method'] || ''),
  };
}

export function getSalesData(): SalesRecord[] {
  const parsed = Papa.parse(rawSalesData, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map(normalizeRow);
}

export async function parseUploadedFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
          });
          resolve(parsed.data.map(normalizeRow));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // raw: false ensures dates and formatted numbers are read as strings
          const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          resolve(json.map(normalizeRow));
        } else {
          reject(new Error('Unsupported file format. Please upload a .csv or .xlsx file.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}
