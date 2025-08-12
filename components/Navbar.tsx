'use client';

     import { useState } from 'react';
     import Link from 'next/link';
     import { useAuth } from '../context/AuthContext';
     import { signOut } from 'firebase/auth';
     import { auth } from '../lib/firebase';
     import { useRouter, usePathname } from 'next/navigation';

     export default function Navbar() {
       const { user } = useAuth();
       const router = useRouter();
       const pathname = usePathname();
       const [isOpen, setIsOpen] = useState(false);

       const handleLogout = async () => {
         try {
           await signOut(auth);
           router.push('/login');
         } catch (error) {
           console.error('Logout error:', error);
         }
       };

       const navItems = [
         { href: '/', label: 'Home' },
         { href: '/containers', label: 'Containers' },
         { href: '/containers/create', label: 'Add Container' },
         { href: '/products', label: 'Products' },
         { href: '/products/create', label: 'Add Product' },
         { href: '/products/collage', label: 'Create Collage' },
         ...(user?.role === 'admin' ? [{ href: '/users/create', label: 'Add User' }] : []),
       ];

       return (
         <nav className="bg-gray-800 text-white p-4">
           <div className="flex justify-between items-center">
             <div className="text-lg font-bold">Inventory</div>
             <button
               className="md:hidden"
               onClick={() => setIsOpen(!isOpen)}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
               </svg>
             </button>
             <div className="hidden md:flex space-x-4">
               {navItems.map((item) => (
                 <Link
                   key={item.href}
                   href={item.href}
                   className={`hover:underline ${pathname === item.href ? 'font-bold' : ''}`}
                 >
                   {item.label}
                 </Link>
               ))}
               {user ? (
                 <button onClick={handleLogout} className="hover:underline">Logout</button>
               ) : (
                 <Link href="/login" className="hover:underline">Login</Link>
               )}
             </div>
           </div>
           {isOpen && (
             <div className="md:hidden mt-4 space-y-2">
               {navItems.map((item) => (
                 <Link
                   key={item.href}
                   href={item.href}
                   className={`block hover:underline ${pathname === item.href ? 'font-bold' : ''}`}
                   onClick={() => setIsOpen(false)}
                 >
                   {item.label}
                 </Link>
               ))}
               {user ? (
                 <button onClick={handleLogout} className="block hover:underline">Logout</button>
               ) : (
                 <Link href="/login" className="block hover:underline">Login</Link>
               )}
             </div>
           )}
         </nav>
       );
     }