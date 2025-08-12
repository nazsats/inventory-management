import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '../../../../lib/firebaseAdmin';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Za-z0-9!@#$%^&*]/, 'Password must include letters, numbers, or special characters'),
  role: z.enum(['admin', 'staff']),
});

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requesterDoc = await adminFirestore.collection('users').doc(decodedToken.uid).get();
    if (!requesterDoc.exists || requesterDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role } = schema.parse(body);

    const existingUser = await adminAuth.listUsers(1000);
    if (existingUser.users.some((u) => u.email === email)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
    });

    await adminFirestore.collection('users').doc(userRecord.uid).set({
      email,
      role,
      createdAt: new Date(),
      createdBy: decodedToken.uid,
    });

    return NextResponse.json({ uid: userRecord.uid, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error in /api/users/add:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message || 'Failed to create user' }, { status: 500 });
  }
}