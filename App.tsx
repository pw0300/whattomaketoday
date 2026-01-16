import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const BlogIndex = React.lazy(() => import('./pages/BlogIndex'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// Loading Screen
const Loading = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F8F5F2] text-[#1A4D2E]">
    <Loader2 className="animate-spin" size={32} />
  </div>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Marketing Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* App Routes */}
            <Route path="/app/*" element={<Dashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
};

export default App;
