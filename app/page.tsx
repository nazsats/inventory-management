'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Product, Container } from '../lib/types';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const lowStockThreshold = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching products and containers...');
        const productQuery = query(collection(db, 'products'), limit(50));
        const productSnapshot = await getDocs(productQuery);
        const fetchedProducts = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Product));
        setProducts(fetchedProducts);
        console.log('Products fetched:', fetchedProducts.length);

        const containerQuery = query(collection(db, 'containers'), limit(50));
        const containerSnapshot = await getDocs(containerQuery);
        const fetchedContainers = containerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Container));
        setContainers(fetchedContainers);
        console.log('Containers fetched:', fetchedContainers.length);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const pieData = useMemo(() => ({
    labels: containers.map((c) => c.containerCode || `Container ${c.id}`),
    datasets: [
      {
        label: 'Products per Container',
        data: containers.map(
          (c) => products.filter((p) => p.containerId === c.id).length
        ),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }), [containers, products]);

  const barData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Products Added',
        data: Array(12).fill(0).map((_, i) => {
          const month = i + 1;
          return products.filter((p) => {
            const createdAt = p.createdAt ? new Date(p.createdAt) : null;
            return createdAt && createdAt.getMonth() + 1 === month;
          }).length;
        }),
        backgroundColor: '#3B82F6',
        borderColor: '#1E40AF',
        borderWidth: 1,
      },
    ],
  }), [products]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#1F2937',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
  };

  const lowStockCount = products.filter((p) => p.quantity < lowStockThreshold).length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);

  if (!user) {
    return (
      <div className="p-6 text-red-600 text-center">
        Please <Link href="/login?redirect=/" className="text-blue-600 hover:underline">log in</Link> to view the dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Product Distribution by Container
          </h2>
          <div className="h-80">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Products Added Per Month
          </h2>
          <div className="h-80">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-blue-800">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-green-800">Total Containers</p>
              <p className="text-2xl font-bold text-green-600">{containers.length}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-yellow-800">Avg. Product Price</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₹
                {products.length
                  ? (
                      products.reduce((sum, p) => sum + p.sellingPrice, 0) /
                      products.length
                    ).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="bg-pink-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-pink-800">Products with Images</p>
              <p className="text-2xl font-bold text-pink-600">
                {products.filter((p) => p.imageUrl).length}
              </p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-red-800">Low Stock Products</p>
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium text-purple-800">Total Stock Quantity</p>
              <p className="text-2xl font-bold text-purple-600">{totalStock}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/products/collage"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create a Product Collage
        </Link>
        <Link
          href="/products/create"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors ml-4"
        >
          Add New Product
        </Link>
      </div>
    </div>
  );
}