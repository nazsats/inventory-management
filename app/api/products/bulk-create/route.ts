import { NextResponse } from 'next/server'
import { adminFirestore } from '../../../../lib/firebaseAdmin'
import { z } from 'zod'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { verifyAdmin } from '../../../../lib/utils'

type VerifyAdminSuccess = { uid: string }
type VerifyAdminResult = VerifyAdminSuccess | NextResponse
const isNextResponse = (v: unknown): v is NextResponse => v instanceof NextResponse

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  imageUrl: z.string().url().optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  containerQuantity: z.number().min(0, 'Container quantity must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  containerId: z.string().min(1, 'Container ID is required'),
})

const bulkCreateSchema = z.object({
  products: z.array(productSchema).min(1, 'At least one product is required'),
})

async function generateProductName(firestore: Firestore) {
  let name: string | undefined
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    name = `${randomNum}-3`
    const existing = await firestore.collection('products').where('name', '==', name).get()
    if (existing.empty) return name
    attempts++
  }
  throw new Error('Unable to generate unique product name after multiple attempts')
}

type CreatedProduct = {
  id: string
  sku: string
  name: string
  nomenclature: string
  quantity: number
  actualPrice: number
  negotiablePrice: number
  sellingPrice: number
  containerId: string
  imageUrl: string | null
  containerQuantity: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string | null
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
    const verifyResult = (await verifyAdmin(token)) as VerifyAdminResult
    if (isNextResponse(verifyResult)) return verifyResult
    const { uid } = verifyResult

    const body = await request.json()
    const { products } = bulkCreateSchema.parse(body)

    // ...rest of your logic unchanged...


    // Validate container IDs exist
    const containerIds = [...new Set(products.map((p) => p.containerId))]
    for (const containerId of containerIds) {
      const containerDoc = await adminFirestore.collection('containers').doc(containerId).get()
      if (!containerDoc.exists) {
        return NextResponse.json({ error: `Invalid container ID: ${containerId}` }, { status: 400 })
      }
    }

    // Check for duplicate SKUs already present
    const skus = products.map((p) => p.sku)
    const existingProducts = await adminFirestore.collection('products').where('sku', 'in', skus).get()
    if (!existingProducts.empty) {
      const existingSkus = existingProducts.docs.map((doc) => doc.data().sku as string)
      return NextResponse.json(
        { error: `Duplicate SKUs found: ${existingSkus.join(', ')}` },
        { status: 409 }
      )
    }

    const batch = adminFirestore.batch()
    const createdProducts: CreatedProduct[] = []

    for (const product of products) {
      const docRef = adminFirestore.collection('products').doc()
      const name = await generateProductName(adminFirestore as unknown as Firestore)

      const productData: Omit<CreatedProduct, 'id'> = {
        sku: product.sku,
        name,
        nomenclature: product.sku,
        quantity: product.quantity,
        actualPrice: product.sellingPrice,
        negotiablePrice: product.sellingPrice * 1.2,
        sellingPrice: product.sellingPrice,
        containerId: product.containerId,
        imageUrl: product.imageUrl || null,
        containerQuantity: product.containerQuantity,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        createdBy: uid,
      }

      batch.set(docRef, productData)
      createdProducts.push({ id: docRef.id, ...productData })
    }

    await batch.commit()
    return NextResponse.json(
      { createdCount: createdProducts.length, products: createdProducts },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in /api/products/bulk-create:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create products' },
      { status: 500 }
    )
  }
}
