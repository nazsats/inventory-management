import './globals.css';
     import { AuthProvider } from '../context/AuthContext';
     import Navbar from '../components/Navbar';
     import { ToastContainer } from 'react-toastify';
     import 'react-toastify/dist/ReactToastify.css';

     export const metadata = {
       metadataBase: new URL('http://localhost:3000'),
       title: 'Inventory Management',
       description: 'Manage your inventory efficiently',
     };

     export default function RootLayout({ children }: { children: React.ReactNode }) {
       return (
         <html lang="en">
           <body>
             <AuthProvider>
               <Navbar />
               <main>{children}</main>
               <ToastContainer />
             </AuthProvider>
           </body>
         </html>
       );
     }