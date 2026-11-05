import { describe, expect, it } from "vitest"
import {
  filterRunning,
  formatDuration,
  formatLine,
  sortByNewest,
  toSubagentInfo,
  type SubagentRaw,
} from "../src/domain/subagent-status.js"

function raw(partial: Partial<SubagentRaw> & { id: string }): SubagentRaw {
  return { type: "explore", description: "find files", startedAt: 1_000, ...partial }
}

describe("formatDuration", () => {
  it("formats seconds below a minute", () => {
    expect(formatDuration(0)).toBe("0s")
    expect(formatDuration(45_000)).toBe("45s")
    expect(formatDuration(59_999)).toBe("59s")
  })

  it("formats minutes with zero-padded seconds below an hour", () => {
    expect(formatDuration(60_000)).toBe("1m00s")
    expect(formatDuration(192_000)).toBe("3m12s")
    expect(formatDuration(3_599_999)).toBe("59m59s")
  })

  it("formats hours with zero-padded minutes beyond an hour", () => {
    expect(formatDuration(3_600_000)).toBe("1h00m")
    expect(formatDuration(3_720_000)).toBe("1h02m")
    expect(formatDuration(10 * 3_600_000 + 5 * 60_000)).toBe("10h05m")
  })

  it("clamps non-positive input to 0s", () => {
    expect(formatDuration(-5)).toBe("0s")
  })
})

describe("filterRunning", () => {
  it("keeps only the ids in the active set, order preserved", () => {
    const raws = [raw({ id: "a" }), raw({ id: "b" }), raw({ id: "c" })]
    expect(filterRunning(raws, new Set(["c", "a"]))).toEqual([raw({ id: "a" }), raw({ id: "c" })])
  })

  it("returns an empty array when nothing is active", () => {
    expect(filterRunning([raw({ id: "a" })], new Set())).toEqual([])
  })
})

describe("sortByNewest", () => {
  it("sorts by startedAt descending", () => {
    const raws = [raw({ id: "old", startedAt: 100 }), raw({ id: "new", startedAt: 300 }), raw({ id: "mid", startedAt: 200 })]
    expect(sortByNewest(raws).map((r) => r.id)).toEqual(["new", "mid", "old"])
  })

  it("does not mutate the input and is stable for equal startedAt", () => {
    const raws = [raw({ id: "x", startedAt: 100 }), raw({ id: "y", startedAt: 100 })]
    const sorted = sortByNewest(raws)
    expect(sorted.map((r) => r.id)).toEqual(["x", "y"])
    expect(raws.map((r) => r.id)).toEqual(["x", "y"])
    expect(sorted).not.toBe(raws)
  })
})

describe("toSubagentInfo", () => {
  it("attaches the elapsed duration at now", () => {
    const info = toSubagentInfo(raw({ id: "a", startedAt: 1_000 }), 193_000)
    expect(info).toEqual({ id: "a", type: "explore", description: "find files", startedAt: 1_000, durationMs: 192_000 })
  })
})

describe("formatLine", () => {
  it("formats '⏳ type — description · duration'", () => {
    const info = toSubagentInfo(raw({ id: "a", type: "explore", description: "find files", startedAt: 1_000 }), 193_000)
    expect(formatLine(info)).toBe("⏳ explore — find files · 3m12s")
  })

  it("keeps long descriptions intact (autowrap is the renderer's job)", () => {
    const long = "x".repeat(200)
    const info = toSubagentInfo(raw({ id: "a", description: long, startedAt: 0 }), 45_000)
    expect(formatLine(info)).toBe(`⏳ explore — ${long} · 45s`)
  })
})
