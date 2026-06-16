# 📖 Getting Started

**QinhCoreLib (QCL) is the core foundation / platform library of the entire Qinh ecosystem.** It implements no gameplay of its own. Instead, it provides a unified set of capabilities to the gameplay plugins built on top of it (QI items, QS skills, QF forging, QSt enhancement, QCR, and more) and to third-party plugins: item sources, an economy bridge, scripting, databases, PDC (persistent data), placeholders, custom GUIs, action contracts, bridge status, and diagnostics.

Think of QCL as the "utilities" — the water and power. Installing it adds no gameplay by itself, but without it not a single Qinh gameplay plugin will run. Every Qinh gameplay plugin **hard-depends** on QCL, while third-party plugins (Vault, PlaceholderAPI, ModelEngine, MMOItems, and others) are pulled in through its reflection bridges and used uniformly — anything not installed is simply skipped.

Because it is the foundation, QCL should be installed **first**. It has no hard dependencies of its own, but it relies on the Paper / Purpur `libraries` mechanism to auto-fetch runtime libraries such as Kotlin, GraalJS, and Groovy4, so the server, Java, and MC versions all have clear requirements. Once it is in place, run `/qcl status` to give the whole ecosystem a health check, then learn how it works step by step.

If this is your first time, start with the Overview to understand where QCL sits in the ecosystem; then follow Installation to set up the foundation; use the Quick Start to get it running once; and finally read Core Concepts to grasp the modules, bridges, and item sources that run through the rest of the docs.

## In this section

- 🧭 [Overview](./overview) — A one-line definition of QCL and why it sits at the very bottom of the ecosystem, hard-depended on by every gameplay plugin.
- 📥 [Installation](./installation) — Server / Java / MC version requirements, and why Paper / Purpur's `libraries` mechanism is required.
- 🚀 [Quick Start](./quick-start) — Get QCL running in 5 steps: health check, diagnostics, opening the example GUI, editing config and reloading, and referencing an item source.
- 🧩 [Core Concepts](./core-concepts) — Master the 5 core abstractions: modules, bridges and soft dependencies, item sources, diagnostic health codes, and API boundaries.
