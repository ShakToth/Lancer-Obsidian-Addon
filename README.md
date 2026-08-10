# Obsidian Lancer-OS

**Lancer-OS** is a comprehensive suite designed specifically for Game Masters running the [Lancer RPG](https://massif-press.itch.io/corebook-pdf-free) in [Obsidian](https://obsidian.md/). This is the Companion Plugin that provides powerful tracking and importing features.

> [!NOTE]
> **Companion Theme**: This plugin is designed to be used alongside the **[Lancer-OS Obsidian Theme](https://github.com/ShakToth/LancerOS-Obsidian-Theme)**, which transforms your standard markdown vault into a fully functional, dark sci-fi COMP/CON style terminal!

## 🚀 Features

### 1. Glossary & Status Tooltips
Never look up status effects during combat again. The plugin automatically scans your notes for official Lancer keywords (e.g., `PRONE`, `STUNNED`, `SHREDDED`, `INVISIBLE`).
- Keywords are subtly highlighted in Reading View.
- **Hover** over them to instantly see the full rule definition in a slick UNION_OS tooltip!

### 2. Integrated Dice Roller
Roll dice directly inside your notes without switching to another app.
- Syntax: `[Roll: 1d20+2]` or `[Roll: 2d6]`
- Click the button to roll, and the result (and math) is displayed inline instantly.

### 3. Advanced Encounter & Combat Tracker
A dedicated right-sidebar view that tracks all characters in your scene and manages initiative.
- **Roster & Initiative Tabs:** Organize characters before combat, then switch to Initiative when lasers start flying.
- **Combat Controls:** Top-level `Start Combat`, `Stop Combat`, and `Next Turn` buttons.
- **Active Turn Highlighting:** The current acting character's card is highlighted in bright orange.
- **Auto-Detection:** Simply link to a character note in your current file (e.g., `[[Commander Smith]]`), and the tracker pulls their stats automatically.

### 4. Automated PC & NPC Importers
Bridging the gap between COMP/CON and Obsidian with powerful data extractors.
- **NPC LCP Importer:** Upload `.lcp` files to extract all NPC classes and abilities.
- **PC JSON Importer:** Upload your players' COMP/CON Pilot exports (`.json`). Automatically extracts their active Mech, Weapons, Systems, Licenses, Talents, and Lore!
- **Dynamic Template Engine:** Both importers read your own Obsidian templates (e.g., `99_TEMPLATES/TEMPLATE_NPC.md`). Just place the `{{LANCER_STATS}}` tag in your template, and the plugin will seamlessly inject the crunch while keeping your beautiful YAML and layout intact!

### 5. Interactive Clocks & Progress Bars
Manage your mission timers and progress directly in Reading View. 
- Syntax: `[Clock: Mission Timer 4/8]` or `[Bar: Health 15/20]`
- **Interactive:** Click the `[-]` and `[+]` buttons next to the clock in Reading View to automatically update the markdown source file!

### 6. Dynamic Statblocks & Tier Switching
Create beautiful, COMP/CON style stat grids for your mechs using the `lancer-stats` code block. Provide comma-separated values for Tiers (e.g., `HP: 10, 12, 14`).
- **Interactive:** The plugin renders a **[T1] [T2] [T3]** toggle switch. Click a Tier button, and the stats instantly scale!

## 📦 Installation

### 1. Install the Plugin
1. Copy the `plugin` folder contents into `<Your Vault>/.obsidian/plugins/lancer-companion`.
2. Open Obsidian > Settings > Community Plugins, and enable `Lancer Companion Plugin`.

### 3. Add the Templates
1. Copy the `templates` folder contents into your Vault's template folder.

## ⚙️ Requirements
- Obsidian v1.4.0+
- Python 3 installed on your system (Required *only* if you want to use the automated LCP Importer).

## 📝 License
This project is an independent creation and is not affiliated with Massif Press. Lancer is a trademark of Massif Press.
