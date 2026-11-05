import { For, Show } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import { listRunningSubagents } from "./application/list-running-subagents.js"
import type { SubagentSource } from "./application/ports.js"
import { formatLine, type SubagentInfo } from "./domain/subagent-status.js"
import { mapChildren, runningIDSet } from "./adapters/opencode-sessions.js"

/**
 * opencode-subagents-status — TUI part.
 *
 * Surfaces: a permanent sidebar section (autowrapped) with one line per
 * running background subagent of the current session, and the
 * `/subagents` command — a select dialog whose selection opens the
 * subagent's session in a tab (non-destructive). Refresh is event-driven
 * (session events only, no timer); state lives in memory storage only.
 */
export default Plugin.define({
  id: "opencode-subagents-status.tui",
  setup(context) {
    const source: SubagentSource = {
      children: async (sessionID) => mapChildren(context.data.session.list(), sessionID),
      activeIDs: async (sessionID) =>
        runningIDSet(
          context.data.session.list(),
          (info) => context.data.session.status(info.id) === "running",
        ),
    }

    const [state, setState] = context.storage.memory("opencode-subagents-status", {
      initial: { items: [] as SubagentInfo[] },
    })

    function refresh() {
      const route = context.ui.router.current()
      if (route.type !== "session") {
        setState((draft) => {
          draft.items = []
        })
        return
      }
      const sessionID = route.sessionID
      void listRunningSubagents(source, sessionID, Date.now()).then((items) => {
        // Drop stale results if the session changed while listing.
        const current = context.ui.router.current()
        if (current.type !== "session" || current.sessionID !== sessionID) return
        setState((draft) => {
          draft.items = items
        })
      })
    }

    const stopListening = context.data.listen(({ details }) => {
      if (details.type.startsWith("session.")) refresh()
    })
    refresh()

    const releaseSlot = context.ui.slot({
      append: "sidebar.content",
      render: () => (
        <Show when={state.items.length > 0}>
          <box>
            <text fg={context.theme.text.muted}>Subagents</text>
            <For each={state.items}>
              {(item) => (
                <text wrapMode="word">{formatLine(item)}</text>
              )}
            </For>
          </box>
        </Show>
      ),
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "opencode-subagents-status.subagents",
          title: "List the background subagents running in this session",
          group: "Subagents",
          slash: { name: "subagents" },
          run: async () => {
            const route = context.ui.router.current()
            if (route.type !== "session") {
              context.ui.toast.show({ message: "Open a session first", variant: "warning" })
              return
            }
            const items = await listRunningSubagents(source, route.sessionID, Date.now())
            if (items.length === 0) {
              context.ui.toast.show({ message: "No background subagents running" })
              return
            }
            const picked = await context.ui.dialog.select({
              title: "Background subagents",
              options: items.map((item) => ({
                title: formatLine(item),
                description: item.type,
                value: item.id,
              })),
            })
            if (!picked) return
            if (!context.ui.tabs.enabled()) {
              context.ui.toast.show({ message: "Session tabs are disabled in this TUI", variant: "warning" })
              return
            }
            context.ui.tabs.open(picked)
          },
        },
      ],
    }))

    return () => {
      stopListening()
      releaseSlot()
    }
  },
})
