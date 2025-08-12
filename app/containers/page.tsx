'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, startAfter, onSnapshot, QueryDocumentSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Container } from '../../lib/types';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function ContainersPage() {
  const user = useAuth();
  const [containers, setContainers] = useState<Container[]>([]);
  const [search, setSearch] = useState('');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'containers'),
        orderBy(search ? 'containerCode' : 'createdAt', search ? 'asc' : 'desc'),
        limit(pageSize)
      ),
      (snap) => {
        try {
          const newContainers = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            arrivalDate: doc.data().arrivalDate?.toDate() || null,
          })) as Container[];

          setContainers(
            newContainers.filter(
              (c) =>
                c.containerCode.toLowerCase().includes(search.toLowerCase()) ||
                c.supplier.toLowerCase().includes(search.toLowerCase())
            )
          );
          setLastDoc(snap.docs[snap.docs.length - 1] || null);
          setHasMore(snap.docs.length === pageSize);
          setLoading(false);
        } catch (error) {
          console.error('Error processing snapshot:', error);
          toast.error('Failed to load containers');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Snapshot error:', error);
        toast.error('Error fetching containers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, search]);

  const loadMore = async () => {
    if (!lastDoc || !user) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'containers'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        )
      );
      const newContainers = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        arrivalDate: doc.data().arrivalDate?.toDate() || null,
      })) as Container[];
      setContainers([...containers, ...newContainers]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === pageSize);
    } catch (error) {
      console.error('Error loading more containers:', error);
      toast.error('Failed to load more containers');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="p-6 text-red-600">Please log in.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Containers</h1>
      <input
        type="text"
        placeholder="Search by code or supplier"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : containers.length === 0 ? (
        <p className="text-gray-600">No containers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Code</th>
                <th className="border px-4 py-2">Supplier</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Arrival Date</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.id}>
                  <td className="border px-4 py-2">{c.containerCode}</td>
                  <td className="border px-4 py-2">{c.supplier}</td>
                  <td className="border px-4 py-2">{c.status}</td>
                  <td className="border px-4 py-2">
                    {c.arrivalDate ? c.arrivalDate.toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="border px-4 py-2">
                    <Link href={`/containers/${c.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Load More
        </button>
      )}
    </div>
  );
}