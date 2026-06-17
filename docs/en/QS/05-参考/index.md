# 📚 Reference: Quick Lookup and Troubleshooting

This chapter is QS's **quick-reference area** — it doesn't teach you how to build a skill, but answers the questions you'll keep coming back to once you're up and running: how to type the commands, how to configure permissions, which piece of logic a given player hint comes from, what the result code that `/qs cast` prints back means, where the bundled example skills are, how to tune performance, and where to look when something breaks. Everything here follows QS **1.0.22**, with the command tree, result codes, and passive types aligned strictly with the source.

The two tables you'll use most are [Commands and Permissions](./commands-permissions) (11 subcommands + 6 permission nodes) and [CastResult Result Codes](./castresult-codes) (14 result codes) — when a skill won't fire, start from these two pages and the decision tree in [Diagnostics and Troubleshooting](./troubleshooting); to nail down terms, flip to the [Glossary](./glossary); and before launch, run through the checklist in [Performance and Passive Throttling](./performance-throttling).

## In this section

- ⌨️ [Commands and Permissions](./commands-permissions) — `/qs`'s 11 subcommands, 6 permission nodes, tab-completion, and typical usage.
- 💬 [Message Copy Quick Reference](./messages) — The original text of every player-visible message, to match what you see in-game to its logic.
- 🔢 [CastResult Result Codes](./castresult-codes) — The meaning, player text, and handling advice for the 14 cast result codes.
- 📋 [Built-in Skills and Examples](./bundled-skills-examples) — The 8 commented example skills and 4 integration templates dropped on first startup.
- 🚑 [Diagnostics and Troubleshooting](./troubleshooting) — A "symptom → cause → fix" decision tree and how to use the debug trace.
- 📈 [Performance and Passive Throttling](./performance-throttling) — High-frequency passive throttling, TICK throttling, persistence, and the pre-launch checklist.
- ❓ [FAQ — Frequently Asked Questions](./faq) — The common pitfalls from across the pages, collected into topic-grouped Q&A.
- 📖 [Glossary](./glossary) — Quick reference for frequent terms like QS / gate / bridge / state machine.
- 📅 [Changelog](./changelog) — Version evolution recorded along capability lines.
