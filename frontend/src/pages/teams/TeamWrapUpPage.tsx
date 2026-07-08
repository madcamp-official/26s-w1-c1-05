import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import * as meetingApi from '../../api/meetingApi';
import * as retrospectiveApi from '../../api/retrospectiveApi';
import { Alert, Avatar, Badge, Button, Card, LoadingState, StatTile } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { Task } from '../../types/task';
import type { Meeting } from '../../types/meeting';
import type { Retrospective } from '../../types/retrospective';
import type { TeamDetail, TeamLeaderboardRow, TeamMember } from '../../types/team';

const LEAF_GREENS = ['oklch(0.72 0.11 138)', 'oklch(0.62 0.13 145)', 'oklch(0.5 0.12 150)', 'oklch(0.62 0.13 145)', 'oklch(0.76 0.1 132)'];

export function TeamWrapUpPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [retros, setRetros] = useState<Retrospective[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamLeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [arriving, setArriving] = useState(() => sessionStorage.getItem('wrapup-arrival') === '1');
  // Arriving from the dashboard's "End project" button plays the animated intro;
  // opening the sidebar Wrap-up tab goes straight to the clean report.
  const [mode, setMode] = useState<'intro' | 'static'>(() =>
    sessionStorage.getItem('wrapup-arrival') === '1' ? 'intro' : 'static',
  );
  const [step, setStep] = useState(0);
  const lastNavRef = useRef(0);

  useEffect(() => {
    async function loadPage() {
      if (!Number.isFinite(numericTeamId)) {
        setErrorMessage('Invalid team.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [teamData, memberData, taskData, meetingData, retroData, leaderboardData] = await Promise.all([
          teamApi.getTeam(numericTeamId),
          teamApi.getMembers(numericTeamId).catch(() => []),
          taskApi.getTasks(numericTeamId),
          meetingApi.getMeetings(numericTeamId),
          retrospectiveApi.getRetrospectives(numericTeamId),
          teamApi.getLeaderboard(numericTeamId).catch(() => []),
        ]);
        setTeam(teamData);
        setMembers(memberData);
        setTasks(taskData);
        setMeetings(meetingData);
        setRetros(retroData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the wrap-up report.');
      } finally {
        setIsLoading(false);
      }
    }
    void loadPage();
  }, [numericTeamId]);

  useEffect(() => {
    if (!arriving) {
      return;
    }
    sessionStorage.removeItem('wrapup-arrival');
    const id = window.setTimeout(() => setArriving(false), 800);
    return () => window.clearTimeout(id);
  }, [arriving]);

  const stats = useMemo(() => computeWrapStats(tasks, meetings, retros, leaderboard), [tasks, meetings, retros, leaderboard]);

  const cards = useMemo(
    () => buildCards(stats, members.map((m) => m.user.name), leaderboard),
    [stats, members, leaderboard],
  );

  const stepCount = cards.length + 2; // hero + cards + outro

  const stepBy = useCallback(
    (dir: number) => {
      setStep((current) => Math.max(0, Math.min(stepCount - 1, current + dir)));
    },
    [stepCount],
  );

  useEffect(() => {
    if (mode !== 'intro' || isLoading) {
      return;
    }
    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) < 10) return;
      const now = Date.now();
      if (now - lastNavRef.current < 650) return;
      lastNavRef.current = now;
      stepBy(event.deltaY > 0 ? 1 : -1);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        stepBy(1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        stepBy(-1);
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [mode, isLoading, stepBy]);

  if (isLoading) {
    return <LoadingState label="Preparing the wrap-up…" />;
  }

  const memberCount = members.length;

  const hero = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
      <LeafRow size="lg" />
      <span className="eyebrow">{stats.dateRangeLabel}</span>
      <h1 style={{ margin: 0, fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', maxWidth: 660, textWrap: 'balance' }}>
        That's a wrap, team — {team?.name ?? 'the project'} is complete!
      </h1>
      <p style={{ margin: 0, fontSize: 16, color: 'var(--gray-600)', maxWidth: 460 }}>
        {memberCount} of you turned {stats.tasksCompleted} tasks, {stats.meetingsHeld} meetings, and {stats.commentsWritten} comments
        into a finished project. Scroll to relive it, one moment at a time.
      </p>
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--gray-500)' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>SCROLL OR PRESS ↓</span>
        <ArrowDown size={18} className="wrap-scroll-cue" aria-hidden="true" />
      </div>
    </div>
  );

  const outro = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--gray-600)' }}>See you next sprint, team.</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="sm" onClick={() => setMode('static')}>
          View full report
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/teams/${numericTeamId}`)}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {arriving && <div className="wrap-arrival-overlay" ref={wipeOutOnMount} />}
      <Alert message={errorMessage} />

      {mode === 'intro' ? (
        <div className="wrap-intro-stage">
          {[hero, ...cards.map((card) => card.body), outro].map((content, index) => (
            <div
              className={`wrap-step${index === step ? ' wrap-focus' : ''}${index < step ? ' wrap-passed' : ''}`}
              key={index}
            >
              {content}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="page-header">
            <div>
              <LeafRow size="sm" />
              <h1 className="page-title" style={{ marginTop: 8 }}>
                That's a wrap, team — {team?.name ?? 'the project'} is complete.
              </h1>
              <p className="page-subtitle">
                {stats.dateRangeLabel} · {stats.tasksCompleted} tasks · {memberCount} members
              </p>
            </div>
            <div className="board-toolbar">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/teams/${numericTeamId}`)}>
                ← Back to dashboard
              </Button>
            </div>
          </div>

          <div className="wrapup-grid">
            {cards.map((card) => (
              <div className={card.span} key={card.key}>
                {card.body}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* The arrival overlay starts as solid green (continuing the dashboard's circle
   wipe) and shrinks back into a disappearing circle, revealing the wrap-up. */
function wipeOutOnMount(el: HTMLDivElement | null) {
  if (!el) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.clipPath = 'circle(0% at 50% 50%)';
  }));
}

function LeafRow({ size }: { size: 'sm' | 'lg' }) {
  const dims = size === 'lg' ? [13, 17, 22, 17, 13] : [12, 10, 12];
  const rots = size === 'lg' ? [-38, 14, -10, 40, 70] : [-24, 18, 52];
  return (
    <div className="wrap-leaf-row" aria-hidden="true" style={size === 'lg' ? { marginBottom: 6 } : { gap: 5 }}>
      {dims.map((d, i) => (
        <span className="wrap-leaf" style={{ width: d, height: d, background: LEAF_GREENS[i % LEAF_GREENS.length], transform: `rotate(${rots[i]}deg)` }} key={i} />
      ))}
    </div>
  );
}

type WrapCard = { key: string; span: string; body: ReactNode };

type WrapStats = ReturnType<typeof computeWrapStats>;

function computeWrapStats(tasks: Task[], meetings: Meeting[], retros: Retrospective[], leaderboard: TeamLeaderboardRow[]) {
  const doneTasks = tasks.filter((task) => task.status === 'DONE');
  const commentsWritten = tasks.reduce((sum, task) => sum + task.commentCount, 0);

  const allDates = [
    ...tasks.map((t) => t.createdAt),
    ...meetings.map((m) => m.meetingAt),
    ...retros.map((r) => r.createdAt),
  ].filter(Boolean).sort();
  const dateRangeLabel = allDates.length
    ? `${formatDay(allDates[0])} – ${formatDay(allDates[allDates.length - 1])}`
    : 'This sprint';

  // Most active day: tasks completed (by last update), meetings, and retros per calendar day.
  const byDay = new Map<string, { tasks: number; meetings: number; retros: number }>();
  const bump = (iso: string, field: 'tasks' | 'meetings' | 'retros') => {
    const day = iso.slice(0, 10);
    const row = byDay.get(day) ?? { tasks: 0, meetings: 0, retros: 0 };
    row[field] += 1;
    byDay.set(day, row);
  };
  doneTasks.forEach((t) => bump(t.updatedAt, 'tasks'));
  meetings.forEach((m) => bump(m.meetingAt, 'meetings'));
  retros.forEach((r) => bump(r.createdAt, 'retros'));
  let mostActiveDay: { day: string; score: number; tasks: number; meetings: number; retros: number } | null = null;
  for (const [day, row] of byDay) {
    const score = row.tasks * 5 + row.meetings * 3 + row.retros * 2;
    if (!mostActiveDay || score > mostActiveDay.score) {
      mostActiveDay = { day, score, ...row };
    }
  }

  // Top contributor + playful titles.
  const topContributor = leaderboard[0] ?? null;
  const createdCounts = countBy(tasks.map((t) => t.createdBy.name));
  const retroCounts = countBy(retros.map((r) => r.author.name));
  const mostCreated = maxEntry(createdCounts);
  const mostRetros = maxEntry(retroCounts);

  // Longest retrospective / meeting by content length.
  const longestRetro = retros
    .map((r) => ({ retro: r, length: (r.yesterdayWork ?? '').length + (r.todayPlan ?? '').length + (r.note ?? '').length }))
    .sort((a, b) => b.length - a.length)[0] ?? null;
  const longestMeeting = meetings
    .map((m) => ({ meeting: m, length: (m.rawContent ?? '').length }))
    .sort((a, b) => b.length - a.length)[0] ?? null;

  // Team chemistry: pairs sharing tasks (weight 3) and retros (weight 2).
  const pairs = new Map<string, { a: string; b: string; tasks: number; retros: number }>();
  const addPair = (a: string, b: string, field: 'tasks' | 'retros') => {
    const [x, y] = [a, b].sort();
    const key = `${x}|${y}`;
    const row = pairs.get(key) ?? { a: x, b: y, tasks: 0, retros: 0 };
    row[field] += 1;
    pairs.set(key, row);
  };
  for (const task of tasks) {
    const names = task.assignees.map((u) => u.name);
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) addPair(names[i], names[j], 'tasks');
  }
  for (const retro of retros) {
    const names = [retro.author.name, ...retro.collaborators.map((u) => u.name)];
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) addPair(names[i], names[j], 'retros');
  }
  const chemistry = [...pairs.values()]
    .map((p) => ({ ...p, score: p.tasks * 3 + p.retros * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    tasksCompleted: doneTasks.length,
    meetingsHeld: meetings.length,
    commentsWritten,
    retroEntries: retros.length,
    dateRangeLabel,
    mostActiveDay,
    topContributor,
    mostCreated,
    mostRetros,
    longestRetro,
    longestMeeting,
    chemistry,
  };
}

function buildCards(stats: WrapStats, memberNames: string[], leaderboard: TeamLeaderboardRow[]): WrapCard[] {
  const cards: WrapCard[] = [];

  cards.push({
    key: 'summary',
    span: 'wrap-col-full',
    body: (
      <Card>
        <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Sprint summary</span>
        <p style={{ margin: '0 0 18px', maxWidth: 640, color: 'var(--gray-600)' }}>
          This project ran from <strong style={{ color: 'var(--ink)' }}>{stats.dateRangeLabel}</strong>. A total of{' '}
          <strong style={{ color: 'var(--ink)' }}>{stats.tasksCompleted} tasks</strong> were completed.
          {memberNames.length > 0 && (
            <> This project was created by <strong style={{ color: 'var(--ink)' }}>{listNames(memberNames)}</strong>.</>
          )}
        </p>
        <div className="kpi-row" style={{ marginBottom: 0 }}>
          <StatTile label="Tasks completed" value={stats.tasksCompleted} valueColor="oklch(0.5 0.12 148)" />
          <StatTile label="Meetings held" value={stats.meetingsHeld} />
          <StatTile label="Comments written" value={stats.commentsWritten} />
          <StatTile label="Retro entries" value={stats.retroEntries} />
        </div>
      </Card>
    ),
  });

  if (stats.mostActiveDay) {
    const d = stats.mostActiveDay;
    cards.push({
      key: 'active-day',
      span: 'wrap-col-7',
      body: (
        <Card>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Most active day</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>{formatDay(d.day)}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--gray-500)' }}>activity score {d.score}</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--gray-600)' }}>Peak momentum for the team.</p>
          <div style={{ display: 'grid' }}>
            <div className="wrap-stat-row"><span>Tasks completed</span><span className="mono" style={{ fontSize: 13 }}>{d.tasks}</span></div>
            <div className="wrap-stat-row"><span>Meetings held</span><span className="mono" style={{ fontSize: 13 }}>{d.meetings}</span></div>
            <div className="wrap-stat-row"><span>Retros written</span><span className="mono" style={{ fontSize: 13 }}>{d.retros}</span></div>
          </div>
          <p className="wrap-note">Scored from weighted collaboration activity, not logins.</p>
        </Card>
      ),
    });
  }

  if (stats.topContributor) {
    const top = stats.topContributor;
    cards.push({
      key: 'top-contributor',
      span: 'wrap-col-5',
      body: (
        <Card>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>Top contributor</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <Avatar name={top.user.name} size="lg" />
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{top.user.name}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {top.completedTaskCount} tasks · {top.points} points
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge variant="solid">TASK REAPER</Badge>
              <span style={{ fontSize: 13.5, color: 'var(--gray-600)' }}>
                {firstName(top.user.name)} — most tasks completed ({top.completedTaskCount})
              </span>
            </div>
            {stats.mostCreated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="outline">TASK SUMMONER</Badge>
                <span style={{ fontSize: 13.5, color: 'var(--gray-600)' }}>
                  {firstName(stats.mostCreated[0])} — most tasks created ({stats.mostCreated[1]})
                </span>
              </div>
            )}
            {stats.mostRetros && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="outline">RETRO SCRIBE</Badge>
                <span style={{ fontSize: 13.5, color: 'var(--gray-600)' }}>
                  {firstName(stats.mostRetros[0])} — most retros written ({stats.mostRetros[1]})
                </span>
              </div>
            )}
          </div>
          {leaderboard.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: 'var(--border-hairline)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                Final leaderboard
              </span>
              <div style={{ display: 'grid', gap: 10 }}>
                {leaderboard.slice(0, 5).map((row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} key={row.user.id}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        width: 22,
                        fontWeight: row.rank === 1 ? 600 : 400,
                        color: row.rank === 1 ? 'oklch(0.5 0.12 148)' : 'var(--gray-500)',
                      }}
                    >
                      #{row.rank}
                    </span>
                    <Avatar name={row.user.name} size="sm" />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: row.rank === 1 ? 600 : 400 }}>
                      {firstName(row.user.name)}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {row.completedTaskCount} tasks · {row.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ),
    });
  }

  if (stats.longestRetro && stats.longestRetro.length > 0) {
    const { retro, length } = stats.longestRetro;
    cards.push({
      key: 'longest-retro',
      span: 'wrap-col-5',
      body: (
        <Card>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Longest retrospective</span>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>{formatDay(retro.createdAt)}</div>
          <p style={{ margin: '0 0 12px', color: 'var(--gray-600)' }}>
            <strong style={{ color: 'var(--ink)' }}>{length.toLocaleString()} characters</strong> of retrospective were written in
            "{retro.title}", with <strong style={{ color: 'var(--ink)' }}>{1 + retro.collaborators.length}</strong> team member
            {retro.collaborators.length > 0 ? 's' : ''} participating.
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--gray-600)', fontStyle: 'italic' }}>Everyone had thoughts that day.</p>
        </Card>
      ),
    });
  }

  if (stats.longestMeeting && stats.longestMeeting.length > 0) {
    const { meeting, length } = stats.longestMeeting;
    cards.push({
      key: 'longest-meeting',
      span: 'wrap-col-7',
      body: (
        <Card>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Longest meeting</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>{formatDay(meeting.meetingAt)}</span>
            <span style={{ fontSize: 15, color: 'var(--gray-600)' }}>{meeting.title}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--gray-500)' }}>{length.toLocaleString()} chars of transcript</span>
          </div>
          <p style={{ margin: '0 0 12px', color: 'var(--gray-600)', maxWidth: 560 }}>
            {meeting.summary ? excerpt(meeting.summary, 220) : excerpt(meeting.rawContent ?? '', 220)}
          </p>
          {meeting.summary && <p className="wrap-note" style={{ margin: 0 }}>Summary generated from the meeting transcript.</p>}
        </Card>
      ),
    });
  }

  if (stats.chemistry.length > 0) {
    const best = stats.chemistry[0];
    cards.push({
      key: 'chemistry',
      span: 'wrap-col-full',
      body: (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <span className="eyebrow">Team chemistry</span>
            <Badge variant="solid">
              BEST DUO: {firstName(best.a).toUpperCase()} × {firstName(best.b).toUpperCase()}
            </Badge>
          </div>
          <p style={{ margin: '0 0 20px', color: 'var(--gray-600)', maxWidth: 640 }}>
            <strong style={{ color: 'var(--ink)' }}>{firstName(best.a)} and {firstName(best.b)}</strong> worked together on{' '}
            <strong style={{ color: 'var(--ink)' }}>{best.tasks} tasks</strong> and jointly participated in{' '}
            <strong style={{ color: 'var(--ink)' }}>{best.retros} retrospectives</strong> — the strongest collaboration this sprint.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {stats.chemistry.map((pair, index) => (
              <div className="wrap-pair-card" key={`${pair.a}|${pair.b}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={pair.a} size="sm" />
                    <Avatar name={pair.b} size="sm" />
                  </div>
                  <span
                    className="mono"
                    style={{ fontSize: 12, color: index === 0 ? 'oklch(0.5 0.12 148)' : 'var(--gray-500)', fontWeight: index === 0 ? 600 : 400 }}
                  >
                    #{index + 1} · {pair.score}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{firstName(pair.a)} + {firstName(pair.b)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>
                  {pair.tasks} tasks together · {pair.retros} shared retros
                </div>
              </div>
            ))}
          </div>
        </Card>
      ),
    });
  }

  return cards;
}

function countBy(names: string[]) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return counts;
}

function maxEntry(counts: Map<string, number>): [string, number] | null {
  let best: [string, number] | null = null;
  for (const entry of counts) {
    if (!best || entry[1] > best[1]) best = entry;
  }
  return best;
}

function listNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function firstName(name: string) {
  return name.split(' ')[0];
}

function formatDay(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function excerpt(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
