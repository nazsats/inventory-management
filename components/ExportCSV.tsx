'use client';

     import { Product } from '../lib/types';

     interface ExportCSVProps {
       products: Product[];
     }

     export default function ExportCSV({ products }: ExportCSVProps) {
       const handleExport = () => {
         const headers = ['SKU,Name,Nomenclature,Quantity,Actual Price,Negotiable Price,Selling Price,Container ID'];
         const rows = products.map((p) =>
           `${p.sku},${p.name},${p.nomenclature},${p.quantity},${p.actualPrice},${p.negotiablePrice},${p.sellingPrice},${p.containerId}`
         );
         const csv = [...headers, ...rows].join('\n');
         const blob = new Blob([csv], { type: 'text/csv' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `products_${Date.now()}.csv`;
         a.click();
         URL.revokeObjectURL(url);
       };

       return (
         <button
           onClick={handleExport}
           className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
         >
           Export to CSV
         </button>
       );
     }