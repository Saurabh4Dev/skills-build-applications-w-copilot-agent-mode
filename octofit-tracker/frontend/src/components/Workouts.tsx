import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type WorkoutSuggestion = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const state = useApiData<WorkoutResponse>('/api/workouts/suggestions/mona%40example.com');
  const suggestions = state.status === 'success' ? state.data.suggestions : [];
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyText="No workout suggestions are available."
      state={state}
      isEmpty={state.status === 'success' && suggestions.length === 0}
    >
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`}>
            <strong>{suggestion.title}</strong>
            {suggestion.focus && ` — ${suggestion.focus}`}
            {suggestion.minutes !== undefined && `, ${suggestion.minutes} minutes`}
            {suggestion.difficulty && `, ${suggestion.difficulty}`}
            {suggestion.reason && <p>{suggestion.reason}</p>}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
