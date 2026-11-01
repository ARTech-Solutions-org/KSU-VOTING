import React from 'react';
import { SocketProvider } from './context/SocketContext';
import BigScreen from './views/BigScreen';
import MobileVote from './views/MobileVote';
import AdminModal from './views/AdminModal';
import { navigate, useCurrentPath } from './utils/navigation';

export default function App() {
  const path = useCurrentPath();

  return (
    <SocketProvider>
      {path === '/vote' ? (
        <MobileVote />
      ) : path === '/admin' ? (
        <div className="relative min-h-screen bg-slate-950">
          <BigScreen />
          <AdminModal onClose={() => navigate('/')} />
        </div>
      ) : (
        <BigScreen />
      )}
    </SocketProvider>
  );
}
