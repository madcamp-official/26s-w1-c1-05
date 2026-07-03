import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamRole } from '../../types/team';

export function TeamSettingsPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeam() {
      if (!Number.isFinite(numericTeamId)) {
        setErrorMessage('팀 정보가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const team = await teamApi.getTeam(numericTeamId);
        setName(team.name);
        setDescription(team.description ?? '');
        setHasPassword(team.hasPassword);
        setInviteCode(team.inviteCode);
        setMyRole(team.myRole);
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : '팀 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadTeam();
  }, [numericTeamId]);

  async function handleUpdateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('팀 이름을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const team = await teamApi.updateTeam(numericTeamId, {
        name,
        description: description || undefined,
      });
      setName(team.name);
      setDescription(team.description ?? '');
      setSuccessMessage('팀 정보가 저장되었습니다.');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '팀 정보를 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRotateInviteCode() {
    if (!window.confirm('기존 초대코드를 만료하고 새 초대코드를 발급할까요?')) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const result = await teamApi.rotateInviteCode(numericTeamId);
      setInviteCode(result.inviteCode);
      setSuccessMessage('초대코드가 재발급되었습니다.');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '초대코드를 재발급하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPassword(password || null);
  }

  async function handleClearPassword() {
    if (!window.confirm('팀을 공개 팀으로 변경할까요?')) {
      return;
    }
    await submitPassword(null);
  }

  async function submitPassword(nextPassword: string | null) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const result = await teamApi.updateTeamPassword(numericTeamId, {
        password: nextPassword,
      });
      setHasPassword(result.hasPassword);
      setPassword('');
      setSuccessMessage(result.hasPassword ? '팀 비밀번호가 변경되었습니다.' : '공개 팀으로 변경되었습니다.');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '팀 비밀번호를 변경하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="팀 설정을 불러오고 있습니다." />;
  }

  const canManageTeam = myRole === 'LEADER';

  return (
    <section className="page-section">
      <h1>팀 설정</h1>
      <p className="muted">Team #{teamId}의 기본 정보와 가입 비밀번호를 관리합니다.</p>

      <ErrorMessage message={errorMessage} />
      {!canManageTeam && (
        <div className="notice">팀 설정은 팀장만 변경할 수 있습니다.</div>
      )}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form className="panel form-stack-plain" onSubmit={handleUpdateTeam}>
        <h2>기본 정보</h2>
        <label className="field">
          <span>팀 이름</span>
          <input
            type="text"
            value={name}
            disabled={!canManageTeam}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>설명</span>
          <input
            type="text"
            value={description}
            disabled={!canManageTeam}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <Button type="submit" isLoading={isSubmitting} disabled={!canManageTeam}>
            저장
          </Button>
        </div>
      </form>

      <form className="panel form-stack-plain" onSubmit={handleUpdatePassword}>
        <h2>팀 비밀번호</h2>
        <p className="muted">
          현재 상태: {hasPassword ? '비밀번호 팀' : '공개 팀'}
        </p>
        <label className="field">
          <span>새 비밀번호</span>
          <input
            type="password"
            value={password}
            disabled={!canManageTeam}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <Button type="submit" isLoading={isSubmitting} disabled={!canManageTeam}>
            비밀번호 저장
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting || !canManageTeam}
            onClick={() => void handleClearPassword()}
          >
            공개 팀으로 변경
          </Button>
        </div>
      </form>

      <section className="panel form-stack-plain">
        <h2>초대코드</h2>
        <p className="muted">팀원은 팀 목록에서 초대코드를 입력해 비밀번호 없이 가입할 수 있습니다.</p>
        <label className="field">
          <span>현재 초대코드</span>
          <input type="text" value={inviteCode ?? ''} readOnly />
        </label>
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting || !canManageTeam}
            onClick={() => void handleRotateInviteCode()}
          >
            초대코드 재발급
          </Button>
        </div>
      </section>
    </section>
  );
}
