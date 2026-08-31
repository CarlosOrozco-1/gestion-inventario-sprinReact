// Determina el estado visual del stock de una presentación.
// - bajo:  stock < minStock   -> rojo
// - optimo: stock >= minStock  -> verde
export interface StockInfo {
  label: string;
  badgeClass: string;
  textClass: string;
}

export function getStockInfo(stock: number, minStock?: number): StockInfo {
  const min = typeof minStock === 'number' ? minStock : 0;
  if (stock < min) {
    return {
      label: 'Stock Bajo',
      badgeClass: 'bg-red-100 text-red-700 border-red-200',
      textClass: 'text-red-600',
    };
  }
  return {
    label: 'Stock Óptimo',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    textClass: 'text-green-600',
  };
}
