import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const state = useApiData<ActivitiesResponse>('/api/activities');
  const activities = state.status === 'success' ? state.data.activities : [];
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      emptyText="No activities yet."
      state={state}
      isEmpty={state.status === 'success' && activities.length === 0}
    >
      <ul>
        {activities.map((activity, index) => (
          <li key={activity._id ?? `${activity.type}-${index}`}>
            {activity.type}: {activity.minutes} minutes, {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
