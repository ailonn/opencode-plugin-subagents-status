import { Plugin } from "@opencode/plugin"
import { listRunningSubagents } from "./application/list-running-subagents.js"
import type { SubagentSource } from "./application/ports.js"
import { formatDuration } from "./domain/subagent-status.js"
import { isServerRunning, mapChildren, runningIDSet } from "./adapters/opencode-sessions.js"

/**
 * opencode-subagents-status — server part.
 *
 * Exposes the read-only `subagents_status` tool: the background subagents
 * of the calling session that are still running (type, description,
 * elapsed duration, session id). It sends no messages, interrupts nothing
 * and mutates no sub-session.
 */
export default Plugin.define({
  id: "opencode-subagents-status",
  async setup(ctx) {
    const source: SubagentSource = {
      children: async (sessionID) =>
        mapChildren((await ctx.session.list({ parentID: sessionID })).data, sessionID),
      activeIDs: async (sessionID) =>
        runningIDSet((await ctx.session.list({ parentID: sessionID })).data, isServerRunning),
    }

    const registration = await ctx.tool.transform((editor) => {
      editor.add({
        name: "subagents_status",
        description:
          "List the background subagents currently running in this session (read-only). " +
          "For each running subagent: agent type, description, elapsed duration and session id. " +
          "No subagent is started, interrupted or modified by this tool.",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async (_input, execution) => {
          const subagents = await listRunningSubagents(source, execution.sessionID, Date.now())
          const text = subagents.length
            ? subagents
                .map(
                  (subagent) =>
                    `${subagent.type} — ${subagent.description} · running ${formatDuration(subagent.durationMs)} (session ${subagent.id})`,
                )
                .join("\n")
            : "No background subagents are currently running in this session."
          return { content: text }
        },
      })
    })

    return () => registration.dispose()
  },
})
