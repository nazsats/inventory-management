'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUpload from '../../../components/ImageUpload';
import ExcelUpload from '../../../components/ExcelUpload';
import { toast } from 'react-toastify';
import { getIdToken } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required').trim(),
  nomenclature: z.string().min(1, 'Nomenclature is required').trim(),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  actualPrice: z.number().min(0, 'Actual price must be non-negative'),
  negotiablePrice: z.number().min(0, 'Negotiable price must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  containerId: z.string().min(1, 'Container ID is required'),
  imageUrl: z.string().url().optional(),
  containerQuantity: z.number().min(0, 'Container quantity must be non-negative'),
}).refine((data) => data.sellingPrice <= data.negotiablePrice, {
  message: 'Selling price must not exceed negotiable price',
  path: ['sellingPrice'],
});

type FormData = z.infer<typeof schema>;

export default function CreateProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'manual' | 'excel'>('manual');
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: '',
      name: '',
      nomenclature: '',
      quantity: 0,
      actualPrice: 0,
      negotiablePrice: 0,
      sellingPrice: 0,
      containerId: '',
      imageUrl: '',
      containerQuantity: 0,
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/products/create');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (response.ok) {
        toast.success('Product created successfully!');
        router.push('/products');
      } else {
        toast.error(responseData.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleExcelUpload = () => {
    router.push('/products');
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      <div className="mb-4">
        <button
          onClick={() => setMode('manual')}
          className={`mr-2 px-4 py-2 rounded ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setMode('excel')}
          className={`px-4 py-2 rounded ${mode === 'excel' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Excel Upload
        </button>
      </div>
      {mode === 'manual' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input
              {...register('sku')}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.sku && <p className="text-red-600">{errors.sku.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              {...register('name')}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.name && <p className="text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Nomenclature</label>
            <input
              {...register('nomenclature')}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.nomenclature && <p className="text-red-600">{errors.nomenclature.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.quantity && <p className="text-red-600">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Container Quantity</label>
            <input
              type="number"
              {...register('containerQuantity', { valueAsNumber: true })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.containerQuantity && <p className="text-red-600">{errors.containerQuantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Actual Price</label>
            <input
              type="number"
              step="0.01"
              {...register('actualPrice', { valueAsNumber: true })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.actualPrice && <p className="text-red-600">{errors.actualPrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Negotiable Price</label>
            <input
              type="number"
              step="0.01"
              {...register('negotiablePrice', { valueAsNumber: true })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.negotiablePrice && <p className="text-red-600">{errors.negotiablePrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Selling Price</label>
            <input
              type="number"
              step="0.01"
              {...register('sellingPrice', { valueAsNumber: true })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.sellingPrice && <p className="text-red-600">{errors.sellingPrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Container ID</label>
            <input
              {...register('containerId')}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.containerId && <p className="text-red-600">{errors.containerId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Product Image</label>
            <ImageUpload onUpload={(url) => setValue('imageUrl', url)} />
            {errors.imageUrl && <p className="text-red-600">{errors.imageUrl.message}</p>}
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Product
          </button>
        </form>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-2">Upload Excel File</h2>
          <ExcelUpload onUpload={handleExcelUpload} />
        </div>
      )}
    </div>
  );
}
