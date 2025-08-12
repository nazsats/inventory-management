'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export default function ImageUpload({ onUpload }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }
    if (!file) {
      toast.error('Please select an image');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (e.g., JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds 5MB limit');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/cloudinary-sign?folder=products');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get Cloudinary signature: ${errorData.error}`);
      }
      const { signature, timestamp } = await response.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('folder', 'products');

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await uploadResponse.json();
      onUpload(data.secure_url);
      setPreview(data.secure_url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error((error as Error).message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        disabled={uploading}
        className="border p-2 w-full rounded"
      />
      {uploading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      {preview && (
        <Image
          src={preview}
          alt="Preview"
          width={128}
          height={128}
          className="object-cover rounded"
        />
      )}
    </div>
  );
}