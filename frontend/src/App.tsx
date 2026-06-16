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
import StrangerReply from '@/pages/StrangerReply';
import HealingRoom from '@/pages/HealingRoom';
import Community from '@/pages/Community';
import ActivityDetail from '@/pages/ActivityDetail';
import WorkDetail from '@/pages/WorkDetail';
import FutureMailbox from '@/pages/FutureMailbox';
import RelationNetwork from '@/pages/RelationNetwork';
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
          <Route path="/future-mailbox" element={<FutureMailbox />} />
          <Route path="/relation-network" element={<RelationNetwork />} />
          <Route path="/stranger-reply" element={<StrangerReply />} />
          <Route path="/healing" element={<HealingRoom />} />
          <Route path="/activities" element={<Community />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/activities/:activityId/works/:workId" element={<WorkDetail />} />
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
