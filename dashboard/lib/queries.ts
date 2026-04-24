import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

export type SkillListRow = {
  name: string;
  latestIterationNumber: number | null;
  latestPassRate: number | null;
  iterationsCount: number;
  updatedAt: Date;
};

export async function listSkills(): Promise<SkillListRow[]> {
  const rows = await db
    .select({
      name: schema.skills.name,
      latestIterationNumber: schema.skills.latestIterationNumber,
      latestPassRate: schema.skills.latestPassRate,
      updatedAt: schema.skills.updatedAt,
      iterationsCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${schema.iterations}
        WHERE ${schema.iterations.skillId} = ${schema.skills.id}
      )`,
    })
    .from(schema.skills)
    .orderBy(desc(schema.skills.updatedAt));

  return rows.map((r) => ({
    name: r.name,
    latestIterationNumber: r.latestIterationNumber,
    latestPassRate: r.latestPassRate === null ? null : Number(r.latestPassRate),
    iterationsCount: r.iterationsCount,
    updatedAt: r.updatedAt,
  }));
}

export type PortfolioStats = {
  skillsCount: number;
  iterationsCount: number;
  runsCount: number;
  latestUpload: Date | null;
};

export async function getPortfolioStats(): Promise<PortfolioStats> {
  const [row] = await db.execute<{
    skills_count: number;
    iterations_count: number;
    runs_count: number;
    latest_upload: Date | null;
  }>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM ${schema.skills}) AS skills_count,
      (SELECT COUNT(*)::int FROM ${schema.iterations}) AS iterations_count,
      (SELECT COUNT(*)::int FROM ${schema.runs}) AS runs_count,
      (SELECT MAX(${schema.iterations.uploadedAt}) FROM ${schema.iterations}) AS latest_upload
  `);
  return {
    skillsCount: row.skills_count,
    iterationsCount: row.iterations_count,
    runsCount: row.runs_count,
    latestUpload: row.latest_upload,
  };
}

export type IterationPoint = {
  iterationNumber: number;
  withSkillMean: number | null;
  withSkillStddev: number | null;
  withoutSkillMean: number | null;
  withoutSkillStddev: number | null;
  withSkillTokensMean: number | null;
  withSkillTimeSecondsMean: number | null;
  withoutSkillTokensMean: number | null;
  withoutSkillTimeSecondsMean: number | null;
  runsPerConfiguration: number | null;
  evalsCount: number | null;
  gitCommitSha: string | null;
  hostname: string | null;
  uploadedAt: Date;
};

export type SkillTrajectory = {
  name: string;
  createdAt: Date;
  updatedAt: Date;
  latestIterationNumber: number | null;
  latestPassRate: number | null;
  points: IterationPoint[];
};

export async function getSkillTrajectory(
  name: string,
): Promise<SkillTrajectory | null> {
  const [skill] = await db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.name, name))
    .limit(1);
  if (!skill) return null;

  const iters = await db
    .select()
    .from(schema.iterations)
    .where(eq(schema.iterations.skillId, skill.id))
    .orderBy(asc(schema.iterations.iterationNumber));

  const toNum = (v: string | null) => (v === null ? null : Number(v));

  return {
    name: skill.name,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    latestIterationNumber: skill.latestIterationNumber,
    latestPassRate: toNum(skill.latestPassRate),
    points: iters.map((it) => ({
      iterationNumber: it.iterationNumber,
      withSkillMean: toNum(it.withSkillPassRateMean),
      withSkillStddev: toNum(it.withSkillPassRateStddev),
      withoutSkillMean: toNum(it.withoutSkillPassRateMean),
      withoutSkillStddev: toNum(it.withoutSkillPassRateStddev),
      withSkillTokensMean: it.withSkillTokensMean,
      withSkillTimeSecondsMean: it.withSkillTimeSecondsMean,
      withoutSkillTokensMean: it.withoutSkillTokensMean,
      withoutSkillTimeSecondsMean: it.withoutSkillTimeSecondsMean,
      runsPerConfiguration: it.runsPerConfiguration,
      evalsCount: it.evalsCount,
      gitCommitSha: it.gitCommitSha,
      hostname: it.hostname,
      uploadedAt: it.uploadedAt,
    })),
  };
}

export type RunRow = {
  id: number;
  evalId: number;
  evalName: string | null;
  configuration: "with_skill" | "without_skill";
  runNumber: number;
  passRate: number | null;
  passed: number | null;
  total: number | null;
  timeSeconds: number | null;
  tokens: number | null;
  toolCalls: number | null;
  errors: number | null;
  notes: string[] | null;
};

export type IterationDetail = {
  skillName: string;
  iterationNumber: number;
  withSkillMean: number | null;
  withSkillStddev: number | null;
  withoutSkillMean: number | null;
  withoutSkillStddev: number | null;
  withSkillTokensMean: number | null;
  withSkillTimeSecondsMean: number | null;
  withoutSkillTokensMean: number | null;
  withoutSkillTimeSecondsMean: number | null;
  runsPerConfiguration: number | null;
  evalsCount: number | null;
  notes: string[] | null;
  skillMdSnapshot: string | null;
  gitCommitSha: string | null;
  hostname: string | null;
  uploadedAt: Date;
  runs: RunRow[];
};

export async function getIterationDetail(
  name: string,
  iterationNumber: number,
): Promise<IterationDetail | null> {
  const [skill] = await db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.name, name))
    .limit(1);
  if (!skill) return null;

  const [iter] = await db
    .select()
    .from(schema.iterations)
    .where(
      and(
        eq(schema.iterations.skillId, skill.id),
        eq(schema.iterations.iterationNumber, iterationNumber),
      ),
    )
    .limit(1);
  if (!iter) return null;

  const runs = await db
    .select()
    .from(schema.runs)
    .where(eq(schema.runs.iterationId, iter.id))
    .orderBy(
      asc(schema.runs.evalId),
      asc(schema.runs.configuration),
      asc(schema.runs.runNumber),
    );

  const toNum = (v: string | null) => (v === null ? null : Number(v));

  return {
    skillName: skill.name,
    iterationNumber: iter.iterationNumber,
    withSkillMean: toNum(iter.withSkillPassRateMean),
    withSkillStddev: toNum(iter.withSkillPassRateStddev),
    withoutSkillMean: toNum(iter.withoutSkillPassRateMean),
    withoutSkillStddev: toNum(iter.withoutSkillPassRateStddev),
    withSkillTokensMean: iter.withSkillTokensMean,
    withSkillTimeSecondsMean: iter.withSkillTimeSecondsMean,
    withoutSkillTokensMean: iter.withoutSkillTokensMean,
    withoutSkillTimeSecondsMean: iter.withoutSkillTimeSecondsMean,
    runsPerConfiguration: iter.runsPerConfiguration,
    evalsCount: iter.evalsCount,
    notes: iter.notes,
    skillMdSnapshot: iter.skillMdSnapshot,
    gitCommitSha: iter.gitCommitSha,
    hostname: iter.hostname,
    uploadedAt: iter.uploadedAt,
    runs: runs.map((r) => ({
      id: r.id,
      evalId: r.evalId,
      evalName: r.evalName,
      configuration: r.configuration,
      runNumber: r.runNumber,
      passRate: toNum(r.passRate),
      passed: r.passed,
      total: r.total,
      timeSeconds: r.timeSeconds,
      tokens: r.tokens,
      toolCalls: r.toolCalls,
      errors: r.errors,
      notes: r.notes,
    })),
  };
}
