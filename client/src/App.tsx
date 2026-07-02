import { type FormEvent, useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const TOKEN_KEY = "scrummate_token";

type User = {
  id: number;
  email: string;
  name: string;
};

type TeamMember = {
  id: number;
  teamId: number;
  userId: number;
  role: "OWNER" | "MEMBER";
  position: string | null;
  department: string | null;
  joinedAt: string;
  user: User;
};

type TaskAssignee = {
  taskId: number;
  userId: number;
  assignedByUserId: number;
  assignedAt: string;
  user: User;
};

type TaskComment = {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
};

type Task = {
  id: number;
  teamId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  blockedReason: string | null;
  createdByUserId: number;
  updatedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  assignees: TaskAssignee[];
  comments: TaskComment[];
};

type RetroItem = {
  id: number;
  retrospectiveId: number;
  type: RetroType;
  content: string;
  authorUserId: number;
  createdAt: string;
  updatedAt: string;
  author: User;
};

type Retrospective = {
  id: number;
  teamId: number;
  title: string;
  sprintName: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  items: RetroItem[];
};

type Team = {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  inviteCode: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  myRole?: "OWNER" | "MEMBER";
  members?: TeamMember[];
  tasks?: Task[];
  retrospectives?: Retrospective[];
};

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type RetroType = "KEEP" | "PROBLEM" | "TRY";
type Tab = "dashboard" | "board" | "members" | "retro";

type ApiResult<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done"
};

const priorityLabels: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High"
};

const retroLabels: Record<RetroType, string> = {
  KEEP: "Keep",
  PROBLEM: "Problem",
  TRY: "Try"
};

async function api<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const result = (await response.json()) as ApiResult<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return result.data;
}

function formatDate(date: string | null) {
  if (!date) {
    return "마감 없음";
  }
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function toInputDate(date: string | null) {
  return date ? date.slice(0, 10) : "";
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getDueState(task: Task) {
  if (!task.dueDate || task.status === "DONE") {
    return "none";
  }
  const now = new Date();
  const due = new Date(task.dueDate);
  if (due < new Date(now.toDateString())) {
    return "overdue";
  }
  const soon = new Date(now);
  soon.setDate(now.getDate() + 2);
  if (due <= soon) {
    return "soon";
  }
  return "normal";
}

function dueLabel(task: Task) {
  const state = getDueState(task);
  if (state === "overdue") {
    return "마감 초과";
  }
  if (state === "soon") {
    return "마감 임박";
  }
  return formatDate(task.dueDate);
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTeams([]);
    setSelectedTeam(null);
    setSelectedTeamId(null);
  };

  const run = async <T,>(action: () => Promise<T>, successMessage?: string) => {
    try {
      setLoading(true);
      setMessage("");
      const result = await action();
      if (successMessage) {
        setMessage(successMessage);
      }
      return result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "오류가 발생했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    if (!token) {
      return;
    }
    const nextTeams = await api<Team[]>("/teams", token);
    setTeams(nextTeams);
    if (!selectedTeamId && nextTeams.length > 0) {
      setSelectedTeamId(nextTeams[0].id);
    }
    if (selectedTeamId && !nextTeams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(nextTeams[0]?.id ?? null);
      setSelectedTeam(null);
    }
  };

  const loadSelectedTeam = async () => {
    if (!token || !selectedTeamId) {
      setSelectedTeam(null);
      return;
    }
    const team = await api<Team>(`/teams/${selectedTeamId}`, token);
    setSelectedTeam(team);
  };

  const refreshAll = async () => {
    await loadTeams();
    await loadSelectedTeam();
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    run(async () => {
      const me = await api<User>("/me", token);
      setUser(me);
      await loadTeams();
    });
  }, [token]);

  useEffect(() => {
    run(loadSelectedTeam);
  }, [selectedTeamId, token]);

  const handleAuthenticated = (nextUser: User, nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  if (!token || !user) {
    return <AuthView loading={loading} message={message} onAuth={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>ScrumMate</strong>
            <span>로컬 스크럼 보드</span>
          </div>
        </div>
        <UserPanel user={user} onLogout={logout} />
        <TeamPanel
          token={token}
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelect={(teamId) => {
            setSelectedTeamId(teamId);
            setActiveTab("dashboard");
          }}
          onChanged={() => run(refreshAll, "팀 정보가 갱신되었습니다.")}
        />
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Common Project I</p>
            <h1>{selectedTeam?.name ?? "팀을 선택하거나 생성하세요"}</h1>
          </div>
          <div className="topbar-meta">
            {selectedTeam ? (
              <>
                <span>{formatDate(selectedTeam.startDate)} - {formatDate(selectedTeam.endDate)}</span>
                <span>{selectedTeam.members?.length ?? 0}명</span>
              </>
            ) : (
              <span>로컬 MVP</span>
            )}
          </div>
        </header>

        {message && <div className="notice">{message}</div>}
        {loading && <div className="loading-bar">처리 중...</div>}

        {!selectedTeam ? (
          <EmptyState title="아직 선택된 팀이 없습니다." body="왼쪽에서 팀을 생성하거나 초대 코드로 가입하세요." />
        ) : (
          <>
            <nav className="tabs">
              {[
                ["dashboard", "대시보드"],
                ["board", "스크럼 보드"],
                ["members", "팀원"],
                ["retro", "KPT 회고"]
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab as Tab)}
                >
                  {label}
                </button>
              ))}
            </nav>

            {activeTab === "dashboard" && <Dashboard team={selectedTeam} />}
            {activeTab === "board" && (
              <Board
                token={token}
                user={user}
                team={selectedTeam}
                onChanged={() => run(refreshAll, "보드가 갱신되었습니다.")}
              />
            )}
            {activeTab === "members" && (
              <Members
                token={token}
                user={user}
                team={selectedTeam}
                onChanged={() => run(refreshAll, "팀원 정보가 갱신되었습니다.")}
              />
            )}
            {activeTab === "retro" && (
              <Retrospectives
                token={token}
                user={user}
                team={selectedTeam}
                onChanged={() => run(refreshAll, "회고가 갱신되었습니다.")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AuthView({
  loading,
  message,
  onAuth
}: {
  loading: boolean;
  message: string;
  onAuth: (user: User, token: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("안종화");
  const [email, setEmail] = useState("owner.a@scrummate.test");
  const [password, setPassword] = useState("Test1234!");
  const [localMessage, setLocalMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalMessage("");

    try {
      const result = await api<{ user: User; token: string }>(`/auth/${mode}`, null, {
        method: "POST",
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password })
      });
      onAuth(result.user, result.token);
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "인증에 실패했습니다.");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-copy">
        <p className="eyebrow">ScrumMate</p>
        <h1>작은 팀이 매일 쓰는 스크럼 보드</h1>
        <p>팀 생성, 태스크 담당자 지정, 진행 상태 변경, 마감일 추적, KPT 회고를 하나의 로컬 웹앱에서 검증합니다.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            회원가입
          </button>
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            로그인
          </button>
        </div>
        {mode === "signup" && (
          <label>
            이름
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label>
          이메일
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          비밀번호
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button className="primary" disabled={loading}>
          {mode === "signup" ? "계정 만들기" : "로그인"}
        </button>
        {(message || localMessage) && <p className="form-message">{localMessage || message}</p>}
        <p className="hint">테스트 계정 예시: owner.a@scrummate.test / Test1234!</p>
      </form>
    </div>
  );
}

function UserPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="user-panel">
      <div>
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>
      <button className="ghost" onClick={onLogout}>로그아웃</button>
    </div>
  );
}

function TeamPanel({
  token,
  teams,
  selectedTeamId,
  onSelect,
  onChanged
}: {
  token: string;
  teams: Team[];
  selectedTeamId: number | null;
  onSelect: (teamId: number) => void;
  onChanged: () => void;
}) {
  const [teamName, setTeamName] = useState("ScrumMate Alpha");
  const [description, setDescription] = useState("5일 로컬 MVP 개발팀");
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState(addDaysInput(5));
  const [inviteCode, setInviteCode] = useState("");

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    await api<Team>("/teams", token, {
      method: "POST",
      body: JSON.stringify({ name: teamName, description, startDate, endDate })
    });
    onChanged();
  };

  const joinTeam = async (event: FormEvent) => {
    event.preventDefault();
    await api<TeamMember>("/teams/join", token, {
      method: "POST",
      body: JSON.stringify({ inviteCode })
    });
    setInviteCode("");
    onChanged();
  };

  return (
    <div className="team-panel">
      <h2>내 팀</h2>
      <div className="team-list">
        {teams.length === 0 && <p className="empty-note">아직 소속된 팀이 없습니다.</p>}
        {teams.map((team) => (
          <button
            key={team.id}
            className={team.id === selectedTeamId ? "team-item active" : "team-item"}
            onClick={() => onSelect(team.id)}
          >
            <strong>{team.name}</strong>
            <span>{team.myRole}</span>
          </button>
        ))}
      </div>

      <form className="stacked-form" onSubmit={createTeam}>
        <h3>팀 생성</h3>
        <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="팀 이름" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="설명" />
        <div className="two-cols">
          <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" />
          <input value={endDate} onChange={(event) => setEndDate(event.target.value)} type="date" />
        </div>
        <button className="primary">생성</button>
      </form>

      <form className="stacked-form" onSubmit={joinTeam}>
        <h3>초대 코드 가입</h3>
        <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="초대 코드" />
        <button>가입</button>
      </form>
    </div>
  );
}

function Dashboard({ team }: { team: Team }) {
  const tasks = team.tasks ?? [];
  const done = tasks.filter((task) => task.status === "DONE").length;
  const blocked = tasks.filter((task) => task.status === "BLOCKED");
  const overdue = tasks.filter((task) => getDueState(task) === "overdue");
  const soon = tasks.filter((task) => getDueState(task) === "soon");
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <section className="dashboard-grid">
      <Metric title="전체 작업" value={tasks.length.toString()} detail={`${completion}% 완료`} />
      <Metric title="완료" value={done.toString()} detail="Done 상태" />
      <Metric title="Blocked" value={blocked.length.toString()} detail={blocked[0]?.title ?? "막힌 작업 없음"} />
      <Metric title="마감 임박" value={(soon.length + overdue.length).toString()} detail={`${overdue.length}개 초과`} />
      <div className="panel wide">
        <h2>오늘 볼 작업</h2>
        <div className="mini-list">
          {[...overdue, ...soon, ...blocked].slice(0, 8).map((task) => (
            <div key={task.id} className="mini-row">
              <span>{task.title}</span>
              <strong>{statusLabels[task.status]}</strong>
            </div>
          ))}
          {tasks.length === 0 && <EmptyState title="작업이 없습니다." body="스크럼 보드에서 첫 태스크를 만드세요." />}
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Board({
  token,
  user,
  team,
  onChanged
}: {
  token: string;
  user: User;
  team: Team;
  onChanged: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(team.tasks?.[0]?.id ?? null);
  const tasks = team.tasks ?? [];
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [team.id, tasks.length]);

  const changeStatus = async (task: Task, status: TaskStatus) => {
    const blockedReason =
      status === "BLOCKED" ? window.prompt("막힌 이유를 입력하세요.", task.blockedReason ?? "") : undefined;
    if (status === "BLOCKED" && !blockedReason) {
      return;
    }
    await api<Task>(`/tasks/${task.id}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ status, blockedReason })
    });
    onChanged();
  };

  return (
    <div className="board-layout">
      <section className="board-main">
        <TaskCreateForm token={token} team={team} onCreated={onChanged} />
        <div className="kanban">
          {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
            <div key={status} className="column">
              <h2>{statusLabels[status]}</h2>
              {tasks.filter((task) => task.status === status).map((task) => (
                <article key={task.id} className={`task-card ${getDueState(task)}`}>
                  <div className="task-card-head">
                    <strong>{task.title}</strong>
                    <span className={`priority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>
                  </div>
                  <p>{task.description || "설명 없음"}</p>
                  <div className="task-meta">
                    <span>{dueLabel(task)}</span>
                    <span>{task.assignees.map((assignee) => assignee.user.name).join(", ") || "미담당"}</span>
                  </div>
                  {task.blockedReason && <div className="blocked-reason">{task.blockedReason}</div>}
                  <div className="task-actions">
                    <select value={task.status} onChange={(event) => changeStatus(task, event.target.value as TaskStatus)}>
                      {(Object.keys(statusLabels) as TaskStatus[]).map((key) => (
                        <option key={key} value={key}>{statusLabels[key]}</option>
                      ))}
                    </select>
                    <button onClick={() => setSelectedTaskId(task.id)}>상세</button>
                  </div>
                </article>
              ))}
              {tasks.filter((task) => task.status === status).length === 0 && (
                <p className="empty-note">작업 없음</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <aside className="detail-panel">
        {selectedTask ? (
          <TaskDetail token={token} user={user} team={team} task={selectedTask} onChanged={onChanged} />
        ) : (
          <EmptyState title="태스크를 선택하세요." body="카드의 상세 버튼을 누르면 수정과 댓글 작성이 가능합니다." />
        )}
      </aside>
    </div>
  );
}

function TaskCreateForm({ token, team, onCreated }: { token: string; team: Team; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState(addDaysInput(1));
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const members = team.members ?? [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await api<Task>(`/teams/${team.id}/tasks`, token, {
      method: "POST",
      body: JSON.stringify({ title, description, priority, dueDate, assigneeIds })
    });
    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    onCreated();
  };

  return (
    <form className="panel task-form" onSubmit={submit}>
      <h2>새 태스크</h2>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="설명" />
      <div className="three-cols">
        <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
          {(Object.keys(priorityLabels) as Priority[]).map((key) => (
            <option key={key} value={key}>{priorityLabels[key]}</option>
          ))}
        </select>
        <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" />
        <button className="primary">추가</button>
      </div>
      <CheckboxGroup
        label="담당자"
        options={members.map((member) => ({ id: member.userId, label: member.user.name }))}
        selected={assigneeIds}
        onChange={setAssigneeIds}
      />
    </form>
  );
}

function TaskDetail({
  token,
  user,
  team,
  task,
  onChanged
}: {
  token: string;
  user: User;
  team: Team;
  task: Task;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(toInputDate(task.dueDate));
  const [assigneeIds, setAssigneeIds] = useState(task.assignees.map((assignee) => assignee.userId));
  const [comment, setComment] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(toInputDate(task.dueDate));
    setAssigneeIds(task.assignees.map((assignee) => assignee.userId));
    setComment("");
  }, [task.id]);

  const members = team.members ?? [];
  const myRole = members.find((member) => member.userId === user.id)?.role;
  const canDelete = task.createdByUserId === user.id || myRole === "OWNER";

  const saveTask = async (event: FormEvent) => {
    event.preventDefault();
    await api<Task>(`/tasks/${task.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ title, description, priority, dueDate })
    });
    await api<Task>(`/tasks/${task.id}/assignees`, token, {
      method: "PATCH",
      body: JSON.stringify({ assigneeIds })
    });
    onChanged();
  };

  const deleteTask = async () => {
    if (!window.confirm("태스크를 삭제할까요?")) {
      return;
    }
    await api<null>(`/tasks/${task.id}`, token, { method: "DELETE" });
    onChanged();
  };

  const createComment = async (event: FormEvent) => {
    event.preventDefault();
    await api<TaskComment>(`/tasks/${task.id}/comments`, token, {
      method: "POST",
      body: JSON.stringify({ content: comment })
    });
    setComment("");
    onChanged();
  };

  const deleteComment = async (commentId: number) => {
    await api<null>(`/comments/${commentId}`, token, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="detail-stack">
      <form className="panel" onSubmit={saveTask}>
        <h2>태스크 상세</h2>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="two-cols">
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {(Object.keys(priorityLabels) as Priority[]).map((key) => (
              <option key={key} value={key}>{priorityLabels[key]}</option>
            ))}
          </select>
          <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" />
        </div>
        <CheckboxGroup
          label="담당자"
          options={members.map((member) => ({ id: member.userId, label: member.user.name }))}
          selected={assigneeIds}
          onChange={setAssigneeIds}
        />
        <div className="button-row">
          <button className="primary">저장</button>
          {canDelete && <button type="button" className="danger" onClick={deleteTask}>삭제</button>}
        </div>
      </form>

      <section className="panel">
        <h2>댓글</h2>
        <div className="comments">
          {task.comments.map((item) => (
            <div key={item.id} className="comment">
              <div>
                <strong>{item.user.name}</strong>
                <p>{item.content}</p>
              </div>
              {(item.userId === user.id || myRole === "OWNER") && (
                <button className="ghost" onClick={() => deleteComment(item.id)}>삭제</button>
              )}
            </div>
          ))}
          {task.comments.length === 0 && <p className="empty-note">댓글이 없습니다.</p>}
        </div>
        <form className="inline-form" onSubmit={createComment}>
          <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="진행 메모" />
          <button>작성</button>
        </form>
      </section>
    </div>
  );
}

function Members({
  token,
  user,
  team,
  onChanged
}: {
  token: string;
  user: User;
  team: Team;
  onChanged: () => void;
}) {
  const members = team.members ?? [];
  const myRole = members.find((member) => member.userId === user.id)?.role;
  const isOwner = myRole === "OWNER";

  const regenerateInvite = async () => {
    await api<Team>(`/teams/${team.id}/invite-code`, token, { method: "PATCH" });
    onChanged();
  };

  const updateMember = async (member: TeamMember, role: "OWNER" | "MEMBER") => {
    const position = window.prompt("팀 내 직책", member.position ?? "") ?? member.position;
    const department = window.prompt("팀 내 파트", member.department ?? "") ?? member.department;
    await api<TeamMember>(`/teams/${team.id}/members/${member.id}/role`, token, {
      method: "PATCH",
      body: JSON.stringify({ role, position, department })
    });
    onChanged();
  };

  const removeMember = async (member: TeamMember) => {
    const verb = member.userId === user.id ? "탈퇴" : "제거";
    if (!window.confirm(`${member.user.name}님을 ${verb} 처리할까요?`)) {
      return;
    }
    await api<null>(`/teams/${team.id}/members/${member.id}`, token, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="members-grid">
      <section className="panel">
        <h2>팀원 목록</h2>
        <div className="member-list">
          {members.map((member) => (
            <div key={member.id} className="member-row">
              <div>
                <strong>{member.user.name}</strong>
                <span>{member.user.email}</span>
                <small>{member.position || "직책 미지정"} · {member.department || "파트 미지정"}</small>
              </div>
              <div className="member-actions">
                <span className={`role ${member.role.toLowerCase()}`}>{member.role}</span>
                {isOwner && (
                  <>
                    <button onClick={() => updateMember(member, member.role === "OWNER" ? "MEMBER" : "OWNER")}>
                      {member.role === "OWNER" ? "MEMBER로 변경" : "OWNER로 변경"}
                    </button>
                    <button className="danger" onClick={() => removeMember(member)}>제거</button>
                  </>
                )}
                {!isOwner && member.userId === user.id && (
                  <button className="danger" onClick={() => removeMember(member)}>탈퇴</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>초대 코드</h2>
        {isOwner ? (
          <>
            <div className="invite-code">{team.inviteCode}</div>
            <p>새 팀원은 이 코드를 입력해 직접 가입합니다.</p>
            <button onClick={regenerateInvite}>재발급</button>
          </>
        ) : (
          <p>초대 코드는 OWNER만 확인할 수 있습니다.</p>
        )}
      </section>
    </div>
  );
}

function Retrospectives({
  token,
  user,
  team,
  onChanged
}: {
  token: string;
  user: User;
  team: Team;
  onChanged: () => void;
}) {
  const retrospectives = team.retrospectives ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(retrospectives[0]?.id ?? null);
  const selected = retrospectives.find((retro) => retro.id === selectedId) ?? retrospectives[0] ?? null;

  useEffect(() => {
    if (retrospectives.length > 0 && !retrospectives.some((retro) => retro.id === selectedId)) {
      setSelectedId(retrospectives[0].id);
    }
  }, [retrospectives.length, team.id]);

  return (
    <div className="retro-layout">
      <section className="panel">
        <RetroCreateForm token={token} team={team} onCreated={onChanged} />
        <div className="retro-list">
          {retrospectives.map((retro) => (
            <button key={retro.id} className={selected?.id === retro.id ? "active" : ""} onClick={() => setSelectedId(retro.id)}>
              <strong>{retro.title}</strong>
              <span>{retro.sprintName || "스프린트 미지정"}</span>
            </button>
          ))}
          {retrospectives.length === 0 && <p className="empty-note">아직 회고가 없습니다.</p>}
        </div>
      </section>
      {selected ? (
        <RetroDetail token={token} user={user} team={team} retrospective={selected} onChanged={onChanged} />
      ) : (
        <EmptyState title="회고를 생성하세요." body="Keep, Problem, Try를 팀 단위로 기록합니다." />
      )}
    </div>
  );
}

function RetroCreateForm({ token, team, onCreated }: { token: string; team: Team; onCreated: () => void }) {
  const [title, setTitle] = useState("Day 3 중간 회고");
  const [sprintName, setSprintName] = useState("Sprint 1");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await api<Retrospective>(`/teams/${team.id}/retrospectives`, token, {
      method: "POST",
      body: JSON.stringify({ title, sprintName })
    });
    setTitle("");
    setSprintName("");
    onCreated();
  };

  return (
    <form className="stacked-form" onSubmit={submit}>
      <h2>회고 생성</h2>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="회고 제목" />
      <input value={sprintName} onChange={(event) => setSprintName(event.target.value)} placeholder="스프린트명" />
      <button className="primary">생성</button>
    </form>
  );
}

function RetroDetail({
  token,
  user,
  team,
  retrospective,
  onChanged
}: {
  token: string;
  user: User;
  team: Team;
  retrospective: Retrospective;
  onChanged: () => void;
}) {
  const myRole = team.members?.find((member) => member.userId === user.id)?.role;

  const createItem = async (type: RetroType) => {
    const content = window.prompt(`${retroLabels[type]} 항목을 입력하세요.`);
    if (!content) {
      return;
    }
    await api<RetroItem>(`/retrospectives/${retrospective.id}/items`, token, {
      method: "POST",
      body: JSON.stringify({ type, content })
    });
    onChanged();
  };

  const updateItem = async (item: RetroItem) => {
    const content = window.prompt("내용을 수정하세요.", item.content);
    if (!content) {
      return;
    }
    await api<RetroItem>(`/retro-items/${item.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ content })
    });
    onChanged();
  };

  const deleteItem = async (item: RetroItem) => {
    await api<null>(`/retro-items/${item.id}`, token, { method: "DELETE" });
    onChanged();
  };

  const deleteRetro = async () => {
    if (!window.confirm("회고 전체를 삭제할까요?")) {
      return;
    }
    await api<null>(`/retrospectives/${retrospective.id}`, token, { method: "DELETE" });
    onChanged();
  };

  return (
    <section className="retro-detail">
      <div className="section-head">
        <div>
          <h2>{retrospective.title}</h2>
          <p>{retrospective.sprintName || "스프린트 미지정"}</p>
        </div>
        {(retrospective.createdByUserId === user.id || myRole === "OWNER") && (
          <button className="danger" onClick={deleteRetro}>회고 삭제</button>
        )}
      </div>
      <div className="kpt-grid">
        {(Object.keys(retroLabels) as RetroType[]).map((type) => (
          <div key={type} className="kpt-column">
            <div className="section-head tight">
              <h3>{retroLabels[type]}</h3>
              <button onClick={() => createItem(type)}>추가</button>
            </div>
            {retrospective.items.filter((item) => item.type === type).map((item) => (
              <article key={item.id} className="kpt-card">
                <p>{item.content}</p>
                <small>{item.author.name}</small>
                <div className="button-row">
                  {item.authorUserId === user.id && <button onClick={() => updateItem(item)}>수정</button>}
                  {(item.authorUserId === user.id || myRole === "OWNER") && (
                    <button className="ghost" onClick={() => deleteItem(item)}>삭제</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange
}: {
  label: string;
  options: { id: number; label: string }[];
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  };

  return (
    <div className="checkbox-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <label key={option.id} className="check-pill">
            <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
            {option.label}
          </label>
        ))}
        {options.length === 0 && <p className="empty-note">팀원이 없습니다.</p>}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export default App;
