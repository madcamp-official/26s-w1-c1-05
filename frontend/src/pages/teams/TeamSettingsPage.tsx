import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';

export function TeamSettingsPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
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

  return (
    <section className="page-section">
      <h1>팀 설정</h1>
      <p className="muted">Team #{teamId}의 기본 정보와 가입 비밀번호를 관리합니다.</p>

      <ErrorMessage message={errorMessage} />
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form className="panel form-stack-plain" onSubmit={handleUpdateTeam}>
        <h2>기본 정보</h2>
        <label className="field">
          <span>팀 이름</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>설명</span>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <Button type="submit" isLoading={isSubmitting}>
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
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <Button type="submit" isLoading={isSubmitting}>
            비밀번호 저장
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => void handleClearPassword()}
          >
            공개 팀으로 변경
          </Button>
        </div>
      </form>
    </section>
  );
}
