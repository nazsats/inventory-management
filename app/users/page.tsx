'use client';

import { useEffect, useState } from 'react';
import {
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../lib/types';
import { toast } from 'react-toastify';
import { auth } from '../../lib/firebase';
import { getIdToken } from 'firebase/auth';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth(); // ✅ destructure
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('email'), limit(pageSize)),
      (snap) => {
        const newUsers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
        setUsers(
          newUsers.filter(
            (u) =>
              (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
              (u.role ?? '').toLowerCase().includes(search.toLowerCase())
          )
        );
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === pageSize);
      },
      (error) => {
        console.error('Snapshot error:', error);
        toast.error('Error fetching users');
      }
    );
    return () => unsubscribe();
  }, [user, authLoading, search]);

  const loadMore = async () => {
    if (!lastDoc) return;
    const snap = await getDocs(
      query(collection(db, 'users'), orderBy('email'), startAfter(lastDoc), limit(pageSize))
    );
    const newUsers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
    setUsers((prev) => [...prev, ...newUsers]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.docs.length === pageSize);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      if (response.ok) {
        toast.success('User deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ check role on the loaded user object
  if (!user || user.role !== 'admin') return <p className="p-6 text-red-600">Access denied.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <input
        type="text"
        placeholder="Search by email or role"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border px-4 py-2">{u.email}</td>
                <td className="border px-4 py-2">{u.role ?? '—'}</td>
                <td className="border px-4 py-2">
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
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
