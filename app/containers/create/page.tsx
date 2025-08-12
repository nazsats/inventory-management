'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import QRCodeDisplay from '../../../components/QRCodeDisplay';
import { toast } from 'react-toastify';
import { auth } from '../../../lib/firebase';
import { getIdToken } from 'firebase/auth';

export default function CreateContainerPage() {
  const [supplier, setSupplier] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-red-600">
        You must <a href="/login" className="text-blue-600 hover:underline">log in</a> to add containers.
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch('/api/containers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supplier: supplier.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setCode(data.containerCode);
        toast.success('Container created successfully!');
      } else {
        toast.error(data.error || 'Failed to create container');
      }
    } catch (error) {
      console.error('Client error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add Container</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., Supplier A"
            className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Generate & Save'}
        </button>
      </form>
      {code && <QRCodeDisplay value={code} />}
    </div>
  );
}