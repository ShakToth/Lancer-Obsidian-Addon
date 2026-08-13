import sys
import zipfile
import json
import os
import re

def strip_html(text):
    if not isinstance(text, str):
        return ""
    return re.sub('<[^<]+>', '', text)

def process_npc_classes(z, vault_path, feature_dict):
    target_dir = os.path.join(vault_path, "00_Regeln", "Feind_Statblocks")
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        classes = json.loads(z.read("npc_classes.json").decode("utf-8"))
    except KeyError:
        return
        
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

        fallback_content = f"\"\"\"---\ntags:\n  - NPC_Class\nHP: {hp}\nArmor: {armor}\nEvasion: {evasion}\nE-Defense: {edef}\nSpeed: {speed}\nSensor Range: {sensors}\n---\n# {name}\n\n{{{{LANCER_STATS}}}}\n\n*(Diese Notiz wurde automatisch aus einer LCP-Datei extrahiert.)*\n\n---\n**Index:** [[Index_Feind_Statblocks]]\n\"\"\""
        
        template_path = os.path.join(vault_path, "99_TEMPLATES", "Template_Mech.md")
        template_text = fallback_content
        if os.path.exists(template_path):
            with open(template_path, "r", encoding="utf-8") as tf:
                template_text = tf.read()
            
            yaml_regex = re.compile(r"^---\n([\s\S]*?)\n---")
            match = yaml_regex.search(template_text)
            merged_yaml = f"---\ntags:\n  - NPC_Class\nHP: {hp}\nArmor: {armor}\nEvasion: {evasion}\nE-Defense: {edef}\nSpeed: {speed}\nSensor Range: {sensors}\n"
            if match:
                merged_yaml = f"---\n{match.group(1)}\nHP: {hp}\nArmor: {armor}\nEvasion: {evasion}\nE-Defense: {edef}\nSpeed: {speed}\nSensor Range: {sensors}\n---"
                template_text = yaml_regex.sub(merged_yaml, template_text, 1)
            else:
                template_text = merged_yaml + "---\n" + template_text

        stats_block = f"`lancer-stats\n📊 Basis-Stats\nHP: {hp}\nArmor: {armor}\nEvasion: {evasion}\nE-Defense: {edef}\nSpeed: {speed}\nSensor Range: {sensors}\n`\n{features_markdown}"

        content = template_text
        if "{{LANCER_STATS}}" in content:
            content = content.replace("{{LANCER_STATS}}", stats_block)
        else:
            content += "\n\n" + stats_block
            
        content = content.replace("<% tp.file.title %>", name)
        content = content.replace("{{name}}", name)
        
        safe_name = re.sub(r'[<>:"/\\|?*]', '', str(name))
        file_path = os.path.join(target_dir, f"{safe_name}.md")
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)

def process_npc_templates(z, vault_path, feature_dict):
    target_dir = os.path.join(vault_path, "00_Regeln", "Feind_Templates")
    os.makedirs(target_dir, exist_ok=True)
    try:
        templates = json.loads(z.read("npc_templates.json").decode("utf-8"))
    except KeyError:
        return

    for t in templates:
        name = t.get("name", "Unknown")
        desc = strip_html(t.get("description", ""))
        
        features_markdown = "## ⚔️ Template Features\n"
        base_features = t.get("base_features", [])
        for f_id in base_features:
            if f_id in feature_dict:
                f = feature_dict[f_id]
                f_name = f.get("name", "Unknown")
                effect = strip_html(f.get("effect", ""))
                features_markdown += f"- **{f_name}**\n  - {effect}\n"
                
        content = f"---\ntags:\n  - NPC_Template\n---\n# {name}\n\n{desc}\n\n{features_markdown}"
        
        safe_name = re.sub(r'[<>:"/\\|?*]', '', str(name))
        file_path = os.path.join(target_dir, f"{safe_name}.md")
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)

def process_generic_json(z, filename, vault_path):
    category = filename.replace('.json', '').title()
    target_dir = os.path.join(vault_path, "00_Regeln", "LCP_Data", category)
    
    try:
        data = json.loads(z.read(filename).decode("utf-8"))
    except Exception:
        return
        
    if not isinstance(data, list):
        return
        
    os.makedirs(target_dir, exist_ok=True)
    
    for item in data:
        if not isinstance(item, dict): continue
        name = item.get("name", "Unknown")
        
        yaml_lines = ["---"]
        for k, v in item.items():
            if k in ["name", "description", "effect"]: continue
            if isinstance(v, (str, int, bool, float)):
                yaml_lines.append(f"{k}: {v}")
            elif isinstance(v, list) and len(v) > 0 and isinstance(v[0], str):
                yaml_lines.append(f"{k}: [{', '.join(v)}]")
        yaml_lines.append("---")
        
        yaml_frontmatter = "\n".join(yaml_lines)
        desc = strip_html(item.get("description", ""))
        effect = strip_html(item.get("effect", ""))
        
        content = f"{yaml_frontmatter}\n# {name}\n\n"
        if desc: content += f"{desc}\n\n"
        if effect: content += f"### Effect\n{effect}\n"
        
        safe_name = re.sub(r'[<>:"/\\|?*]', '', str(name))
        file_path = os.path.join(target_dir, f"{safe_name}.md")
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)

def main():
    if len(sys.argv) < 3:
        print("Usage: python lcp_parser.py <lcp_path> <vault_path>")
        sys.exit(1)

    lcp_path = sys.argv[1]
    vault_path = sys.argv[2]
    
    try:
        with zipfile.ZipFile(lcp_path, 'r') as z:
            try:
                features_data = json.loads(z.read("npc_features.json").decode("utf-8"))
            except KeyError:
                features_data = []
            feature_dict = {f["id"]: f for f in features_data}
            
            for f in z.namelist():
                if not f.endswith('.json'): continue
                if f == "lcp_manifest.json": continue
                
                if f == "npc_classes.json":
                    process_npc_classes(z, vault_path, feature_dict)
                elif f == "npc_templates.json":
                    process_npc_templates(z, vault_path, feature_dict)
                elif f == "npc_features.json":
                    # Handled natively by classes/templates usually, but we could dump it too
                    process_generic_json(z, f, vault_path)
                else:
                    process_generic_json(z, f, vault_path)
            
        print("LCP erfolgreich extrahiert.")
    except Exception as e:
        print(f"Fehler: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
