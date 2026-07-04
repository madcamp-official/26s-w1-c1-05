import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { KeyRound, Lock, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamSummary } from '../../types/team';
import { toTeamCardView, type TeamCardView } from '../../viewModels/teamViewModel';

export function TeamListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinPasswordTeamId, setJoinPasswordTeamId] = useState<number | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    password: '',
  });

  const loadTeams = useCallback(async (nextKeyword = keyword) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await teamApi.getTeams({ keyword: nextKeyword.trim() || undefined });
      setTeams(data);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '팀 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const teamCards = useMemo(() => teams.map(toTeamCardView), [teams]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadTeams(keyword);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!createForm.name.trim()) {
      setErrorMessage('팀 이름을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const team = await teamApi.createTeam({
        name: createForm.name,
        description: createForm.description || undefined,
        password: createForm.password || undefined,
      });
      navigate(`/teams/${team.id}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '팀을 생성하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(team: TeamSummary) {
    if (team.joined) {
      navigate(`/teams/${team.id}`);
      return;
    }

    if (team.hasPassword) {
      setJoinPasswordTeamId(team.id);
      setJoinPassword('');
      return;
    }

    await submitJoin(team.id);
  }

  async function handlePasswordJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinPasswordTeamId) {
      return;
    }
    await submitJoin(joinPasswordTeamId, joinPassword);
  }

  async function handleInviteJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!inviteCode.trim()) {
      setErrorMessage('초대코드를 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const member = await teamApi.joinTeamByInviteCode({ inviteCode });
      navigate(`/teams/${member.teamId}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '초대코드로 팀에 가입하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitJoin(teamId: number, password?: string) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.joinTeam(teamId, password ? { password } : undefined);
      navigate(`/teams/${teamId}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '팀에 가입하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header teams-header">
        <div>
          <span className="eyebrow">Teams</span>
          <h1>팀 목록</h1>
          <p className="muted">{user?.name}님, 참여할 팀을 찾거나 새 팀을 만들 수 있습니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={16} aria-hidden="true" />
          팀 생성
        </Button>
      </div>

      <div className="teams-toolbar">
        <form className="invite-code-box" onSubmit={handleInviteJoin}>
          <KeyRound size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Join
          </Button>
        </form>

        <form className="search-field" onSubmit={handleSearch}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search teams"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            검색
          </Button>
        </form>
      </div>

      {createOpen && (
        <form className="panel form-grid" onSubmit={handleCreate}>
          <h2>새 팀 만들기</h2>
          <label className="field">
            <span>팀 이름</span>
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>설명</span>
            <input
              type="text"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((form) => ({ ...form, description: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>팀 비밀번호</span>
            <input
              type="password"
              placeholder="비워두면 공개 팀"
              value={createForm.password}
              onChange={(event) =>
                setCreateForm((form) => ({ ...form, password: event.target.value }))
              }
            />
          </label>
          <div className="form-actions">
            <Button type="submit" isLoading={isSubmitting}>
              생성
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
          </div>
        </form>
      )}

      <ErrorMessage message={errorMessage} />

      {isLoading ? (
        <LoadingState label="팀 목록을 불러오고 있습니다." />
      ) : teamCards.length === 0 ? (
        <div className="empty-panel">
          <h2>생성된 팀이 없습니다.</h2>
          <p>첫 팀을 만들어 스크럼을 시작하세요.</p>
        </div>
      ) : (
        <div className="team-grid">
          {teamCards.map((teamView) => (
            <TeamCard
              key={teamView.team.id}
              teamView={teamView}
              isPasswordOpen={joinPasswordTeamId === teamView.team.id}
              joinPassword={joinPassword}
              isSubmitting={isSubmitting}
              onJoinPasswordChange={setJoinPassword}
              onPasswordJoin={handlePasswordJoin}
              onAction={handleJoin}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type TeamCardProps = {
  teamView: TeamCardView;
  isPasswordOpen: boolean;
  joinPassword: string;
  isSubmitting: boolean;
  onJoinPasswordChange: (value: string) => void;
  onPasswordJoin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onAction: (team: TeamSummary) => Promise<void>;
};

function TeamCard({
  teamView,
  isPasswordOpen,
  joinPassword,
  isSubmitting,
  onJoinPasswordChange,
  onPasswordJoin,
  onAction,
}: TeamCardProps) {
  const team = teamView.team;

  return (
    <article className="team-card">
      <div className="team-card-header">
        <span className="team-card-badge">{teamView.badge}</span>
        <div>
          <h2>{team.name}</h2>
          <p className="muted">{team.description || '팀 설명이 없습니다.'}</p>
        </div>
        <span className={`badge access-${teamView.accessTone}`}>
          {team.hasPassword ? (
            <>
              <Lock size={14} aria-hidden="true" />
              {teamView.accessLabel}
            </>
          ) : (
            teamView.accessLabel
          )}
        </span>
      </div>

      <div className="team-card-meta-row">
        <span>
          <Users size={14} aria-hidden="true" />
          {teamView.leaderLabel}
        </span>
        <span>{teamView.memberLabel}</span>
      </div>

      {isPasswordOpen && (
        <form className="inline-form" onSubmit={onPasswordJoin}>
          <input
            type="password"
            placeholder="Team password"
            value={joinPassword}
            onChange={(event) => onJoinPasswordChange(event.target.value)}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Join
          </Button>
        </form>
      )}

      <div className="team-card-footer">
        <span className="soft-pill">{teamView.statusLabel}</span>
        <Button
          type="button"
          variant={team.joined ? 'secondary' : 'primary'}
          onClick={() => void onAction(team)}
          disabled={isSubmitting}
        >
          {teamView.actionLabel}
        </Button>
      </div>
    </article>
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
