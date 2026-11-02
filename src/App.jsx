import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import BigScreen from './views/BigScreen';
import MobileVote from './views/MobileVote';
import AdminModal from './views/AdminModal';
import ScreenPinGate from './components/ScreenPinGate';
import { navigate, useRouteInfo } from './utils/navigation';

function AppContent() {
  const route = useRouteInfo();
  const { state } = useSocket();
  const [screenAuthed, setScreenAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('ksu_screen_auth') === 'true';
    } catch {
      return false;
    }
  });

  const correctPin = state.settings?.adminPin || '2026';

  // Check if PIN was supplied in URL (e.g. /2026, /screen/2026, or ?pin=2026)
  const isPinValidInUrl = Boolean(
    route.pin && (route.pin === correctPin || route.pin === '2026')
  );

  // Auto-authenticate and store session if valid PIN is in URL
  useEffect(() => {
    if (isPinValidInUrl) {
      try {
        sessionStorage.setItem('ksu_screen_auth', 'true');
      } catch {}
      setScreenAuthed(true);
    }
  }, [isPinValidInUrl]);

  // Requirement: The root URL (/) or unknown URL redirects to /vote so attendees always vote
  useEffect(() => {
    if (route.type === 'root' || route.type === 'unknown') {
      window.history.replaceState({}, '', '/vote');
      navigate('/vote');
    }
  }, [route.type]);

  // Route: /vote (or landing on root / which redirects to /vote)
  if (route.type === 'vote' || route.type === 'root' || route.type === 'unknown') {
    return <MobileVote />;
  }

  // Route: /admin (Admin panel with PIN verification modal)
  if (route.type === 'admin') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <BigScreen />
        <AdminModal onClose={() => navigate('/screen')} />
      </div>
    );
  }

  // Route: Big Screen Display (/2026, /screen/2026, /screen?pin=2026, /screen)
  if (route.type === 'screen') {
    if (screenAuthed || isPinValidInUrl) {
      return <BigScreen />;
    }

    // If not authenticated or invalid PIN, show PIN gate
    return (
      <ScreenPinGate
        initialPin={route.pin || ''}
        onSuccess={() => setScreenAuthed(true)}
      />
    );
  }

  // Safe fallback to voting page
  return <MobileVote />;
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
