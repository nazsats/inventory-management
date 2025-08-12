'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { Product } from '../../lib/types'
import LowStockAlert from '../../components/LowStockAlert'
import Link from 'next/link'
import { toast } from 'react-toastify'
import Image from 'next/image'

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'sellingPrice'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  const pageSize = 10
  const lowStockThreshold = 10

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'products'),
        orderBy(search ? 'sku' : 'createdAt', search ? 'asc' : 'desc'),
        limit(pageSize)
      ),
      (snap) => {
        try {
          const newProducts = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as Product[]

          let filtered = newProducts.filter(
            (p) =>
              p.sku.toLowerCase().includes(search.toLowerCase()) ||
              p.name.toLowerCase().includes(search.toLowerCase())
          )

          filtered = filtered.sort((a, b) => {
            const mult = sortOrder === 'asc' ? 1 : -1
            if (sortBy === 'quantity' || sortBy === 'sellingPrice') {
              return mult * (a[sortBy] - b[sortBy])
            }
            return mult * a[sortBy].localeCompare(b[sortBy])
          })

          setProducts(filtered)
          setLastDoc(snap.docs[snap.docs.length - 1] || null)
          setHasMore(snap.docs.length === pageSize)
          setLoading(false)
        } catch (error) {
          console.error('Error processing snapshot:', error)
          toast.error('Failed to load products')
          setLoading(false)
        }
      },
      (error) => {
        console.error('Snapshot error:', error)
        toast.error('Error fetching products')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, authLoading, search, sortBy, sortOrder])

  const loadMore = async () => {
    if (!lastDoc || !user) return
    setLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
      )
      const newProducts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setProducts((prev) => [...prev, ...newProducts])
      setLastDoc(snap.docs[snap.docs.length - 1] || null)
      setHasMore(snap.docs.length === pageSize)
    } catch (error) {
      console.error('Error loading more products:', error)
      toast.error('Failed to load more products')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return <p className="p-6 text-red-600">Please log in.</p>

  const lowStock = products.filter((p) => p.quantity < lowStockThreshold)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by SKU or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'sellingPrice')}
          className="border p-2 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="sellingPrice">Sort by Price</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="border p-2 rounded"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <LowStockAlert lowStock={lowStock} threshold={lowStockThreshold} />

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className={`p-4 border rounded shadow ${
                p.quantity < lowStockThreshold ? 'bg-red-50' : 'bg-white'
              }`}
            >
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  width={128}
                  height={128}
                  className="object-cover rounded mb-2 mx-auto"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded mb-2 mx-auto flex items-center justify-center">
                  No Image
                </div>
              )}
              <p><strong>SKU:</strong> {p.sku}</p>
              <p><strong>Name:</strong> {p.name}</p>
              <p><strong>Quantity:</strong> {p.quantity} / {p.containerQuantity}</p>
              <p><strong>Price:</strong> ₹{p.sellingPrice.toFixed(2)}</p>
              <p><strong>Container:</strong> {p.containerId}</p>
              <p><strong>Stock Status:</strong> {p.quantity < lowStockThreshold ? 'Low' : 'In Stock'}</p>
              <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline mt-2 inline-block">
                View Details
              </Link>

              {/* Use your stored role if it's on the user object */}
              {user?.role === 'admin' && (
                <div className="mt-2">
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <button onClick={loadMore} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Load More
        </button>
      )}
    </div>
  )
}
