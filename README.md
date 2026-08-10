# Obsidian Lancer-OS

**Lancer-OS** is a comprehensive, all-in-one suite designed specifically for Game Masters running the [Lancer RPG](https://massif-press.itch.io/corebook-pdf-free) in [Obsidian](https://obsidian.md/). It transforms your standard markdown vault into a fully functional, dark sci-fi COMP/CON style terminal.

## 🚀 Features

### 1. Lancer-OS Theme
A custom, dark sci-fi CSS theme that completely overhauls the Obsidian UI.
- Inspired by the iconic COMP/CON aesthetic.
- Terminal-style fonts, neon orange accents, and dark backgrounds.
- Headers automatically receive the "UNION_OS //" prefix.

### 2. Interactive Clocks & Progress Bars
Manage your mission timers and progress directly in Reading View. 
Use the simple syntax `[Clock: Mission Timer 4/8]` anywhere in your notes to render a visual clock. 
**Interactive:** Click the `[-]` and `[+]` buttons next to the clock in Reading View to automatically update the markdown source file! No need to switch back to Edit mode.

### 3. Automated LCP Importer
Built-in Python parser that bridges the gap between COMP/CON and Obsidian.
- Upload any `.lcp` file (like Core NPCs) via the Lancer-OS Sidebar button.
- Automatically extracts all NPCs, abilities, and weapons.
- Generates beautiful, tagged Markdown files with full YAML frontmatter for Dataview integration.

### 4. Dynamic Statblocks & Tier Switching
NPC files are generated with a special ````lancer-stats```` codeblock.
- Automatically renders a beautiful stat grid (HP, Armor, Evasion, etc.).
- Includes a live **[T1] [T2] [T3]** toggle switch. Click a Tier button, and the stats on the grid will instantly scale to the correct values!

### 5. Sidebar Encounter Tracker
A dedicated right-sidebar view that automatically tracks all characters in your current scene.
- Simply link to a character in your note (e.g., `[[Kassandra Newton]]`).
- The Tracker separates **Story Characters** from **Combat Mechs**.
- Combat Mechs are displayed as mini-stat cards showing their current stats.
- **Pro-Tip:** Link a specific Tier using `[[NPC#T2]]`, and the Tracker will automatically load that Mech at Tier 2 for the encounter!

## 📦 Installation

### 1. Install the Theme
1. Copy the `theme` folder contents into `<Your Vault>/.obsidian/themes/Lancer-OS`.
2. Open Obsidian > Settings > Appearance > Themes, and select `Lancer-OS`.

### 2. Install the Plugin
1. Copy the `plugin` folder contents into `<Your Vault>/.obsidian/plugins/lancer-companion`.
2. Open Obsidian > Settings > Community Plugins, and enable `Lancer Companion Plugin`.

### 3. Add the Templates
1. Copy the `templates` folder contents into your Vault's template folder.

## ⚙️ Requirements
- Obsidian v1.4.0+
- Python 3 installed on your system (Required *only* if you want to use the automated LCP Importer).

## 📝 License
This project is an independent creation and is not affiliated with Massif Press. Lancer is a trademark of Massif Press.
