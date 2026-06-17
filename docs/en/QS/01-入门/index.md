# 📖 Getting Started: Know QinhSkills and Get It Running from Scratch

This section is the starting point for QinhSkills (QS). If you're new to QS, it takes the shortest path to clear up three things: **what QS actually is, why you'd insert this layer between items and MythicMobs, and how to hand-build your first castable skill.**

This section is for everyone just getting started — whether you're a server owner who wants a quick test run or a developer who'd rather fully grasp the architecture before diving in. We suggest reading [Overview](./overview) first to build a mental model, then following the order [Installation](./installation) → [Quick Start](./quick-start) to get the whole chain working; if you prefer to understand the principles before configuring, jump straight to [Core Concepts](./core-concepts).

By the end of this section, you'll know what steps happen between "pressing a key" and "casting a ball of flame," and you'll be able to independently troubleshoot the most common issue: "why won't my skill cast?"

## In this section

- 🧭 [Overview](./overview) — What QS is, the four-way division of labor, its relationship to MythicMobs, and the three design philosophies
- 📥 [Installation and Environment](./installation) — Hard/soft dependencies, install steps, what happens when each is missing, verification and troubleshooting
- 🚀 [5-minute Quick Start](./quick-start) — Turn the bundled fire_wave from a placeholder message into real flames and bind it to right-click an item
- 🧩 [Core Concepts and the Runtime Pipeline](./core-concepts) — The 7-stage runtime pipeline, the 6-state state machine, the two sets of fields, the gate, and the bridge
