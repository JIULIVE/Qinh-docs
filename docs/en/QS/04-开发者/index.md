# 💻 Developer

This section is for **plugin developers** and lays out every programmatic interface QS exposes. The starting point is `QinhSkillsAPI` — a Kotlin object singleton offering unlock/lock, set-level/set-slot, status queries, and programmatic skill casting (`cast` / `castDetailed`). Every cast flows into the single `SkillCastPipeline` runtime, firing a **`QISkillUseEvent`** (provided by QinhCoreLib) that other plugins can listen to, cancel, and read results from.

There are two data outlets: **PlaceholderAPI placeholders** feed runtime state like skill level/cooldown/charges/channel progress to HUDs, scoreboards, and BetterHud; the **Script API** (`pre_js` / `post_js`) lets you intercept before a cast and run side effects after one, with the engine reusing QCL's GraalJS. Underneath, the `SkillRuntimeProtocol` protocol layer makes the QS ↔ MythicMobs forwarding contract explicit, paired with `/qs protocol`, `/qs bridge`, and the debug trace for diagnostics. All player skill profiles are persisted to disk by `PlayerSkillProfile`.

Suggested reading order: start with **API** for the full picture, then **Events** to understand the main cast chain; read **Placeholders** when wiring data into a UI, and the **Script API** for complex gating / side effects; check **Diagnostics & Protocol** when a skill won't cast, and **Data Storage** when you care about profile-persistence details.

## In this section

- 📘 [QinhSkillsAPI](./api) — programmatic entry point: unlock/set-level/set-slot and casting skills in code
- 📡 [Event QISkillUseEvent](./events) — the main skill-cast event; listen / cancel / read results
- 🔣 [PlaceholderAPI Placeholders](./placeholders) — expose skill runtime state to HUDs / scoreboards
- 🧪 [Script API](./script-api) — `pre_js` interception, `post_js` side effects, injected `ctx` / `qcl`
- 🩺 [Diagnostics & Protocol](./diagnostics-protocol) — `/qs protocol`, `/qs bridge`, and the debug trace for pinpointing issues
- 🗄️ [Data Storage](./data-storage) — the `PlayerSkillProfile` on-disk structure and persisted vs in-memory state
