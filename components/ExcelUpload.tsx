'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getIdToken } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Container, Product } from '../lib/types';
import * as XLSX from 'xlsx';

interface ExcelUploadProps {
  onUpload: (data: Partial<Product>[]) => void;
}

export default function ExcelUpload({ onUpload }: ExcelUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [containerId, setContainerId] = useState('');
  const [containers, setContainers] = useState<Container[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchContainers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'containers'));
        const fetchedContainers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Container));
        setContainers(fetchedContainers);
      } catch (error) {
        console.error('Error fetching containers:', error);
        toast.error('Failed to load containers');
      }
    }
    fetchContainers();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !containerId) {
      toast.error('Please select a container and log in');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      toast.error('Please select an Excel file');
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
// Tell XLSX what each row looks like
type ExcelRow = { [key: string]: string | number };

const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

const products = jsonData.map((row) => ({
  sku: row['货号']?.toString() || '',
  imageUrl: row['产品图片']?.toString() || undefined,
  quantity: Number(row['件数']) || 0,
  containerQuantity: Number(row['装箱数']) || 0,
  sellingPrice: Number(row['单价']) || 0,
  containerId,
}));


          if (products.length === 0) {
            toast.error('No valid data found in the Excel file');
            return;
          }

          for (const product of products) {
            if (!product.sku) {
              toast.error('Missing SKU in one or more rows');
              return;
            }
            if (product.quantity < 0 || product.containerQuantity < 0 || product.sellingPrice < 0) {
              toast.error('Invalid numeric values in one or more rows');
              return;
            }
            if (product.imageUrl && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(product.imageUrl)) {
              toast.error(`Invalid image URL in row with SKU: ${product.sku}`);
              return;
            }
          }

          console.log('Sending products to API:', products);

          const token = await getIdToken(auth.currentUser!);
          const response = await fetch('/api/products/bulk-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ products }),
          });

          const responseData = await response.json();
          console.log('API response:', responseData);

          if (response.ok) {
            toast.success(`Successfully created ${responseData.createdCount} products`);
            onUpload(products);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            toast.error(responseData.error || 'Failed to create products');
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          toast.error('Failed to process Excel file');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error('Failed to read Excel file');
      setUploading(false);
    }
  };

  if (!user) {
    return <p className="text-red-600">Please log in to upload Excel files.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Select Container</label>
        <select
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={uploading}
        >
          <option value="">Select a container</option>
          {containers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.containerCode} ({c.supplier})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Upload Excel File</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploading || !containerId}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {uploading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}