import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <p role="alert">Unable to load leaderboard: {error}</p>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
      {!loading && !error && leaderboard.map((entry) => (
        <p key={entry.rank}>{entry.rank}. {entry.teamName}: {entry.totalPoints}</p>
      ))}
    </CapabilityCard>
  );
}
