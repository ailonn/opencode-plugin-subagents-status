/**
 * Pure domain of opencode-subagents-status — no OpenCode API, no IO, no clock.
 *
 * Contract: opencode-subagents-status-spec.md (AC-1, AC-2, AC-4, AC-7) —
 * running filter, newest-first sort, duration, line format.
 */

/** One background subagent, as observed (before running filter). */
export interface SubagentRaw {
  id: string
  type: string
  description: string
  startedAt: number
}

/** A running subagent with its elapsed duration. */
export interface SubagentInfo extends SubagentRaw {
  durationMs: number
}

/**
 * Format an elapsed duration: `45s` below a minute, `3m12s` below an hour,
 * `1h02m` beyond (minutes zero-padded). Non-positive input is `0s`.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  if (hours > 0) {
    const minutes = Math.floor((total % 3600) / 60)
    return `${hours}h${String(minutes).padStart(2, "0")}m`
  }
  const minutes = Math.floor(total / 60)
  if (minutes > 0) return `${minutes}m${String(total % 60).padStart(2, "0")}s`
  return `${total}s`
}

/** Keep only the subagents whose id is in the active set (order preserved). */
export function filterRunning(raws: readonly SubagentRaw[], activeIDs: ReadonlySet<string>): SubagentRaw[] {
  return raws.filter((raw) => activeIDs.has(raw.id))
}

/** Most recently started first (stable, does not mutate the input). */
export function sortByNewest(raws: readonly SubagentRaw[]): SubagentRaw[] {
  return [...raws].sort((a, b) => b.startedAt - a.startedAt)
}

/** Attach the elapsed duration at `now`. */
export function toSubagentInfo(raw: SubagentRaw, now: number): SubagentInfo {
  return { ...raw, durationMs: now - raw.startedAt }
}

/** Sidebar / dialog line: `⏳ <type> — <description> · <duration>`. */
export function formatLine(info: SubagentInfo): string {
  return `⏳ ${info.type} — ${info.description} · ${formatDuration(info.durationMs)}`
}
