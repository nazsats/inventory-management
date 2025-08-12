import { NextResponse } from 'next/server'
import { adminFirestore } from '../../../lib/firebaseAdmin'
import { verifyAdmin } from '../../../lib/utils'

// Type for incoming POST body
type ProductInput = {
  name: string
  price: number
  containerId?: string
}

// GET /api/products — list products
export async function GET() {
  try {
    const snapshot = await adminFirestore.collection('products').limit(50).get()
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products — create product (admin-only)
export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const adminCheck = await verifyAdmin(token)
    if (adminCheck instanceof NextResponse) return adminCheck

    const body: ProductInput = await req.json()

    // Minimal runtime validation
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if (typeof body.price !== 'number' || Number.isNaN(body.price)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const created = await adminFirestore.collection('products').add({
      name: body.name.trim(),
      price: body.price,
      containerId: body.containerId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/products:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
