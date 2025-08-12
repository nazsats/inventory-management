'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Product } from '../../../lib/types';
import ImageCollage from '../../../components/ImageCollage';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Link from 'next/link';



export default function CollagePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [collageCanvas, setCollageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function fetchProducts() {
      try {
        console.log('Fetching products for collage...');
        const querySnapshot = await getDocs(collection(db, 'products'));
        const fetchedProducts = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
          .filter((p) => p.imageUrl);
        setProducts(fetchedProducts);
        console.log('Products fetched:', fetchedProducts.length);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products for collage');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [user]);

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductIds((prev) => {
      const newIds = prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id];
      console.log('Selected product IDs:', newIds);
      return newIds;
    });
  }, []);

  const handleGenerateCollage = useCallback((canvas: HTMLCanvasElement) => {
    console.log('Collage generated, storing canvas');
    setCollageCanvas(canvas);
    toast.success('Collage generated!');
  }, []);

  const handleDownload = useCallback(() => {
    if (!collageCanvas) {
      toast.error('No collage generated to download');
      return;
    }
    console.log('Downloading collage...');
    const link = document.createElement('a');
    link.download = `product_collage_${Date.now()}.png`;
    link.href = collageCanvas.toDataURL('image/png');
    link.click();
    console.log('Collage downloaded');
  }, [collageCanvas]);

  if (!user) {
    return (
      <div className="p-6 text-red-600">
        Please <Link href="/login?redirect=/products/collage" className="text-blue-600 hover:underline">log in</Link> to create a collage.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Product Collage</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-600">No products with images found. Please add products with images.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={`p-4 border rounded cursor-pointer transition-colors ${
                  selectedProductIds.includes(product.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSelectProduct(product.id)}
              >
                <Image
  src={product.imageUrl as string}   // assert non-null
  alt={product.name}
  width={96}
  height={96}
  className="object-cover rounded mb-2 mx-auto"
  onError={() => toast.error(`Failed to load image for ${product.name}`)}
/>

                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                <p className="text-xs text-gray-600">Price: ₹{product.sellingPrice.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedProductIds.length > 0 && (
        <>
          <ImageCollage
            products={products.filter((p) => selectedProductIds.includes(p.id))}
            onGenerate={handleGenerateCollage}
          />
          {collageCanvas && (
            <div className="mt-4">
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download Collage
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}