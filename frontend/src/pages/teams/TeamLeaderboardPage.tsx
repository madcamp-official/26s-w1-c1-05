import { useCallback, useEffect, useState } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { Alert, Avatar, Badge, LoadingState } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TeamLeaderboardRow } from '../../types/team';

export function TeamLeaderboardPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [rows, setRows] = useState<TeamLeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setRows(await teamApi.getLeaderboard(numericTeamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the leaderboard.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadLeaderboard(), [loadLeaderboard]);

  if (isLoading) {
    return <LoadingState label="Loading leaderboard..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">Cleared tasks</span>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">High priority tasks award the most points.</p>
        </div>
        <div className="leaderboard-rules">
          <span>LOW 1</span>
          <span>MEDIUM 3</span>
          <span>HIGH 5</span>
        </div>
      </div>

      <Alert message={errorMessage} />

      <div className="leaderboard-list">
        {rows.map((row) => (
          <Link
            to={`/teams/${numericTeamId}/profiles/${row.user.id}`}
            className={row.rank === 1 ? 'leaderboard-row leaderboard-row-top' : 'leaderboard-row'}
            key={row.user.id}
          >
            <div className="leaderboard-rank">
              {row.rank === 1 ? <Crown size={17} aria-hidden="true" /> : `#${row.rank}`}
            </div>
            <Avatar name={row.user.name} size="lg" tone={row.rank === 1 ? 'ink' : 'neutral'} />
            <div className="leaderboard-person">
              <span className="leaderboard-name">{row.user.name}</span>
              <span className="leaderboard-subtitle">{row.user.title || row.user.email}</span>
            </div>
            <Badge variant={row.rank === 1 ? 'solid' : 'outline'}>{row.reputationLevel}</Badge>
            <div className="leaderboard-score">
              <span className="leaderboard-points">
                <Trophy size={15} aria-hidden="true" />
                {row.points}
              </span>
              <span className="leaderboard-cleared">{row.completedTaskCount} cleared</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
