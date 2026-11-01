import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getOrCreateVoterToken, generateFingerprint } from '../utils/fingerprint';
import { sound } from '../hooks/useSound';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [httpConnected, setHttpConnected] = useState(false);
  const isConnected = socketConnected || httpConnected;

  const [state, setState] = useState({
    options: [],
    settings: {
      votingState: 'open',
      screenMode: 'idle',
      maxVotesPerPerson: 1,
      allowSameOptionMultiple: false,
      showCounts: true,
      showPercentages: true,
      showTopN: 0,
      autoCycle: false,
      autoCycleInterval: 15,
      revealMode: false,
      revealedCount: 0,
      soundEnabled: false,
      testMode: false,
      eventTitleArabic: 'ذكاء يُبتكر',
      eventSubtitleEnglish: 'AI INNOVATION COMPETITION',
      votingUrl: '',
    },
    stats: {
      totalVotes: 0,
      uniqueVotersCount: 0,
      recentVotesCount: 0,
    },
  });

  const [voterStatus, setVoterStatus] = useState({
    canVote: true,
    votesRemaining: 1,
    maxVotes: 1,
    votedOptionIds: [],
    votingState: 'open',
  });

  const [latestVoteEvent, setLatestVoteEvent] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Connect to same origin in production, or socket proxy in dev
    const s = io(window.location.origin, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setSocketConnected(true);
      // Verify voter status
      const token = getOrCreateVoterToken();
      const fp = generateFingerprint();
      s.emit('voter:check', { voterToken: token, fingerprint: fp });
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
    });

    s.on('state:sync', (initialState) => {
      setState(initialState);
      sound.setEnabled(initialState.settings?.soundEnabled);
    });

    s.on('state:update', (updatedState) => {
      setState(updatedState);
      sound.setEnabled(updatedState.settings?.soundEnabled);
    });

    s.on('voter:status', (status) => {
      setVoterStatus(status);
    });

    s.on('voter:locksCleared', () => {
      const token = getOrCreateVoterToken();
      const fp = generateFingerprint();
      s.emit('voter:check', { voterToken: token, fingerprint: fp });
    });

    s.on('vote:new', (voteEvent) => {
      setLatestVoteEvent(voteEvent);
      sound.playVotePing();
    });

    setSocket(s);

    // Helper to fetch fresh state immediately via HTTP (critical for Vercel and instant initial load)
    const fetchFreshState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const publicState = await res.json();
          // Ensure votingUrl is valid for current deployment
          if (
            !publicState.settings?.votingUrl ||
            (publicState.settings.votingUrl.includes('localhost') && window.location.hostname !== 'localhost')
          ) {
            publicState.settings.votingUrl = `${window.location.origin}/vote`;
          }
          setState(publicState);
          setHttpConnected(true);
        } else {
          setHttpConnected(false);
        }

        const token = getOrCreateVoterToken();
        const fp = generateFingerprint();
        const statusRes = await fetch(`/api/voter/status?token=${encodeURIComponent(token)}&fp=${encodeURIComponent(fp)}`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          setVoterStatus(status);
        }
      } catch (err) {
        setHttpConnected(false);
      }
    };

    // 1. Fetch immediately on mount so UI renders in < 50ms without waiting for socket
    fetchFreshState();

    // 2. Resilient polling fallback (for serverless platforms like Vercel where WebSockets are unavailable)
    const pollInterval = setInterval(() => {
      if (!socketConnected) {
        fetchFreshState();
      }
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      s.disconnect();
    };
  }, [socketConnected]);

  // Submit vote function (supports both Socket.io and HTTP fallback)
  const submitVote = useCallback(
    async (optionId) => {
      const token = getOrCreateVoterToken();
      const fp = generateFingerprint();

      // If socket is connected, use real-time socket
      if (socket && socketConnected) {
        return new Promise((resolve) => {
          socket.emit('vote:submit', { optionId, voterToken: token, fingerprint: fp }, (response) => {
            if (response && response.success) {
              setVoterStatus((prev) => ({
                ...prev,
                canVote: response.votesRemaining > 0,
                votesRemaining: response.votesRemaining,
                votedOptionIds: response.votedOptionIds,
              }));
            }
            resolve(response);
          });
        });
      }

      // Fallback to REST API (e.g. Vercel serverless)
      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId, voterToken: token, fingerprint: fp }),
        });
        const data = await res.json();
        if (data && data.success) {
          setVoterStatus((prev) => ({
            ...prev,
            canVote: data.votesRemaining > 0,
            votesRemaining: data.votesRemaining,
            votedOptionIds: data.votedOptionIds,
          }));
        }
        return data;
      } catch (err) {
        return { success: false, error: 'تعذر الاتصال بالخادم، يرجى المحاولة ثانية' };
      }
    },
    [socket, socketConnected]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected: isConnected,
        state,
        voterStatus,
        latestVoteEvent,
        submitVote,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}

