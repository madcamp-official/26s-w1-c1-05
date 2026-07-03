import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { KeyRound, Lock, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamSummary } from '../../types/team';

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

  useEffect(() => {
    void loadTeams();
  }, []);

  const filteredTeams = useMemo(() => teams, [teams]);

  async function loadTeams(nextKeyword = keyword) {
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
  }

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
      const member = await teamApi.joinTeamByInviteCode({
        inviteCode,
      });
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
      <div className="page-header">
        <div>
          <h1>팀 목록</h1>
          <p className="muted">
            {user?.name}님, 참여할 팀을 찾거나 새 팀을 만들 수 있습니다.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={16} aria-hidden="true" />
          팀 생성
        </Button>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="팀 이름 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      <form className="panel inline-form" onSubmit={handleInviteJoin}>
        <label className="field">
          <span>초대코드로 가입</span>
          <input
            type="text"
            placeholder="예: ABCD1234"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
        </label>
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          <KeyRound size={16} aria-hidden="true" />
          가입
        </Button>
      </form>

      {createOpen && (
        <form className="panel form-grid" onSubmit={handleCreate}>
          <h2>새 팀 만들기</h2>
          <label className="field">
            <span>팀 이름</span>
            <input
              type="text"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((form) => ({ ...form, name: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>설명</span>
            <input
              type="text"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  description: event.target.value,
                }))
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
      ) : filteredTeams.length === 0 ? (
        <div className="empty-panel">
          <h2>생성된 팀이 없습니다.</h2>
          <p>첫 팀을 만들어 스크럼을 시작하세요.</p>
        </div>
      ) : (
        <div className="team-grid">
          {filteredTeams.map((team) => (
            <article className="team-card" key={team.id}>
              <div className="team-card-header">
                <div>
                  <h2>{team.name}</h2>
                  <p className="muted">{team.description || '팀 설명이 없습니다.'}</p>
                </div>
                <span className={team.hasPassword ? 'badge badge-warning' : 'badge'}>
                  {team.hasPassword ? (
                    <>
                      <Lock size={14} aria-hidden="true" />
                      비밀번호
                    </>
                  ) : (
                    '공개'
                  )}
                </span>
              </div>

              <dl className="team-meta">
                <div>
                  <dt>팀장</dt>
                  <dd>{team.leader.name}</dd>
                </div>
                <div>
                  <dt>팀원</dt>
                  <dd>
                    <Users size={14} aria-hidden="true" />
                    {team.memberCount}명
                  </dd>
                </div>
                <div>
                  <dt>내 상태</dt>
                  <dd>{team.joined ? team.myRole : '미가입'}</dd>
                </div>
              </dl>

              {joinPasswordTeamId === team.id && (
                <form className="inline-form" onSubmit={handlePasswordJoin}>
                  <input
                    type="password"
                    placeholder="팀 비밀번호"
                    value={joinPassword}
                    onChange={(event) => setJoinPassword(event.target.value)}
                  />
                  <Button type="submit" isLoading={isSubmitting}>
                    가입
                  </Button>
                </form>
              )}

              <Button
                type="button"
                variant={team.joined ? 'secondary' : 'primary'}
                onClick={() => void handleJoin(team)}
                disabled={isSubmitting}
              >
                {team.joined ? '입장' : team.hasPassword ? '비밀번호 입력' : '가입'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
