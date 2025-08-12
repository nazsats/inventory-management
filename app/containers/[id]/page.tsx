'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'react-toastify';
import { Container } from '../../../lib/types';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchContainer() {
      try {
        const docRef = doc(db, 'containers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContainer({ id: docSnap.id, ...docSnap.data() } as Container);
        } else {
          toast.error('Container not found');
        }
      } catch (error) {
        console.error('Error fetching container:', error);
        toast.error('Failed to load container');
      } finally {
        setLoading(false);
      }
    }
    fetchContainer();
  }, [id]);

  const handleDelete = async () => {
    if (!user || !id) {
      toast.error('Please log in to delete containers');
      return;
    }

    setDeleting(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch(`/api/containers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      if (response.ok) {
        toast.success('Container deleted successfully');
        router.push('/containers');
      } else {
        toast.error(responseData.error || 'Failed to delete container');
      }
    } catch (error) {
      console.error('Error deleting container:', error);
      toast.error('Failed to delete container');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!container) {
    return <div className="p-6 text-red-600">Container not found</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Container Details</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {container.id}</p>
        <p><strong>Container Code:</strong> {container.containerCode}</p>
        <p><strong>Supplier:</strong> {container.supplier}</p>
        <p><strong>Status:</strong> {container.status}</p>
        <p><strong>Location:</strong> {container.location || 'N/A'}</p>
        <p><strong>Arrival Date:</strong> {container.arrivalDate ? new Date(container.arrivalDate).toLocaleString() : 'N/A'}</p>
        <p><strong>Created At:</strong> {new Date(container.createdAt).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(container.updatedAt).toLocaleString()}</p>
      </div>
      {user?.role === 'admin' && (
        <div className="mt-4 space-x-2">
          <Link href={`/containers/${id}/edit`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
