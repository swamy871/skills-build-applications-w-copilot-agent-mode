import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; focus?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions yet.</p>}
      {!loading && !error && suggestions.map((suggestion, index) => (
        <p key={index}>{suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}</p>
      ))}
    </CapabilityCard>
  );
}
