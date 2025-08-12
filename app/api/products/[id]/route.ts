import { NextResponse, type NextRequest } from 'next/server'
import { adminFirestore } from '../../../../lib/firebaseAdmin'
import { verifyAdmin } from '../../../../lib/utils'

export async function DELETE(
  request: NextRequest,
  // NOTE: Promise here is key to satisfy Next’s typegen
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const adminCheck = await verifyAdmin(token)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { id } = await params

    const docRef = adminFirestore.collection('products').doc(id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await docRef.delete()
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
