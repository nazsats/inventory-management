import { NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebaseAdmin';
import { generateContainerCode } from '../../../../lib/utils';
import { z } from 'zod';
import { verifyAdmin } from '../../../../lib/utils';

const schema = z.object({
  supplier: z.string().min(1, 'Supplier name is required').trim(),
  location: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const adminCheck = await verifyAdmin(token);
    if (adminCheck instanceof NextResponse) return adminCheck;

    const body = await request.json();
    const { supplier, location } = schema.parse(body);
    const containerCode = generateContainerCode();

    // Check for duplicate containerCode
    const existingContainer = await adminFirestore
      .collection('containers')
      .where('containerCode', '==', containerCode)
      .get();
    if (!existingContainer.empty) {
      return NextResponse.json({ error: 'Container code already exists' }, { status: 409 });
    }

    const data = {
      supplier,
      containerCode,
      status: 'Created',
      location: location || null,
      arrivalDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminCheck.uid,
    };

    const docRef = await adminFirestore.collection('containers').add(data);
    return NextResponse.json({ id: docRef.id, containerCode }, { status: 201 });
  } catch (error) {
    console.error('Error in /api/containers/create:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message || 'Failed to create container' }, { status: 500 });
  }
}