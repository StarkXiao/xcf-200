import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import StarryBackground from '@/components/Layout/StarryBackground';
import ToastContainer from '@/components/UI/Toast';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Plaza from '@/pages/Plaza';
import WriteLetter from '@/pages/WriteLetter';
import LetterDetail from '@/pages/LetterDetail';
import Emotions from '@/pages/Emotions';
import Profile from '@/pages/Profile';
import Archive from '@/pages/Archive';
import NotFound from '@/pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground />
      {!isAuthPage && <Navbar />}
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Plaza />} />
          <Route path="/write" element={<WriteLetter />} />
          <Route path="/letter/:id" element={<LetterDetail />} />
          <Route path="/emotions" element={<Emotions />} />
          <Route path="/emotions/:name" element={<Emotions />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout />
    </Router>
  );
}
