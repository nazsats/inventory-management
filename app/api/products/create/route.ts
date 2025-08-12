import { NextResponse } from 'next/server'
import { adminFirestore } from '../../../../lib/firebaseAdmin'
import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAdmin } from '../../../../lib/utils'

// Narrow the verifyAdmin return so we can access uid without `any`
type VerifyAdminSuccess = { uid: string }
type VerifyAdminResult = VerifyAdminSuccess | NextResponse
const isNextResponse = (v: unknown): v is NextResponse => v instanceof NextResponse

const schema = z
  .object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required').trim(),
    nomenclature: z.string().min(1, 'Nomenclature is required').trim(),
    quantity: z.number().min(0, 'Quantity must be non-negative'),
    actualPrice: z.number().min(0, 'Actual price must be non-negative'),
    negotiablePrice: z.number().min(0, 'Negotiable price must be non-negative'),
    sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
    containerId: z.string().min(1, 'Container ID is required'),
    imageUrl: z.string().url().optional(),
    containerQuantity: z.number().min(0, 'Container quantity must be non-negative'),
  })
  .refine((data) => data.sellingPrice <= data.negotiablePrice, {
    message: 'Selling price must not exceed negotiable price',
    path: ['sellingPrice'],
  })

export async function POST(request: Request) {
  try {
    // ensure string | null (not undefined)
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null

    const verifyResult = (await verifyAdmin(token)) as VerifyAdminResult
    if (isNextResponse(verifyResult)) return verifyResult
    const { uid } = verifyResult

    const body = await request.json()
    const data = schema.parse(body)

    // Validate container exists
    const containerDoc = await adminFirestore.collection('containers').doc(data.containerId).get()
    if (!containerDoc.exists) {
      return NextResponse.json({ error: 'Invalid container ID' }, { status: 400 })
    }

    // Ensure SKU is unique
    const existingProduct = await adminFirestore
      .collection('products')
      .where('sku', '==', data.sku)
      .get()
    if (!existingProduct.empty) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }

    const productData = {
      ...data,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      createdBy: uid,
    }

    const docRef = await adminFirestore.collection('products').add(productData)
    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Error in /api/products/create:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
