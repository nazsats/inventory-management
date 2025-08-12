'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Checking auth state...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      let userData: User | null = null;
      try {
        if (firebaseUser) {
          console.log('Firebase user found:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
            console.log('User document loaded:', userDoc.data());
          } else {
            console.warn('User document not found in Firestore for UID:', firebaseUser.uid);
          }
        } else {
          console.log('No Firebase user');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setUser(userData);
        setLoading(false);
        console.log('Auth loading complete, user:', userData);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}