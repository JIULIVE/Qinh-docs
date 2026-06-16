# 📦 Server Guide

This is the largest and most central section of QinhItems: a complete server-owner handbook for **how to author an item**. From describing an item's appearance with a single block of YAML, to layering on quality, attributes, affixes, sets, and gem sockets, all the way to letting the server randomly generate gear on its own — every dial you'll touch while building items lives here.

The journey runs roughly like this: first learn an item's skeleton in **Item Definition**, then decide **which type** it is (the type decides which features it can use); next dress it in **quality**, hang **attribute stats** on it, and use **variables** to let each item roll different numbers. For randomization and reuse, hand things to the **affix / section / set** system. Finally, deepen the gameplay with **random generation**, **gem sockets**, **soulbinding**, and **advanced recipes**, and give items a custom look with a **resource pack**.

It helps to remember these twenty pages in five groups: the **cookbook** (the Item Cookbook overview plus three example chapters — around 140 built-in recipes you can grab with `/qi give`), the **base structure** (Item Definition / Item Types / Quality & Display), the **attribute & stats system** (Attributes & Numbers / Variables / Affixes / Sections / Sets), **advanced gameplay** (Random Generation / Gem Sockets / Soulbinding / Advanced Recipes / Enchant Caps / Fragments & Templates), and **appearance** (Resource Pack & models).

Where to start? New server owners should browse the **Item Cookbook** first, grab a few items in-game to see the effect, then compare them against the source yml. If you'd rather understand it from the ground up, reading **Item Definition → Item Types → Attributes & Numbers** in order is the steadiest path. Remember to run `/qi reload` after editing any yml for changes to take effect.

## In this section

- 📝 [Item Definition](./item-definition) — QI's most central chapter: describing every field of an item in YAML and the grouped file layout.
- 📚 [Item Cookbook](./item-cookbook) — Full index, per-category notes, and ready-to-use entry point for ~140 built-in example items.
- 🛡️ [Cookbook: Equipment](./cookbook-equipment) — Line-by-line YAML for ~47 equipment examples: armor, weapons, bows, shields, staves, and more.
- 💍 [Cookbook: Accessories & Consumables](./cookbook-accessories-consumables) — Line-by-line YAML for ~41 examples: accessories, rings, food, scrolls, materials, fishing rods.
- 🎲 [Cookbook: Misc](./cookbook-misc) — ~22 special items: currency, tokens, trophies, heads, props, and mounts.
- 🗂️ [Item Types](./item-types) — The type and capability matrix: what class an item belongs to and which features it may use.
- 🌈 [Quality & Display](./quality-display) — Defining quality (Tier) and glow, plus how the final item's lore is laid out.
- 📊 [Attributes & Numbers](./attributes-numbers) — How QI hangs attributes on an item and bridges them to AttributePlus for the player.
- 🔢 [Variables](./variables) — Item-level dynamic values: random stats, quality words, star ranks, and text placeholders.
- 🏷️ [Affixes](./affixes) — Reusable modifier packs that add prefixes/suffixes and lore, with pools for random affixes.
- 📋 [Sections](./sections) — Reusable lore blocks: static sections, weighted random pools, and quality-branched pools.
- 🎽 [Sets](./sets) — Wearing multiple pieces activates tiered bonuses (attributes / potion effects / active abilities) by piece count.
- 🎰 [Random Generation](./random-generation) — Generate gear like MMOItems: roll a Tier by quality weight, roll affixes, assemble the item.
- 💠 [Gem Sockets](./gem-sockets) — Open sockets on gear, bridging to the Legendinlay / MagicGem backends for inlaying.
- 🔒 [Soulbinding](./soulbinding) — Once bound to a player, only the owner can use the item, and it can't be dropped / traded / death-dropped.
- 🍳 [Advanced Recipes](./advanced-recipes) — Real-world recipes combining variables, sections, affixes, sets, and actions.
- ✴️ [Enchant Caps](./enchant-caps) — Limit an item's total enchant level, enforced at the anvil / enchanting table.
- 🧱 [Fragments & Templates](./fragments-templates) — Reusable YAML snippets that pull shared fields into one place referenced by many items.
- 🎨 [Resource Pack](./resource-pack) — Declare custom model data or a model resource path to show custom looks via your resource pack.
