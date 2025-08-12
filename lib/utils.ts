import { adminAuth, adminFirestore } from './firebaseAdmin';
import { NextResponse } from 'next/server';

export function generateContainerCode(): string {
  const prefix = 'CONT';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

export function generateSKU(): string {
  const prefix = 'KC';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

export async function verifyAdmin(token: string | null) {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminFirestore.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying admin token:', (error as Error).message);
    return NextResponse.json({ error: (error as Error).message || 'Invalid token' }, { status: 401 });
  }
}