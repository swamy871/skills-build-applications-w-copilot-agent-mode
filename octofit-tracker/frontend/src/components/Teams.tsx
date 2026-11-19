import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {loading && <p role="status">Loading teams...</p>}
      {error && <p role="alert">Unable to load teams: {error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams yet.</p>}
      {!loading && !error && teams.map((team, index) => (
        <p key={index}>{team.name}{team.mascot ? ` - ${team.mascot}` : ''}{team.members?.length ? ` (${team.members.join(', ')})` : ''}</p>
      ))}
    </CapabilityCard>
  );
}
