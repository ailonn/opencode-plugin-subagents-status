import { describe, expect, it } from "vitest"
import { isServerRunning, mapChildren, runningIDSet, type SessionInfoLike } from "../src/adapters/opencode-sessions.js"

const PARENT = "ses_parent"
const CHILDREN: SessionInfoLike[] = [
  { id: "c1", parentID: PARENT, agent: "explore", title: "find the tests", time: { created: 1_000 } },
  { id: "c2", parentID: PARENT, agent: "general", title: "do the work", time: { created: 2_000 } },
  { id: "other", parentID: "ses_other", agent: "explore", title: "not mine", time: { created: 3_000 } },
  { id: "no_parent", agent: "root" },
]

describe("mapChildren", () => {
  it("keeps only the children of the given session and maps the fields", () => {
    expect(mapChildren(CHILDREN, PARENT)).toEqual([
      { id: "c1", type: "explore", description: "find the tests", startedAt: 1_000 },
      { id: "c2", type: "general", description: "do the work", startedAt: 2_000 },
    ])
  })

  it("defaults a missing agent/title/time", () => {
    const mapped = mapChildren([{ id: "bare", parentID: PARENT }], PARENT)
    expect(mapped).toEqual([{ id: "bare", type: "agent", description: "", startedAt: 0 }])
  })
})

describe("runningIDSet", () => {
  it("applies the injected predicate and returns the matching ids", () => {
    const set = runningIDSet(CHILDREN, (info) => info.id === "c2")
    expect(set).toEqual(new Set(["c2"]))
  })

  it("returns an empty set when nothing matches", () => {
    expect(runningIDSet(CHILDREN, () => false)).toEqual(new Set())
  })
})

describe("isServerRunning", () => {
  it("is true when the session never went idle and has no outcome", () => {
    expect(isServerRunning({ id: "a", time: { created: 1 } })).toBe(true)
  })

  it("is false once the session went idle", () => {
    expect(isServerRunning({ id: "a", time: { created: 1, idle: 2 } })).toBe(false)
  })

  it("is false once the session has an outcome", () => {
    expect(isServerRunning({ id: "a", time: { created: 1 }, outcome: "succeeded" })).toBe(false)
    expect(isServerRunning({ id: "a", time: { created: 1 }, outcome: "failed" })).toBe(false)
    expect(isServerRunning({ id: "a", time: { created: 1 }, outcome: "interrupted" })).toBe(false)
  })
})
