import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading && <p role="status">Loading activities...</p>}
      {error && <p role="alert">Unable to load activities: {error}</p>}
      {!loading && !error && activities.length === 0 && <p>No activities yet.</p>}
      {!loading && !error && activities.map((activity, index) => (
        <p key={index}>{activity.type} - {activity.minutes ?? 0} minutes ({activity.points ?? 0} points)</p>
      ))}
    </CapabilityCard>
  );
}
