# QinhSkills (QS)

> The **skill engine** of the Qinh RPG ecosystem: skill definition & casting, the cast pipeline.

!!! note "Docs in progress"
    Full QS docs are being organized. Below is a summary; details to follow.

## What it does

- **Skill definition & casting** — configure skills and handle the cast flow.
- **Cast pipeline** — runtime mechanics: variable channels, targeting, passives, reticles, conditions, charges, cooldown groups, channeling (CHANNEL), and more.
- **Receives item actions** — `qinhskills:cast` in QI items / sets forwards skill-cast requests here.

## What it doesn't do

The item itself (in QI), attribute-number application (in the numbers backend).

## See also

- How QI forwards skills: [QI · Cross-module Integration](../QI/04-开发者/跨模块对接.md)
- Integration steps: [QI · Integration Howto](../QI/04-开发者/集成实操.md)
