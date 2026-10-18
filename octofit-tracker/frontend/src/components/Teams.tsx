import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const state = useApiData<TeamsResponse>('/api/teams');
  const teams = state.status === 'success' ? state.data.teams : [];
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyText="No teams yet."
      state={state}
      isEmpty={state.status === 'success' && teams.length === 0}
    >
      <ul>
        {teams.map((team, index) => (
          <li key={team._id ?? `${team.name}-${index}`}>
            {team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
