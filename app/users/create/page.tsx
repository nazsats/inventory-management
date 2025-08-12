'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { getIdToken } from 'firebase/auth';

export default function CreateUserPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);

  // ✅ destructure from context (it returns { user, loading })
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If your User type has `role`, this check is valid.
  // Otherwise, change it to whatever flag you actually store.
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 text-red-600">
        Access denied. <a href="/login" className="text-blue-600 hover:underline">Log in</a> as admin.
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }
    if (password.length < 8 || !/[A-Za-z0-9!@#$%^&*]/.test(password)) {
      toast.error('Password must be at least 8 characters and include letters, numbers, or special characters');
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('User added successfully!');
        router.push('/products');
      } else {
        toast.error(data.error || 'Failed to add user');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., user@example.com"
            className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g., User123!"
            className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
            className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={loading}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          ) : null}
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}
