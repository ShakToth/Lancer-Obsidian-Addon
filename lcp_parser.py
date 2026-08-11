import sys
import zipfile
import json
import os
import re

def strip_html(text):
    return re.sub('<[^<]+>', '', text)

def main():
    if len(sys.argv) < 3:
        print("Usage: python lcp_parser.py <lcp_path> <vault_path>")
        sys.exit(1)

    lcp_path = sys.argv[1]
    vault_path = sys.argv[2]
    
    target_dir = os.path.join(vault_path, "00_Regeln", "Feind_Statblocks")
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        with zipfile.ZipFile(lcp_path, 'r') as z:
            classes = json.loads(z.read("npc_classes.json").decode("utf-8"))
            try:
                features_data = json.loads(z.read("npc_features.json").decode("utf-8"))
            except KeyError:
                features_data = []

        feature_dict = {f["id"]: f for f in features_data}

        for npc in classes:
            name = npc.get("name", "Unknown")
            stats = npc.get("stats", {})
            hp = ", ".join(map(str, stats.get("hp", [0])))
            evasion = ", ".join(map(str, stats.get("evade", [0])))
            edef = ", ".join(map(str, stats.get("edef", [0])))
            armor = ", ".join(map(str, stats.get("armor", [0])))
            speed = ", ".join(map(str, stats.get("speed", [0])))
            sensors = ", ".join(map(str, stats.get("sensor", [0])))
            
            features_markdown = "## ⚔️ Basis-Waffen & Systeme\n"
            base_features = npc.get("base_features", [])
            for f_id in base_features:
                if f_id in feature_dict:
                    f = feature_dict[f_id]
                    f_name = f.get("name", "Unknown")
                    f_type = f.get("type", "Trait")
                    w_type = f.get("weapon_type", "")
                    
                    if f_type == "Weapon":
                        att_bonus = f.get("attack_bonus", [0])[0]
                        dmg_list = f.get("damage", [])
                        dmg_str = ""
                        if dmg_list:
                            d = dmg_list[0]
                            dmg_val = d.get("damage", [0])[0] if isinstance(d.get("damage"), list) else d.get("val", 0)
                            dmg_type = d.get("type", "")
                            dmg_str = f"{dmg_val} {dmg_type}"
                        features_markdown += f"- **{f_name}** ({w_type})\n  - Angriff: +{att_bonus} | Schaden: {dmg_str}\n"
                    else:
                        effect = strip_html(f.get("effect", ""))
                        if len(effect) > 300:
                            effect = effect[:297] + "..."
                        features_markdown += f"- **{f_name}** ({f_type})\n  - {effect}\n"

            fallback_content = f"""---
tags:
  - NPC_Class
HP: {hp}
Armor: {armor}
Evasion: {evasion}
E-Defense: {edef}
Speed: {speed}
Sensor Range: {sensors}
---
# {name}

{{{{LANCER_STATS}}}}

*(Diese Notiz wurde automatisch aus einer LCP-Datei extrahiert.)*

---
**Index:** [[Index_Feind_Statblocks]]
"""
            template_path = os.path.join(vault_path, "99_TEMPLATES", "TEMPLATE_NPC.md")
            template_text = fallback_content
            if os.path.exists(template_path):
                with open(template_path, "r", encoding="utf-8") as tf:
                    template_text = tf.read()
                
                # Merge YAML
                yaml_regex = re.compile(r"^---\n([\s\S]*?)\n---")
                match = yaml_regex.search(template_text)
                merged_yaml = f"""---
tags:
  - NPC_Class
HP: {hp}
Armor: {armor}
Evasion: {evasion}
E-Defense: {edef}
Speed: {speed}
Sensor Range: {sensors}
"""
                if match:
                    merged_yaml = f"---\n{match.group(1)}\nHP: {hp}\nArmor: {armor}\nEvasion: {evasion}\nE-Defense: {edef}\nSpeed: {speed}\nSensor Range: {sensors}\n---"
                    template_text = yaml_regex.sub(merged_yaml, template_text, 1)
                else:
                    template_text = merged_yaml + "---\n" + template_text

            stats_block = f"""```lancer-stats
🤖 Basis-Stats
HP: {hp}
Armor: {armor}
Evasion: {evasion}
E-Defense: {edef}
Speed: {speed}
Sensor Range: {sensors}
```
{features_markdown}"""

            content = template_text
            if "{{LANCER_STATS}}" in content:
                content = content.replace("{{LANCER_STATS}}", stats_block)
            else:
                content += "\n\n" + stats_block
            # Support Obsidian templater fallback
            content = content.replace("<% tp.file.title %>", name)
            content = content.replace("{{name}}", name)
            
            clean_name = re.sub(r'\s*\[.*?\]', '', name).strip()
            file_path = os.path.join(target_dir, f"{clean_name.replace('/', '_').replace(':', '')}.md")
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(content)

        print("LCP erfolgreich extrahiert.")
    except Exception as e:
        print(f"Fehler: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
