'use client';

import { useRef, useCallback } from 'react';
import { Product } from '../lib/types';
import { toast } from 'react-toastify';

interface ImageCollageProps {
  products: Product[];
  layout?: 'grid' | 'masonry' | 'circular';
  onGenerate: (canvas: HTMLCanvasElement) => void;
}

export default function ImageCollage({ products, layout = 'grid', onGenerate }: ImageCollageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCollage = useCallback(() => {
    console.log('Generating collage with products:', products.map((p) => p.id));
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      toast.error('Failed to generate collage: Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      toast.error('Failed to generate collage: Canvas context not found');
      return;
    }

    const imgSize = 200;
    const padding = 20;
    const textHeight = 60;

    // Calculate layout
    let cols = Math.ceil(Math.sqrt(products.length));
    let rows = Math.ceil(products.length / cols);
    if (layout === 'masonry') {
      cols = 3;
      rows = Math.ceil(products.length / cols);
    } else if (layout === 'circular') {
      cols = 1;
      rows = products.length;
    }

    canvas.width = cols * (imgSize + padding) + padding;
    canvas.height = rows * (imgSize + textHeight + padding) + padding;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let imagesLoaded = 0;
    if (products.length === 0) {
      console.log('No products, generating empty canvas');
      onGenerate(canvas);
      return;
    }

    products.forEach((product, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = product.imageUrl!;
      img.onerror = () => {
        console.error(`Failed to load image for ${product.name}`);
        toast.error(`Failed to load image for ${product.name}`);
        imagesLoaded++;
        if (imagesLoaded === products.length) {
          console.log('All images processed, calling onGenerate');
          onGenerate(canvas);
        }
      };
      img.onload = () => {
        let x, y;
        if (layout === 'grid') {
          const col = index % cols;
          const row = Math.floor(index / cols);
          x = col * (imgSize + padding) + padding;
          y = row * (imgSize + textHeight + padding) + padding;
        } else if (layout === 'masonry') {
          const col = index % cols;
          const row = Math.floor(index / cols);
          x = col * (imgSize + padding) + padding;
          y = row * (imgSize + textHeight + padding) + padding;
        } else {
          x = padding;
          y = index * (imgSize + textHeight + padding) + padding;
        }

        ctx.drawImage(img, x, y, imgSize, imgSize);
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText(product.name, x, y + imgSize + 20);
        ctx.fillText(`₹${product.sellingPrice.toFixed(2)}`, x, y + imgSize + 40);

        imagesLoaded++;
        if (imagesLoaded === products.length) {
          console.log('All images processed, calling onGenerate');
          onGenerate(canvas);
        }
      };
    });
  }, [products, layout, onGenerate]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Collage Preview</h2>
      <canvas ref={canvasRef} className="border rounded shadow" />
      <div className="mt-2">
        <label className="mr-2">Layout:</label>
        <select
          value={layout}
          onChange={(e) => e.target.value as 'grid' | 'masonry' | 'circular'}
          className="border p-2 rounded"
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
          <option value="circular">Circular</option>
        </select>
        <button
          onClick={() => {
            console.log('Generate Collage button clicked');
            generateCollage();
          }}
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate Collage
        </button>
      </div>
    </div>
  );
}