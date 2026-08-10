const { Plugin, Notice, ItemView, WorkspaceLeaf } = require('obsidian');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ==========================================
// FEATURE: Lancer Clocks & Bars
// ==========================================
class ClocksFeature {
    constructor(plugin) {
        this.plugin = plugin;
    }

    load() {
        this.plugin.registerMarkdownPostProcessor((element, context) => {
            const textNodes = this.getTextNodes(element);
            
            for (let node of textNodes) {
                const regex = /\[(Clock|Bar)(?:-(L|S))?:\s*(.+?)\s+(\d+)\/(\d+)\]/gi;
                let match;
                let lastIndex = 0;
                let fragments = [];
                
                while ((match = regex.exec(node.nodeValue)) !== null) {
                    if (match.index > lastIndex) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex, match.index)));
                    }
                    
                    const type = match[1].toLowerCase();
                    const sizeModifier = match[2] ? match[2].toUpperCase() : 'M';
                    const name = match[3].trim();
                    const current = parseInt(match[4]);
                    const max = parseInt(match[5]);
                    
                    const clockSpan = document.createElement("span");
                    clockSpan.style.display = "inline-flex";
                    clockSpan.style.alignItems = "center";
                    clockSpan.style.gap = "8px";
                    clockSpan.style.padding = "2px 6px";
                    clockSpan.style.backgroundColor = "var(--background-secondary)";
                    clockSpan.style.borderRadius = "4px";
                    clockSpan.style.border = "1px solid var(--background-modifier-border)";
                    clockSpan.className = "lancer-clock-widget";
                    
                    if (type === 'clock') {
                        let size = 20;
                        if (sizeModifier === 'L') size = 32;
                        if (sizeModifier === 'S') size = 14;
                        const svg = this.createClockSvg(current, max, size);
                        clockSpan.appendChild(svg);
                    } else if (type === 'bar') {
                        const bar = this.createBarHtml(current, max, sizeModifier);
                        clockSpan.appendChild(bar);
                    }
                    
                    const label = document.createElement("strong");
                    label.innerText = name;
                    label.style.color = "var(--text-normal)";
                    if (sizeModifier === 'L') label.style.fontSize = "1.2em";
                    if (sizeModifier === 'S') label.style.fontSize = "0.85em";
                    clockSpan.appendChild(label);
                    
                    const fraction = document.createElement("span");
                    fraction.innerText = `(${current}/${max})`;
                    fraction.style.fontSize = "0.85em";
                    fraction.style.color = "var(--text-muted)";
                    clockSpan.appendChild(fraction);
                    
                    // Add interactivity
                    const originalString = match[0];
                    const typeStr = match[1];
                    const sizeStr = match[2] ? `-${match[2]}` : "";
                    
                    const btnMinus = document.createElement("button");
                    btnMinus.innerText = "-";
                    btnMinus.style.cursor = "pointer";
                    btnMinus.style.padding = "0px 4px";
                    btnMinus.style.fontSize = "0.8em";
                    btnMinus.style.marginLeft = "4px";
                    btnMinus.style.backgroundColor = "transparent";
                    btnMinus.style.border = "1px solid var(--text-muted)";
                    
                    const btnPlus = document.createElement("button");
                    btnPlus.innerText = "+";
                    btnPlus.style.cursor = "pointer";
                    btnPlus.style.padding = "0px 4px";
                    btnPlus.style.fontSize = "0.8em";
                    btnPlus.style.marginLeft = "2px";
                    btnPlus.style.backgroundColor = "transparent";
                    btnPlus.style.border = "1px solid var(--text-muted)";

                    const updateFile = async (newCurrent) => {
                        const file = this.plugin.app.vault.getAbstractFileByPath(context.sourcePath);
                        if (!file) return;
                        const content = await this.plugin.app.vault.read(file);
                        const newString = `[${typeStr}${sizeStr}: ${name} ${newCurrent}/${max}]`;
                        // Replace the first occurrence of the exact original string
                        const newContent = content.replace(originalString, newString);
                        if (content !== newContent) {
                            await this.plugin.app.vault.modify(file, newContent);
                        }
                    };

                    btnMinus.onclick = () => {
                        if (current > 0) updateFile(current - 1);
                    };
                    btnPlus.onclick = () => {
                        if (current < max) updateFile(current + 1);
                    };

                    clockSpan.appendChild(btnMinus);
                    clockSpan.appendChild(btnPlus);

                    fragments.push(clockSpan);
                    lastIndex = regex.lastIndex;
                }
                
                if (fragments.length > 0) {
                    if (lastIndex < node.nodeValue.length) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex)));
                    }
                    const parent = node.parentNode;
                    fragments.forEach(f => parent.insertBefore(f, node));
                    parent.removeChild(node);
                }
            }
        });
    }

    getTextNodes(element) {
        const textNodes = [];
        const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walk.nextNode()) {
            const parentTag = node.parentElement ? node.parentElement.tagName : '';
            if (parentTag === 'CODE' || parentTag === 'PRE') continue;
            textNodes.push(node);
        }
        return textNodes;
    }

    createClockSvg(current, max, size) {
        const radius = size * 0.4;
        const center = size / 2;
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", center);
        circle.setAttribute("cy", center);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("stroke", "var(--text-muted)");
        circle.setAttribute("stroke-width", "2");
        svg.appendChild(circle);
        
        let safeCurrent = Math.max(0, Math.min(current, max));
        if (max <= 0) max = 1;
        
        if (safeCurrent > 0) {
            const percent = safeCurrent / max;
            if (percent >= 1) {
                const fullCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                fullCircle.setAttribute("cx", center);
                fullCircle.setAttribute("cy", center);
                fullCircle.setAttribute("r", radius);
                fullCircle.setAttribute("fill", "var(--color-red, #ff5555)");
                svg.appendChild(fullCircle);
            } else {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                
                const startX = center;
                const startY = center - radius;
                
                const endAngle = (percent * 360 - 90) * (Math.PI / 180);
                const endX = center + radius * Math.cos(endAngle);
                const endY = center + radius * Math.sin(endAngle);
                
                const largeArcFlag = percent > 0.5 ? 1 : 0;
                
                const d = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                
                path.setAttribute("d", d);
                path.setAttribute("fill", "var(--color-red, #ff5555)");
                svg.appendChild(path);
            }
        }
        
        if (max > 1 && max <= 12) {
            for (let i = 0; i < max; i++) {
                const angle = (i / max * 360 - 90) * (Math.PI / 180);
                const lineX = center + radius * Math.cos(angle);
                const lineY = center + radius * Math.sin(angle);
                
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", center);
                line.setAttribute("y1", center);
                line.setAttribute("x2", lineX);
                line.setAttribute("y2", lineY);
                line.setAttribute("stroke", "var(--background-primary)");
                line.setAttribute("stroke-width", "1");
                svg.appendChild(line);
            }
        }
        
        return svg;
    }

    createBarHtml(current, max, sizeModifier) {
        let width = "100px";
        let height = "12px";
        if (sizeModifier === 'L') { width = "150px"; height = "16px"; }
        if (sizeModifier === 'S') { width = "60px"; height = "8px"; }

        const container = document.createElement("div");
        container.style.width = width;
        container.style.height = height;
        container.style.display = "inline-flex";
        container.style.border = "1px solid var(--text-muted)";
        container.style.borderRadius = "2px";
        container.style.overflow = "hidden";

        let safeCurrent = Math.max(0, Math.min(current, max));
        if (max <= 0) max = 1;

        for (let i = 0; i < max; i++) {
            const segment = document.createElement("div");
            segment.style.flex = "1";
            segment.style.height = "100%";
            if (i < safeCurrent) {
                segment.style.backgroundColor = "var(--color-red, #ff5555)";
            } else {
                segment.style.backgroundColor = "var(--background-primary)";
            }
            if (i < max - 1) {
                segment.style.borderRight = "1px solid var(--background-modifier-border)";
            }
            container.appendChild(segment);
        }

        return container;
    }
}

// ==========================================
// FEATURE: LCP Importer
// ==========================================
class LcpImporterFeature {
    constructor(plugin) {
        this.plugin = plugin;
    }

    load() {
        this.plugin.addCommand({
            id: 'import-lcp-file',
            name: 'Import Lancer LCP File',
            callback: () => this.importLcp()
        });
        
        this.plugin.addRibbonIcon('box', 'Import Lancer LCP', () => {
            this.importLcp();
        });
    }

    importLcp() {
        new Notice('Bitte wähle eine LCP-Datei aus...');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.lcp,.zip';
        
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) {
                new Notice('Keine Datei ausgewählt!');
                return;
            }
            
            try {
                new Notice(`Lese ${file.name} in den Speicher...`);
                
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                const vaultPath = this.plugin.app.vault.adapter.getBasePath();
                const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', 'lancer-companion');
                const tempLcpPath = path.join(pluginDir, 'temp_import.lcp');
                
                // Write the file to the plugin directory temporarily
                fs.writeFileSync(tempLcpPath, buffer);
                
                const pythonScript = path.join(pluginDir, 'lcp_parser.py');
                new Notice(`Starte Python-Skript für Daten-Extraktion...`);

                const command = `python "${pythonScript}" "${tempLcpPath}" "${vaultPath}"`;
                
                exec(command, (error, stdout, stderr) => {
                    // Clean up temp file
                    if (fs.existsSync(tempLcpPath)) {
                        fs.unlinkSync(tempLcpPath);
                    }
                    
                    if (error) {
                        console.error("Python Error:", error);
                        console.error("Stderr:", stderr);
                        new Notice(`Fehler im Python-Skript! Details in der Konsole. Code: ${error.code}`);
                        return;
                    }
                    new Notice('Erfolgreich importiert! Neue NPC-Notizen wurden erstellt.');
                    console.log('LCP Importer Output:', stdout);
                });
            } catch (err) {
                console.error(err);
                new Notice('Fehler beim Einlesen der Datei!');
            }
        };
        input.click();
    }
}

// ==========================================
// FEATURE: Mech Statblocks
// ==========================================
class StatblockFeature {
    constructor(plugin) {
        this.plugin = plugin;
    }

    load() {
        this.plugin.registerMarkdownCodeBlockProcessor("lancer-stats", (source, el, ctx) => {
            const container = document.createElement("div");
            container.style.position = "relative";
            container.style.display = "grid";
            container.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
            container.style.gap = "4px";
            container.style.margin = "10px 0";
            container.style.backgroundColor = "var(--background-secondary)";
            container.style.padding = "10px";
            container.style.border = "1px solid var(--text-accent)";
            container.style.borderTop = "4px solid var(--text-accent)";
            
            const lines = source.split('\n');
            let currentTier = 0; // 0=T1, 1=T2, 2=T3
            let statsData = []; // Array of objects {key, vals: []}
            let headerText = "🤖 Basis-Stats";

            for (let line of lines) {
                if (!line.trim()) continue;
                
                let parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const valRaw = parts.slice(1).join(':').trim();
                    const vals = valRaw.split(',').map(v => v.trim());
                    statsData.push({ key, vals });
                } else {
                    if (line.includes("Tier") && line.includes("1")) {
                        // Ignore the static tier header if it's there
                        continue;
                    }
                    headerText = line.trim();
                }
            }

            const header = document.createElement("div");
            header.innerText = headerText + " (TIER 1)";
            header.style.gridColumn = "1 / -1";
            header.style.color = "var(--text-accent)";
            header.style.fontWeight = "bold";
            header.style.textTransform = "uppercase";
            header.style.borderBottom = "1px solid var(--text-muted)";
            header.style.paddingBottom = "2px";
            header.style.marginBottom = "8px";
            container.appendChild(header);

            // Create toggle buttons if we have multiple tiers
            const hasMultipleTiers = statsData.some(s => s.vals.length > 1);
            if (hasMultipleTiers) {
                const toggleContainer = document.createElement("div");
                toggleContainer.style.position = "absolute";
                toggleContainer.style.top = "5px";
                toggleContainer.style.right = "10px";
                toggleContainer.style.display = "flex";
                toggleContainer.style.gap = "5px";

                const updateTier = (tierIndex) => {
                    currentTier = tierIndex;
                    header.innerText = headerText + ` (TIER ${tierIndex + 1})`;
                    // Update all value elements
                    container.querySelectorAll('.stat-val').forEach((el, idx) => {
                        const vals = statsData[idx].vals;
                        el.innerText = vals[tierIndex] || vals[0] || "-";
                    });
                    // Update button active state
                    toggleContainer.childNodes.forEach((btn, idx) => {
                        btn.style.backgroundColor = idx === tierIndex ? "var(--text-accent)" : "transparent";
                        btn.style.color = idx === tierIndex ? "var(--background-primary)" : "var(--text-accent)";
                    });
                };

                for (let i = 0; i < 3; i++) {
                    const btn = document.createElement("button");
                    btn.innerText = `T${i + 1}`;
                    btn.style.padding = "2px 6px";
                    btn.style.fontSize = "0.75em";
                    btn.style.cursor = "pointer";
                    btn.style.border = "1px solid var(--text-accent)";
                    btn.style.backgroundColor = i === 0 ? "var(--text-accent)" : "transparent";
                    btn.style.color = i === 0 ? "var(--background-primary)" : "var(--text-accent)";
                    btn.onclick = () => updateTier(i);
                    toggleContainer.appendChild(btn);
                }
                container.appendChild(toggleContainer);
            }
            
            for (let stat of statsData) {
                const statBox = document.createElement("div");
                statBox.style.display = "flex";
                statBox.style.flexDirection = "column";
                statBox.style.alignItems = "center";
                statBox.style.justifyContent = "center";
                statBox.style.backgroundColor = "var(--background-primary)";
                statBox.style.border = "1px solid var(--background-modifier-border)";
                statBox.style.padding = "8px 4px";
                
                const valEl = document.createElement("div");
                valEl.className = "stat-val";
                valEl.innerText = stat.vals[0] || "-";
                valEl.style.fontSize = "1.4em";
                valEl.style.fontWeight = "bold";
                valEl.style.color = "var(--text-normal)";
                
                const keyEl = document.createElement("div");
                keyEl.innerText = stat.key.toUpperCase();
                keyEl.style.fontSize = "0.7em";
                keyEl.style.color = "var(--text-muted)";
                keyEl.style.letterSpacing = "1px";
                
                statBox.appendChild(valEl);
                statBox.appendChild(keyEl);
                container.appendChild(statBox);
            }
            
            el.appendChild(container);
        });
    }
}

// ==========================================
// FEATURE: Encounter Tracker (Sidebar)
// ==========================================
const VIEW_TYPE_ENCOUNTER_TRACKER = "lancer-encounter-tracker";

class EncounterTrackerView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.selectedTiers = {}; // Stores { basename: tierIndex }
    }

    getViewType() {
        return VIEW_TYPE_ENCOUNTER_TRACKER;
    }

    getDisplayText() {
        return "Encounter Tracker";
    }

    getIcon() {
        return "target";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        
        const header = container.createEl("h3", { text: "UNION_OS // ENCOUNTERS" });
        header.style.color = "var(--text-accent)";
        header.style.textTransform = "uppercase";
        header.style.borderBottom = "1px solid var(--text-muted)";
        header.style.paddingBottom = "5px";
        
        this.contentEl = container.createEl("div");
        this.contentEl.className = "lancer-tracker-content";
        
        this.updateView(this.plugin.app.workspace.getActiveFile());
    }

    async onClose() {
        // Cleanup if needed
    }

    async updateView(file) {
        if (!this.contentEl) return;
        this.contentEl.empty();
        
        if (!file) {
            this.contentEl.createEl("p", { text: "Keine aktive Datei." });
            return;
        }

        const cache = this.plugin.app.metadataCache.getFileCache(file);
        if (!cache || !cache.links) {
            this.contentEl.createEl("p", { text: "Keine Charaktere in dieser Notiz erwähnt.", cls: "text-muted" });
            return;
        }

        let combatNpcs = [];
        let storyNpcs = [];
        
        const uniqueLinks = new Map();
        
        for (let l of cache.links) {
            const basename = l.link.split('#')[0];
            const hash = l.link.split('#')[1];
            if (!uniqueLinks.has(basename)) {
                uniqueLinks.set(basename, hash);
            }
        }

        for (let [basename, hash] of uniqueLinks.entries()) {
            const linkedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(basename, file.path);
            if (!linkedFile) continue;

            const linkedCache = this.plugin.app.metadataCache.getFileCache(linkedFile);
            if (!linkedCache || !linkedCache.frontmatter) continue;

            const fm = linkedCache.frontmatter;
            const tags = fm.tags || [];
            
            // Check hash for Tier preference (e.g. [[BASTION#T2]])
            if (hash) {
                const upperHash = hash.toUpperCase();
                if (upperHash === "T1") this.selectedTiers[linkedFile.basename] = 0;
                if (upperHash === "T2") this.selectedTiers[linkedFile.basename] = 1;
                if (upperHash === "T3") this.selectedTiers[linkedFile.basename] = 2;
            }
            
            // Determine if combat or story
            const hasStats = fm.HP !== undefined || fm.hp !== undefined;
            const isClass = tags.includes("NPC_Class") || tags.includes("Mech");
            
            if (hasStats || isClass) {
                combatNpcs.push({ name: linkedFile.basename, fm: fm, file: linkedFile });
            } else if (tags.includes("NPC")) {
                storyNpcs.push({ name: linkedFile.basename, fm: fm, file: linkedFile });
            }
        }

        if (combatNpcs.length === 0 && storyNpcs.length === 0) {
            this.contentEl.createEl("p", { text: "Keine Charaktere in dieser Notiz erwähnt.", cls: "text-muted" });
            return;
        }
        
        if (storyNpcs.length > 0) {
            const storyHeader = this.contentEl.createEl("div", { text: "STORY CHARAKTERE" });
            storyHeader.style.color = "var(--text-muted)";
            storyHeader.style.fontWeight = "bold";
            storyHeader.style.fontSize = "0.8em";
            storyHeader.style.marginBottom = "8px";
            storyHeader.style.letterSpacing = "1px";
            
            for (let npc of storyNpcs) {
                this.renderStoryCard(npc.name, npc.fm, npc.file);
            }
        }
        
        if (combatNpcs.length > 0) {
            const combatHeader = this.contentEl.createEl("div", { text: "COMBAT MECHS" });
            combatHeader.style.color = "var(--text-muted)";
            combatHeader.style.fontWeight = "bold";
            combatHeader.style.fontSize = "0.8em";
            combatHeader.style.marginTop = "15px";
            combatHeader.style.marginBottom = "8px";
            combatHeader.style.letterSpacing = "1px";
            
            for (let npc of combatNpcs) {
                this.renderMiniCard(npc.name, npc.fm, npc.file);
            }
        }
    }

    renderStoryCard(name, fm, file) {
        const card = this.contentEl.createEl("div");
        card.style.border = "1px solid var(--border-color)";
        card.style.borderLeft = "3px solid var(--text-normal)";
        card.style.backgroundColor = "var(--background-secondary)";
        card.style.padding = "6px 10px";
        card.style.marginBottom = "6px";
        card.style.borderRadius = "2px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.cursor = "pointer";
        
        card.onclick = () => {
            this.plugin.app.workspace.getLeaf('tab').openFile(file);
        };
        card.addEventListener("mouseenter", () => card.style.backgroundColor = "var(--background-secondary-alt)");
        card.addEventListener("mouseleave", () => card.style.backgroundColor = "var(--background-secondary)");

        const title = card.createEl("div", { text: name.toUpperCase() });
        title.style.fontWeight = "bold";
        title.style.color = "var(--text-normal)";
        
        let details = [];
        if (fm.fraktion) details.push(fm.fraktion);
        if (fm.rolle) details.push(fm.rolle);
        
        if (details.length > 0) {
            const sub = card.createEl("div", { text: details.join(" • ") });
            sub.style.fontSize = "0.75em";
            sub.style.color = "var(--text-muted)";
        }
    }

    renderMiniCard(name, stats, file) {
        const card = this.contentEl.createEl("div");
        card.style.position = "relative";
        card.style.border = "1px solid var(--text-accent)";
        card.style.borderTop = "3px solid var(--text-accent)";
        card.style.backgroundColor = "var(--background-secondary)";
        card.style.padding = "8px";
        card.style.marginBottom = "10px";
        card.style.borderRadius = "2px";
        card.style.cursor = "pointer";
        
        card.onclick = (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't trigger if clicking tier buttons
            this.plugin.app.workspace.getLeaf('tab').openFile(file);
        };
        card.addEventListener("mouseenter", () => card.style.backgroundColor = "var(--background-secondary-alt)");
        card.addEventListener("mouseleave", () => card.style.backgroundColor = "var(--background-secondary)");

        const title = card.createEl("div", { text: name.toUpperCase() });
        title.style.fontWeight = "bold";
        title.style.color = "var(--text-normal)";
        title.style.marginBottom = "5px";
        title.style.borderBottom = "1px dashed var(--border-color)";
        
        const grid = card.createEl("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(3, 1fr)";
        grid.style.gap = "4px";
        
        const parseStat = (val) => val ? String(val).split(',').map(s => s.trim()) : ["-"];
        
        const hpArr = parseStat(stats.HP || stats.hp);
        const armorArr = parseStat(stats.Armor || stats.armor || "0");
        const evaArr = parseStat(stats.Evasion || stats.evasion);
        const edefArr = parseStat(stats["E-Defense"] || stats["e-defense"] || stats.edef);
        const speedArr = parseStat(stats.Speed || stats.speed);
        
        let currentTier = this.selectedTiers[name] || 0;
        const boxes = [];
        
        boxes.push(this.createStatBox(grid, "HP", hpArr[currentTier] || hpArr[0], "var(--color-red, #ff5555)"));
        boxes.push(this.createStatBox(grid, "ARMOR", armorArr[currentTier] || armorArr[0]));
        boxes.push(this.createStatBox(grid, "EVA", evaArr[currentTier] || evaArr[0]));
        boxes.push(this.createStatBox(grid, "E-DEF", edefArr[currentTier] || edefArr[0]));
        boxes.push(this.createStatBox(grid, "SPD", speedArr[currentTier] || speedArr[0]));

        // Check if we need Tier toggle buttons
        if (hpArr.length > 1) {
            const toggleContainer = card.createEl("div");
            toggleContainer.style.position = "absolute";
            toggleContainer.style.top = "5px";
            toggleContainer.style.right = "5px";
            toggleContainer.style.display = "flex";
            toggleContainer.style.gap = "2px";

            for (let i = 0; i < 3; i++) {
                const btn = document.createElement("button");
                btn.innerText = `T${i + 1}`;
                btn.style.padding = "0px 4px";
                btn.style.fontSize = "0.65em";
                btn.style.cursor = "pointer";
                btn.style.border = "1px solid var(--text-accent)";
                btn.style.backgroundColor = i === currentTier ? "var(--text-accent)" : "transparent";
                btn.style.color = i === currentTier ? "var(--background-primary)" : "var(--text-accent)";
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.selectedTiers[name] = i;
                    // Re-render the grid values
                    boxes[0].innerText = hpArr[i] || hpArr[0];
                    boxes[1].innerText = armorArr[i] || armorArr[0];
                    boxes[2].innerText = evaArr[i] || evaArr[0];
                    boxes[3].innerText = edefArr[i] || edefArr[0];
                    boxes[4].innerText = speedArr[i] || speedArr[0];
                    
                    toggleContainer.childNodes.forEach((b, idx) => {
                        b.style.backgroundColor = idx === i ? "var(--text-accent)" : "transparent";
                        b.style.color = idx === i ? "var(--background-primary)" : "var(--text-accent)";
                    });
                };
                toggleContainer.appendChild(btn);
            }
        }
    }
    
    createStatBox(parent, label, value, color) {
        const box = parent.createEl("div");
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.alignItems = "center";
        box.style.backgroundColor = "var(--background-primary)";
        box.style.border = "1px solid var(--background-modifier-border)";
        box.style.padding = "4px 2px";

        const valEl = box.createEl("div", { text: value });
        valEl.style.fontWeight = "bold";
        valEl.style.fontSize = "1.1em";
        if (color) valEl.style.color = color;
        
        const lblEl = box.createEl("div", { text: label });
        lblEl.style.fontSize = "0.65em";
        lblEl.style.color = "var(--text-muted)";
        
        return valEl;
    }
}


// ==========================================
// MAIN PLUGIN ENTRY POINT
// ==========================================
module.exports = class LancerCompanionPlugin extends Plugin {
    async onload() {
        console.log("Lancer Companion Plugin loaded");
        
        this.clocksFeature = new ClocksFeature(this);
        this.lcpImporterFeature = new LcpImporterFeature(this);
        this.statblockFeature = new StatblockFeature(this);

        this.clocksFeature.load();
        this.lcpImporterFeature.load();
        this.statblockFeature.load();

        // Register Encounter Tracker View
        this.registerView(
            VIEW_TYPE_ENCOUNTER_TRACKER,
            (leaf) => new EncounterTrackerView(leaf, this)
        );

        this.addCommand({
            id: 'open-encounter-tracker',
            name: 'Open Encounter Tracker',
            callback: () => this.activateTrackerView()
        });
        
        this.addRibbonIcon('target', 'Encounter Tracker', () => {
            this.activateTrackerView();
        });

        // Update Tracker when file opens
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.updateTrackerViews(file);
            })
        );
        
        // Update Tracker when metadata changes (user types a new link)
        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                if (this.app.workspace.getActiveFile() === file) {
                    this.updateTrackerViews(file);
                }
            })
        );
    }
    
    async activateTrackerView() {
        const { workspace } = this.app;
        
        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_ENCOUNTER_TRACKER);
        
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_ENCOUNTER_TRACKER, active: true });
        }
        
        workspace.revealLeaf(leaf);
    }
    
    updateTrackerViews(file) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ENCOUNTER_TRACKER);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof EncounterTrackerView) {
                leaf.view.updateView(file);
            }
        });
    }

    onunload() {
        console.log("Lancer Companion Plugin unloaded");
    }
}
