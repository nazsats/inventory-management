import { Product } from '../lib/types';
import Link from 'next/link';

interface LowStockAlertProps {
  lowStock: Product[];
  threshold: number;
}

export default function LowStockAlert({ lowStock, threshold }: LowStockAlertProps) {
  if (lowStock.length === 0) return null;

  return (
    <div className="bg-red-100 text-red-800 p-4 rounded mb-4 shadow">
      <strong className="font-semibold">Low Stock Alert:</strong> {lowStock.length} item(s) below {threshold} units!
      <ul className="list-disc ml-6 mt-2">
        {lowStock.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline">
              {p.name} (SKU: {p.sku}) - {p.quantity} units
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
