'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { toast } from 'react-toastify'
import { Product, Container } from '../../../lib/types'
import { useAuth } from '../../../context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string

  // ✅ destructure the auth context
  const { user, loading: authLoading } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [container, setContainer] = useState<Container | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchProduct() {
      try {
        const docRef = doc(db, 'products', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product
          setProduct(productData)

          const containerRef = doc(db, 'containers', productData.containerId)
          const containerSnap = await getDoc(containerRef)
          if (containerSnap.exists()) {
            setContainer({ id: containerSnap.id, ...containerSnap.data() } as Container)
          }
        } else {
          toast.error('Product not found')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, authLoading])

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return <div className="p-6 text-red-600">Product not found</div>
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Product Details</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {product.id}</p>
        <p><strong>SKU:</strong> {product.sku}</p>
        <p><strong>Name:</strong> {product.name}</p>
        <p><strong>Nomenclature:</strong> {product.nomenclature}</p>
        <p><strong>Quantity:</strong> {product.quantity}</p>
        <p><strong>Actual Price:</strong> ₹{product.actualPrice.toFixed(2)}</p>
        <p><strong>Negotiable Price:</strong> ₹{product.negotiablePrice.toFixed(2)}</p>
        <p><strong>Selling Price:</strong> ₹{product.sellingPrice.toFixed(2)}</p>
        <p>
          <strong>Container:</strong>{' '}
          {container ? `${container.containerCode} (${container.supplier})` : product.containerId}
        </p>
        {product.imageUrl && (
          <div>
            <strong>Image:</strong>
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={128}
              height={128}
              className="object-cover mt-2 rounded"
            />
          </div>
        )}
        <p><strong>Created At:</strong> {new Date(product.createdAt).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleString()}</p>
      </div>

      {/* If your User type has `role`, this works fine now */}
      {user?.role === 'admin' && (
        <div className="mt-4 space-x-2">
          <Link href={`/products/${id}/edit`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Edit
          </Link>
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
