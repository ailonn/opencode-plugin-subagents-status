import type { SubagentRaw } from "../domain/subagent-status.js"

/** Minimal structural shape of an OpenCode `SessionInfo` (OpenAPI). */
export interface SessionInfoLike {
  id: string
  parentID?: string
  agent?: string
  title?: string
  time?: { created?: number; idle?: number }
  outcome?: "succeeded" | "failed" | "interrupted"
}

/**
 * Children of a session, mapped to the domain shape.
 * `type` = the child's agent, `description` = its title, `startedAt` = creation time.
 */
export function mapChildren(sessions: readonly SessionInfoLike[], parentID: string): SubagentRaw[] {
  return sessions
    .filter((session) => session.parentID === parentID)
    .map((session) => ({
      id: session.id,
      type: session.agent ?? "agent",
      description: session.title ?? "",
      startedAt: session.time?.created ?? 0,
    }))
}

/** IDs of the sessions considered running by the injected state predicate. */
export function runningIDSet(
  sessions: readonly SessionInfoLike[],
  isRunning: (info: SessionInfoLike) => boolean,
): ReadonlySet<string> {
  return new Set(sessions.filter(isRunning).map((session) => session.id))
}

/**
 * Heuristic for the server part, which has no active-session endpoint:
 * a session that never went idle and has no outcome is still running.
 */
export function isServerRunning(info: SessionInfoLike): boolean {
  return !info.outcome && !info.time?.idle
}
