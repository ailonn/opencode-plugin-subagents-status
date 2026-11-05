import type { SubagentRaw } from "../domain/subagent-status.js"

/**
 * Driven port — the application needs the session's subagent children and
 * which sessions are currently running. Adapters implement it (OpenCode
 * data cache for the TUI, OpenCode client for the server part).
 */
export interface SubagentSource {
  /** All sub-sessions of the given session (running or finished). */
  children(sessionID: string): Promise<readonly SubagentRaw[]>
  /** IDs of the sessions currently running. */
  activeIDs(sessionID: string): Promise<ReadonlySet<string>>
}
