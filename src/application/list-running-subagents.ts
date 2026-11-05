import { filterRunning, sortByNewest, toSubagentInfo, type SubagentInfo } from "../domain/subagent-status.js"
import type { SubagentSource } from "./ports.js"

/**
 * List the background subagents of a session that are still running, most
 * recently started first, with their elapsed duration at `now`.
 */
export async function listRunningSubagents(
  source: SubagentSource,
  sessionID: string,
  now: number,
): Promise<SubagentInfo[]> {
  const [children, activeIDs] = await Promise.all([source.children(sessionID), source.activeIDs(sessionID)])
  return sortByNewest(filterRunning(children, activeIDs)).map((raw) => toSubagentInfo(raw, now))
}
