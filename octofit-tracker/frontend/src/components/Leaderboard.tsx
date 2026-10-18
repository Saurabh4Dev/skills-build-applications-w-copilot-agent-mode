import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const state = useApiData<LeaderboardResponse>('/api/leaderboard');
  const leaderboard = state.status === 'success' ? state.data.leaderboard : [];
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyText="No leaderboard scores yet."
      state={state}
      isEmpty={state.status === 'success' && leaderboard.length === 0}
    >
      <ol>
        {leaderboard.map((entry) => (
          <li key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
