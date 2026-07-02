import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express, { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? "scrummate-local-dev-secret";
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ROLES = ["OWNER", "MEMBER"] as const;
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const RETRO_TYPES = ["KEEP", "PROBLEM", "TRY"] as const;

type Role = (typeof ROLES)[number];
type TaskStatus = (typeof TASK_STATUSES)[number];
type Priority = (typeof PRIORITIES)[number];
type RetroType = (typeof RETRO_TYPES)[number];

type AuthUser = {
  id: number;
  email: string;
  name: string;
};

type AuthRequest = Request & {
  user?: AuthUser;
};

class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function ok(res: Response, data: unknown = null, message = "ok", status = 200) {
  res.status(status).json({ success: true, data, message });
}

function fail(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message }
    });
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: z.prettifyError(error) }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "서버 오류가 발생했습니다." }
  });
}

function asyncHandler(fn: (req: AuthRequest, res: Response) => Promise<void>): RequestHandler {
  return (req, res) => {
    fn(req as AuthRequest, res).catch((error) => fail(res, error));
  };
}

function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch {
    fail(_res, new ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다."));
  }
}

function currentUser(req: AuthRequest): AuthUser {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }
  return req.user;
}

function parseId(value: unknown, name: string) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const id = Number(rawValue);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "INVALID_ID", `${name}가 올바르지 않습니다.`);
  }
  return id;
}

function toNullableDate(value: string | null | undefined) {
  if (value == null || value === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "INVALID_DATE", "날짜 형식이 올바르지 않습니다.");
  }
  return date;
}

function toRequiredDate(value: string | null | undefined, name: string) {
  const date = toNullableDate(value);
  if (!date) {
    throw new ApiError(400, "VALIDATION_ERROR", `${name}은 필수입니다.`);
  }
  return date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function signToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user: { id: number; email: string; name: string; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const existing = await prisma.team.findUnique({ where: { inviteCode: code } });
    if (!existing) {
      return code;
    }
  }

  throw new ApiError(500, "INVITE_CODE_GENERATION_FAILED", "초대 코드 생성에 실패했습니다.");
}

async function getMembershipOrThrow(teamId: number, userId: number) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { user: true, team: true }
  });

  if (!membership) {
    throw new ApiError(403, "FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
  }

  return membership;
}

async function requireOwner(teamId: number, userId: number) {
  const membership = await getMembershipOrThrow(teamId, userId);
  if (membership.role !== "OWNER") {
    throw new ApiError(403, "OWNER_ONLY", "팀장만 수행할 수 있습니다.");
  }
  return membership;
}

async function countOwners(teamId: number) {
  return prisma.teamMember.count({ where: { teamId, role: "OWNER" } });
}

async function getTaskOrThrow(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      team: true,
      assignees: { include: { user: true, assignedBy: true }, orderBy: { assignedAt: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      createdBy: true,
      updatedBy: true
    }
  });

  if (!task) {
    throw new ApiError(404, "TASK_NOT_FOUND", "태스크를 찾을 수 없습니다.");
  }

  return task;
}

async function getRetroOrThrow(retroId: number) {
  const retrospective = await prisma.retrospective.findUnique({
    where: { id: retroId },
    include: {
      team: true,
      createdBy: true,
      items: { include: { author: true }, orderBy: { createdAt: "asc" } }
    }
  });

  if (!retrospective) {
    throw new ApiError(404, "RETROSPECTIVE_NOT_FOUND", "회고를 찾을 수 없습니다.");
  }

  return retrospective;
}

async function assertAssigneesAreTeamMembers(teamId: number, assigneeIds: number[]) {
  const uniqueIds = [...new Set(assigneeIds)];
  if (uniqueIds.length === 0) {
    return uniqueIds;
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId, userId: { in: uniqueIds } },
    select: { userId: true }
  });

  if (members.length !== uniqueIds.length) {
    throw new ApiError(400, "ASSIGNEE_NOT_TEAM_MEMBER", "담당자는 모두 같은 팀의 멤버여야 합니다.");
  }

  return uniqueIds;
}

function validateStatus(status: string): TaskStatus {
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new ApiError(400, "INVALID_TASK_STATUS", "허용되지 않은 태스크 상태입니다.");
  }
  return status as TaskStatus;
}

function validatePriority(priority: string): Priority {
  if (!PRIORITIES.includes(priority as Priority)) {
    throw new ApiError(400, "INVALID_PRIORITY", "허용되지 않은 우선순위입니다.");
  }
  return priority as Priority;
}

function validateRole(role: string): Role {
  if (!ROLES.includes(role as Role)) {
    throw new ApiError(400, "INVALID_ROLE", "허용되지 않은 팀 역할입니다.");
  }
  return role as Role;
}

function validateRetroType(type: string): RetroType {
  if (!RETRO_TYPES.includes(type as RetroType)) {
    throw new ApiError(400, "INVALID_RETRO_TYPE", "허용되지 않은 KPT 타입입니다.");
  }
  return type as RetroType;
}

function taskInclude() {
  return {
    team: true,
    createdBy: true,
    updatedBy: true,
    assignees: { include: { user: true, assignedBy: true }, orderBy: { assignedAt: "asc" as const } },
    comments: { include: { user: true }, orderBy: { createdAt: "asc" as const } }
  };
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  ok(res, { service: "scrummate-api", time: new Date().toISOString() });
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수입니다."),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.")
});

app.post(
  "/api/auth/signup",
  asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash }
    });
    const authUser = publicUser(user);
    ok(res, { user: authUser, token: signToken(authUser) }, "created", 201);
  })
);

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1)
});

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const authUser = publicUser(user);
    ok(res, { user: authUser, token: signToken(authUser) });
  })
);

app.post("/api/auth/logout", requireAuth, asyncHandler(async (_req, res) => {
  ok(res, null, "logged out");
}));

app.get("/api/me", requireAuth, asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!freshUser) {
    throw new ApiError(401, "UNAUTHORIZED", "사용자를 찾을 수 없습니다.");
  }
  ok(res, publicUser(freshUser));
}));

app.get(
  "/api/teams",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
            tasks: true,
            retrospectives: true
          }
        }
      },
      orderBy: { joinedAt: "asc" }
    });

    ok(res, memberships.map((membership) => ({ ...membership.team, myRole: membership.role })));
  })
);

const teamSchema = z.object({
  name: z.string().trim().min(1, "팀 이름은 필수입니다."),
  description: z.string().trim().optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1)
});

app.post(
  "/api/teams",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = teamSchema.parse(req.body);
    const startDate = toRequiredDate(body.startDate, "시작일");
    const endDate = toRequiredDate(body.endDate, "종료일");

    if (endDate < startDate) {
      throw new ApiError(400, "INVALID_DATE_RANGE", "종료일은 시작일보다 빠를 수 없습니다.");
    }

    const inviteCode = await generateInviteCode();
    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: body.name,
          description: body.description || null,
          startDate,
          endDate,
          inviteCode,
          createdByUserId: user.id
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: createdTeam.id,
          userId: user.id,
          role: "OWNER",
          position: "팀장",
          department: null
        }
      });

      return createdTeam;
    });

    ok(res, team, "created", 201);
  })
);

app.get(
  "/api/teams/:teamId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
        tasks: { include: taskInclude(), orderBy: { createdAt: "desc" } },
        retrospectives: { include: { items: true }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!team) {
      throw new ApiError(404, "TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.");
    }
    ok(res, team);
  })
);

app.patch(
  "/api/teams/:teamId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await requireOwner(teamId, user.id);
    const body = teamSchema.partial().parse(req.body);

    const current = await prisma.team.findUnique({ where: { id: teamId } });
    if (!current) {
      throw new ApiError(404, "TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.");
    }

    const startDate = body.startDate === undefined ? current.startDate : toRequiredDate(body.startDate, "시작일");
    const endDate = body.endDate === undefined ? current.endDate : toRequiredDate(body.endDate, "종료일");
    if (endDate < startDate) {
      throw new ApiError(400, "INVALID_DATE_RANGE", "종료일은 시작일보다 빠를 수 없습니다.");
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: body.name ?? undefined,
        description: body.description === undefined ? undefined : body.description || null,
        startDate,
        endDate
      }
    });
    ok(res, team);
  })
);

app.delete(
  "/api/teams/:teamId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await requireOwner(teamId, user.id);
    await prisma.team.delete({ where: { id: teamId } });
    ok(res, null, "deleted");
  })
);

const joinSchema = z.object({ inviteCode: z.string().trim().min(1) });

app.post(
  "/api/teams/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = joinSchema.parse(req.body);
    const team = await prisma.team.findUnique({ where: { inviteCode: body.inviteCode.toUpperCase() } });
    if (!team) {
      throw new ApiError(404, "INVITE_CODE_NOT_FOUND", "초대 코드를 찾을 수 없습니다.");
    }

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: user.id } }
    });
    if (existing) {
      throw new ApiError(409, "ALREADY_TEAM_MEMBER", "이미 가입한 팀입니다.");
    }

    const membership = await prisma.teamMember.create({
      data: { teamId: team.id, userId: user.id, role: "MEMBER" },
      include: { team: true, user: true }
    });
    ok(res, membership, "joined", 201);
  })
);

app.patch(
  "/api/teams/:teamId/invite-code",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await requireOwner(teamId, user.id);
    const inviteCode = await generateInviteCode();
    const team = await prisma.team.update({ where: { id: teamId }, data: { inviteCode } });
    ok(res, team);
  })
);

app.get(
  "/api/teams/:teamId/members",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }]
    });
    ok(res, members);
  })
);

const memberUpdateSchema = z.object({
  role: z.string().optional(),
  position: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable()
});

app.patch(
  "/api/teams/:teamId/members/:memberId/role",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    const memberId = parseId(req.params.memberId, "memberId");
    await requireOwner(teamId, user.id);
    const body = memberUpdateSchema.parse(req.body);

    const target = await prisma.teamMember.findFirst({ where: { id: memberId, teamId } });
    if (!target) {
      throw new ApiError(400, "TARGET_NOT_TEAM_MEMBER", "대상이 팀 멤버가 아닙니다.");
    }

    const nextRole = body.role ? validateRole(body.role) : target.role;
    if (target.role === "OWNER" && nextRole !== "OWNER" && (await countOwners(teamId)) <= 1) {
      throw new ApiError(409, "LAST_OWNER_CANNOT_LEAVE", "마지막 팀장은 변경할 수 없습니다.");
    }

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: nextRole,
        position: body.position === undefined ? undefined : body.position || null,
        department: body.department === undefined ? undefined : body.department || null
      },
      include: { user: true }
    });
    ok(res, member);
  })
);

app.delete(
  "/api/teams/:teamId/members/:memberId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    const memberId = parseId(req.params.memberId, "memberId");
    const target = await prisma.teamMember.findFirst({ where: { id: memberId, teamId } });
    if (!target) {
      throw new ApiError(404, "TEAM_MEMBER_NOT_FOUND", "팀원을 찾을 수 없습니다.");
    }

    const selfDelete = target.userId === user.id;
    if (!selfDelete) {
      await requireOwner(teamId, user.id);
    } else {
      await getMembershipOrThrow(teamId, user.id);
    }

    if (target.role === "OWNER" && (await countOwners(teamId)) <= 1) {
      throw new ApiError(409, "LAST_OWNER_CANNOT_LEAVE", "마지막 팀장은 탈퇴하거나 제거할 수 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignee.deleteMany({
        where: { userId: target.userId, task: { teamId } }
      });
      await tx.teamMember.delete({ where: { id: memberId } });
    });

    ok(res, null, "removed");
  })
);

const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "제목은 필수입니다."),
  description: z.string().trim().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  blockedReason: z.string().trim().optional().nullable(),
  assigneeIds: z.array(z.number().int().positive()).optional()
});

app.get(
  "/api/teams/:teamId/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);

    const where: Record<string, unknown> = { teamId };
    if (typeof req.query.status === "string" && req.query.status) {
      where.status = validateStatus(req.query.status);
    }
    if (typeof req.query.assigneeId === "string" && req.query.assigneeId) {
      where.assignees = { some: { userId: parseId(req.query.assigneeId, "assigneeId") } };
    }
    if (req.query.due === "overdue") {
      where.status = { not: "DONE" };
      where.dueDate = { lt: new Date() };
    }
    if (req.query.due === "soon") {
      where.status = { not: "DONE" };
      where.dueDate = { gte: new Date(), lte: addDays(new Date(), 2) };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude(),
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
    });
    ok(res, tasks);
  })
);

app.post(
  "/api/teams/:teamId/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);
    const body = taskCreateSchema.parse(req.body);
    const status = body.status ? validateStatus(body.status) : "TODO";
    const priority = body.priority ? validatePriority(body.priority) : "MEDIUM";
    const dueDate = toNullableDate(body.dueDate);
    const blockedReason = body.blockedReason || null;

    if (status === "BLOCKED" && !blockedReason) {
      throw new ApiError(400, "BLOCKED_REASON_REQUIRED", "Blocked 상태에는 막힌 이유가 필요합니다.");
    }

    const assigneeIds = await assertAssigneesAreTeamMembers(teamId, body.assigneeIds ?? []);
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          teamId,
          title: body.title,
          description: body.description || null,
          status,
          priority,
          dueDate,
          blockedReason: status === "BLOCKED" ? blockedReason : null,
          createdByUserId: user.id,
          updatedByUserId: user.id
        }
      });

      if (assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneeIds.map((assigneeId) => ({
            taskId: created.id,
            userId: assigneeId,
            assignedByUserId: user.id
          }))
        });
      }

      return tx.task.findUniqueOrThrow({ where: { id: created.id }, include: taskInclude() });
    });

    ok(res, task, "created", 201);
  })
);

app.get(
  "/api/tasks/:taskId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    ok(res, task);
  })
);

const taskUpdateSchema = taskCreateSchema.partial().omit({ assigneeIds: true });

app.patch(
  "/api/tasks/:taskId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    const body = taskUpdateSchema.parse(req.body);

    const status = body.status ? validateStatus(body.status) : undefined;
    const priority = body.priority ? validatePriority(body.priority) : undefined;
    const blockedReason = body.blockedReason === undefined ? undefined : body.blockedReason || null;
    if (status === "BLOCKED" && !blockedReason && !task.blockedReason) {
      throw new ApiError(400, "BLOCKED_REASON_REQUIRED", "Blocked 상태에는 막힌 이유가 필요합니다.");
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title ?? undefined,
        description: body.description === undefined ? undefined : body.description || null,
        status,
        priority,
        dueDate: body.dueDate === undefined ? undefined : toNullableDate(body.dueDate),
        blockedReason: status && status !== "BLOCKED" ? null : blockedReason,
        updatedByUserId: user.id
      },
      include: taskInclude()
    });
    ok(res, updated);
  })
);

const statusSchema = z.object({
  status: z.string(),
  blockedReason: z.string().trim().optional().nullable()
});

app.patch(
  "/api/tasks/:taskId/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    const body = statusSchema.parse(req.body);
    const status = validateStatus(body.status);

    if (status === "BLOCKED" && !body.blockedReason) {
      throw new ApiError(400, "BLOCKED_REASON_REQUIRED", "Blocked 상태에는 막힌 이유가 필요합니다.");
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        blockedReason: status === "BLOCKED" ? body.blockedReason : null,
        updatedByUserId: user.id
      },
      include: taskInclude()
    });
    ok(res, updated);
  })
);

const assigneeSchema = z.object({ assigneeIds: z.array(z.number().int().positive()) });

app.patch(
  "/api/tasks/:taskId/assignees",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    const body = assigneeSchema.parse(req.body);
    const assigneeIds = await assertAssigneesAreTeamMembers(task.teamId, body.assigneeIds);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.taskAssignee.deleteMany({ where: { taskId } });
      if (assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneeIds.map((assigneeId) => ({
            taskId,
            userId: assigneeId,
            assignedByUserId: user.id
          }))
        });
      }
      await tx.task.update({ where: { id: taskId }, data: { updatedByUserId: user.id } });
      return tx.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude() });
    });

    ok(res, updated);
  })
);

app.delete(
  "/api/tasks/:taskId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    const membership = await getMembershipOrThrow(task.teamId, user.id);
    if (task.createdByUserId !== user.id && membership.role !== "OWNER") {
      throw new ApiError(403, "FORBIDDEN", "작성자 또는 팀장만 삭제할 수 있습니다.");
    }
    await prisma.task.delete({ where: { id: taskId } });
    ok(res, null, "deleted");
  })
);

app.get(
  "/api/tasks/:taskId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: { user: true },
      orderBy: { createdAt: "asc" }
    });
    ok(res, comments);
  })
);

const commentSchema = z.object({ content: z.string().trim().min(1, "댓글 내용은 필수입니다.") });

app.post(
  "/api/tasks/:taskId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const taskId = parseId(req.params.taskId, "taskId");
    const task = await getTaskOrThrow(taskId);
    await getMembershipOrThrow(task.teamId, user.id);
    const body = commentSchema.parse(req.body);
    const comment = await prisma.taskComment.create({
      data: { taskId, userId: user.id, content: body.content },
      include: { user: true }
    });
    ok(res, comment, "created", 201);
  })
);

app.patch(
  "/api/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const commentId = parseId(req.params.commentId, "commentId");
    const body = commentSchema.parse(req.body);
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true }
    });
    if (!comment) {
      throw new ApiError(404, "COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다.");
    }
    await getMembershipOrThrow(comment.task.teamId, user.id);
    if (comment.userId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "작성자만 수정할 수 있습니다.");
    }
    const updated = await prisma.taskComment.update({
      where: { id: commentId },
      data: { content: body.content },
      include: { user: true }
    });
    ok(res, updated);
  })
);

app.delete(
  "/api/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const commentId = parseId(req.params.commentId, "commentId");
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true }
    });
    if (!comment) {
      throw new ApiError(404, "COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다.");
    }
    const membership = await getMembershipOrThrow(comment.task.teamId, user.id);
    if (comment.userId !== user.id && membership.role !== "OWNER") {
      throw new ApiError(403, "FORBIDDEN", "작성자 또는 팀장만 삭제할 수 있습니다.");
    }
    await prisma.taskComment.delete({ where: { id: commentId } });
    ok(res, null, "deleted");
  })
);

const retroSchema = z.object({
  title: z.string().trim().min(1, "회고 제목은 필수입니다."),
  sprintName: z.string().trim().optional().nullable()
});

app.get(
  "/api/teams/:teamId/retrospectives",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);
    const retrospectives = await prisma.retrospective.findMany({
      where: { teamId },
      include: { createdBy: true, items: { include: { author: true } } },
      orderBy: { createdAt: "desc" }
    });
    ok(res, retrospectives);
  })
);

app.post(
  "/api/teams/:teamId/retrospectives",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const teamId = parseId(req.params.teamId, "teamId");
    await getMembershipOrThrow(teamId, user.id);
    const body = retroSchema.parse(req.body);
    const retrospective = await prisma.retrospective.create({
      data: {
        teamId,
        title: body.title,
        sprintName: body.sprintName || null,
        createdByUserId: user.id
      },
      include: { createdBy: true, items: { include: { author: true } } }
    });
    ok(res, retrospective, "created", 201);
  })
);

app.get(
  "/api/retrospectives/:retroId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const retroId = parseId(req.params.retroId, "retroId");
    const retrospective = await getRetroOrThrow(retroId);
    await getMembershipOrThrow(retrospective.teamId, user.id);
    ok(res, retrospective);
  })
);

app.patch(
  "/api/retrospectives/:retroId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const retroId = parseId(req.params.retroId, "retroId");
    const current = await getRetroOrThrow(retroId);
    await getMembershipOrThrow(current.teamId, user.id);
    const body = retroSchema.partial().parse(req.body);
    const retrospective = await prisma.retrospective.update({
      where: { id: retroId },
      data: {
        title: body.title ?? undefined,
        sprintName: body.sprintName === undefined ? undefined : body.sprintName || null
      },
      include: { createdBy: true, items: { include: { author: true } } }
    });
    ok(res, retrospective);
  })
);

app.delete(
  "/api/retrospectives/:retroId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const retroId = parseId(req.params.retroId, "retroId");
    const current = await getRetroOrThrow(retroId);
    const membership = await getMembershipOrThrow(current.teamId, user.id);
    if (current.createdByUserId !== user.id && membership.role !== "OWNER") {
      throw new ApiError(403, "FORBIDDEN", "작성자 또는 팀장만 삭제할 수 있습니다.");
    }
    await prisma.retrospective.delete({ where: { id: retroId } });
    ok(res, null, "deleted");
  })
);

const retroItemSchema = z.object({
  type: z.string(),
  content: z.string().trim().min(1, "KPT 내용은 필수입니다.")
});

app.post(
  "/api/retrospectives/:retroId/items",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const retroId = parseId(req.params.retroId, "retroId");
    const retrospective = await getRetroOrThrow(retroId);
    await getMembershipOrThrow(retrospective.teamId, user.id);
    const body = retroItemSchema.parse(req.body);
    const type = validateRetroType(body.type);
    const item = await prisma.retroItem.create({
      data: { retrospectiveId: retroId, type, content: body.content, authorUserId: user.id },
      include: { author: true }
    });
    ok(res, item, "created", 201);
  })
);

app.patch(
  "/api/retro-items/:itemId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const itemId = parseId(req.params.itemId, "itemId");
    const body = retroItemSchema.partial().parse(req.body);
    const item = await prisma.retroItem.findUnique({
      where: { id: itemId },
      include: { retrospective: true }
    });
    if (!item) {
      throw new ApiError(404, "RETRO_ITEM_NOT_FOUND", "회고 항목을 찾을 수 없습니다.");
    }
    await getMembershipOrThrow(item.retrospective.teamId, user.id);
    if (item.authorUserId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "작성자만 수정할 수 있습니다.");
    }
    const updated = await prisma.retroItem.update({
      where: { id: itemId },
      data: {
        type: body.type ? validateRetroType(body.type) : undefined,
        content: body.content ?? undefined
      },
      include: { author: true }
    });
    ok(res, updated);
  })
);

app.delete(
  "/api/retro-items/:itemId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const itemId = parseId(req.params.itemId, "itemId");
    const item = await prisma.retroItem.findUnique({
      where: { id: itemId },
      include: { retrospective: true }
    });
    if (!item) {
      throw new ApiError(404, "RETRO_ITEM_NOT_FOUND", "회고 항목을 찾을 수 없습니다.");
    }
    const membership = await getMembershipOrThrow(item.retrospective.teamId, user.id);
    if (item.authorUserId !== user.id && membership.role !== "OWNER") {
      throw new ApiError(403, "FORBIDDEN", "작성자 또는 팀장만 삭제할 수 있습니다.");
    }
    await prisma.retroItem.delete({ where: { id: itemId } });
    ok(res, null, "deleted");
  })
);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "API를 찾을 수 없습니다." } });
});

app.listen(PORT, () => {
  console.log(`ScrumMate API listening on http://localhost:${PORT}`);
});
