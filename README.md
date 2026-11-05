# opencode-plugin-subagents-status

OpenCode plugin: live status of your **background subagents** — a permanent sidebar
section, a `/subagents` command that opens a subagent's session in a tab, and a
read-only `subagents_status` tool that agents and skills can call.

OpenCode only notifies you when a background subagent **finishes**. This plugin shows
what is happening **in flight**: which subagents are running, what they do, for how long.

## Features

- **Sidebar (permanent)**: one autowrapped line per running background subagent of the
  current session — `⏳ <agent type> — <description> · <elapsed duration>`. Empty list →
  nothing shown (no orphan line).
- **`/subagents` command**: select dialog of the running background subagents (most recent
  first) — Enter opens the subagent's session **in a tab** (`ui.tabs.open`, non-destructive:
  your current session stays where it is).
- **`subagents_status` tool** (server part, read-only): lists the running background
  subagents of the calling session — type, description, elapsed duration, session id.
  Agents can call it in their loop; skills can invoke it. It sends no messages,
  interrupts nothing and mutates no sub-session.
- **Refresh on change**: event-driven on session events (no timer). State is memory-only —
  nothing is persisted.

## Install

v0: the package is **not published to npm** — install from a local clone (the host
resolves plugin entries as absolute paths or npm names; a bare name that is not on
npm cannot be resolved).

```sh
git clone https://github.com/ailonn/opencode-plugin-subagents-status
cd opencode-plugin-subagents-status
npm install
```

Then one entry in your OpenCode config loads both parts (server + TUI) — global:
`~/.config/opencode/opencode.jsonc`, or project: `.opencode/opencode.jsonc`:

```jsonc
{
  "plugins": ["/absolute/path/to/opencode-plugin-subagents-status"]
}
```

npm is the tested package manager (the checked-in lockfile is npm's). Requires an
OpenCode V2 release exposing the `@opencode/plugin` + `@opencode/plugin/tui` APIs.

## Architecture

Strict clean architecture, one folder per layer, two parts in one package:

| Layer | Path | Role |
|---|---|---|
| Domain | `src/domain/` | pure functions: running filter, newest-first sort, duration + line format |
| Application | `src/application/` | `listRunningSubagents` use case + `SubagentSource` port |
| Adapters | `src/adapters/` | pure `SessionInfo` mapping shared by both parts |
| Server part | `src/server.ts` | the read-only `subagents_status` tool |
| TUI part | `src/tui.tsx` | sidebar slot, `/subagents` dialog → tab, event-driven refresh |

Unit tests sit at the domain, application and mapping seams (fakes over the ports). The
sidebar / dialog / tool chains are covered by manual acceptance (the TUI is not testable
headless).

**Running state**: the TUI part reads the host's session status cache; the server part
uses a documented heuristic on `SessionInfo` (a session that never went idle and has no
outcome is running) — it has no active-session endpoint.

## Develop

```sh
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
```

## Spec & decisions

See [SPEC.md](./SPEC.md) — acceptance criteria, the approved decisions (cited by name:
command-name, refresh, foreground, navigation, display, tool, publication) and the v1
scope.

## License

[MIT](./LICENSE)

## License

[MIT](./LICENSE)
