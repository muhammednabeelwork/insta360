/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import AdminPanel from '@/components/AdminPanel';
import BigScreen from '@/components/BigScreen';
import CertificateSystem from '@/components/CertificateSystem';
import CertificateManagement from '@/components/CertificateManagement';
import ThankYou from '@/components/ThankYou';
import ServerDetails from '@/components/ServerDetails';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/certificate/management" element={<CertificateManagement />} />
          <Route path="/display" element={<BigScreen />} />
          <Route path="/certificate" element={<CertificateSystem />} />
          <Route path="/certificate/thank-you" element={<ThankYou />} />
          <Route path="/server" element={<ServerDetails />} />
          {/* Default redirect to display for general viewers */}
          <Route path="/" element={<Navigate to="/display" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}
