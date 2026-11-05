import { describe, expect, it } from "vitest"
import { listRunningSubagents } from "../src/application/list-running-subagents.js"
import type { SubagentSource } from "../src/application/ports.js"
import type { SubagentRaw } from "../src/domain/subagent-status.js"

function fakeSource(children: SubagentRaw[], activeIDs: string[], calls: string[] = []): SubagentSource {
  return {
    children: async (sessionID) => {
      calls.push(`children:${sessionID}`)
      return children
    },
    activeIDs: async (sessionID) => {
      calls.push(`activeIDs:${sessionID}`)
      return new Set(activeIDs)
    },
  }
}

const CHILDREN: SubagentRaw[] = [
  { id: "child_old", type: "explore", description: "old", startedAt: 1_000 },
  { id: "child_new", type: "general", description: "new", startedAt: 3_000 },
  { id: "child_done", type: "explore", description: "done", startedAt: 2_000 },
]

describe("listRunningSubagents", () => {
  it("returns the running children, most recently started first, with duration at now", async () => {
    const result = await listRunningSubagents(fakeSource(CHILDREN, ["child_old", "child_new"]), "ses_1", 3_001)
    expect(result).toEqual([
      { id: "child_new", type: "general", description: "new", startedAt: 3_000, durationMs: 1 },
      { id: "child_old", type: "explore", description: "old", startedAt: 1_000, durationMs: 2_001 },
    ])
  })

  it("returns an empty list when there are no children", async () => {
    expect(await listRunningSubagents(fakeSource([], ["x"]), "ses_1", 0)).toEqual([])
  })

  it("returns an empty list when no child is running", async () => {
    expect(await listRunningSubagents(fakeSource(CHILDREN, ["other"]), "ses_1", 0)).toEqual([])
  })

  it("asks the source for the given session", async () => {
    const calls: string[] = []
    await listRunningSubagents(fakeSource([], [], calls), "ses_42", 0)
    expect(calls).toEqual(["children:ses_42", "activeIDs:ses_42"])
  })
})
