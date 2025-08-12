import { NextResponse, type NextRequest } from 'next/server'
import { adminFirestore } from '../../../../lib/firebaseAdmin'
import { verifyAdmin } from '../../../../lib/utils'

export async function DELETE(
  request: NextRequest,
  // NOTE: Next’s generated types want a Promise for params
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const adminCheck = await verifyAdmin(token)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { id } = await params

    // Validate container ID
    const containerDoc = await adminFirestore.collection('containers').doc(id).get()
    if (!containerDoc.exists) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Check for associated products
    const productsSnapshot = await adminFirestore
      .collection('products')
      .where('containerId', '==', id)
      .limit(1)
      .get()

    if (!productsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete container with associated products' },
        { status: 400 }
      )
    }

    await adminFirestore.collection('containers').doc(id).delete()

    return NextResponse.json({ message: 'Container deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/containers/[id]:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete container' },
      { status: 500 }
    )
  }
}
