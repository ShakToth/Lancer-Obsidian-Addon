const { Plugin, ItemView, WorkspaceLeaf, Notice, MarkdownPostProcessorContext, Platform, Modal, Setting } = require('obsidian');
let JSZip = null;

const I18N = {
    de: {
        import_lcp: "LCP Daten Importieren",
        import_modal_title: "LCP Import Einstellungen",
        npc_classes: "NPC Klassen",
        npc_classes_desc: "Feind-Statblocks (z.B. Aegis, Archer) extrahieren",
        npc_templates: "NPC Templates",
        npc_templates_desc: "Feind-Vorlagen (z.B. Elite, Veteran) extrahieren",
        player_data: "Spieler-Daten (Waffen, Mechs, etc.)",
        player_data_desc: "Alle anderen Daten als rohes Markdown importieren",
        btn_select_import: "Datei auswählen & Importieren",
        select_file: "Bitte wähle eine LCP-Datei aus...",
        no_file: "Keine Datei ausgewählt!",
        reading_file: "Lese {name} in den Speicher...",
        starting_python: "Starte Python-Skript für Daten-Extraktion...",
        script_error: "Fehler im Skript: {err}",
        import_success: "Erfolgreich importiert! Neue Notizen wurden erstellt.",
        read_error: "Fehler beim Einlesen der Datei!",
        base_stats: "Basis-Stats"
    },
    en: {
        import_lcp: "Import LCP Data",
        import_modal_title: "LCP Import Settings",
        npc_classes: "NPC Classes",
        npc_classes_desc: "Extract Enemy Statblocks (e.g. Aegis, Archer)",
        npc_templates: "NPC Templates",
        npc_templates_desc: "Extract Enemy Templates (e.g. Elite, Veteran)",
        player_data: "Player Data (Weapons, Mechs, etc.)",
        player_data_desc: "Import all other data as raw markdown",
        btn_select_import: "Select File & Import",
        select_file: "Please select an LCP file...",
        no_file: "No file selected!",
        reading_file: "Reading {name} into memory...",
        starting_python: "Starting Python script for data extraction...",
        script_error: "Script Error: {err}",
        import_success: "Successfully imported! New notes created.",
        read_error: "Error reading file!",
        base_stats: "Base Stats"
    }
};

function getT() {
    const lang = window.moment ? window.moment.locale() : 'en';
    return I18N[lang] || I18N['en'];
}
const { Buffer } = require('buffer');

const LCP_PARSER_PYTHON_BASE64 = "aW1wb3J0IHN5cwppbXBvcnQgemlwZmlsZQppbXBvcnQganNvbgppbXBvcnQgb3MKaW1wb3J0IHJlCgpJMThOID0gewogICAgImRlIjogewogICAgICAgICJiYXNlX3dlYXBvbnMiOiAiQmFzaXMtV2FmZmVuICYgU3lzdGVtZSIsCiAgICAgICAgImF0dGFjayI6ICJBbmdyaWZmIiwKICAgICAgICAiZGFtYWdlIjogIlNjaGFkZW4iLAogICAgICAgICJhdXRvX2V4dHJhY3RlZCI6ICIqKERpZXNlIE5vdGl6IHd1cmRlIGF1dG9tYXRpc2NoIGF1cyBlaW5lciBMQ1AtRGF0ZWkgZXh0cmFoaWVydC4pKiIsCiAgICAgICAgImluZGV4X2VuZW15IjogIioqSW5kZXg6KiogW1tJbmRleF9GZWluZF9TdGF0YmxvY2tzXV0iLAogICAgICAgICJiYXNlX3N0YXRzIjogIkJhc2lzLVN0YXRzIiwKICAgICAgICAidGVtcGxhdGVfZmVhdHVyZXMiOiAiVGVtcGxhdGUgRmVhdHVyZXMiLAogICAgICAgICJlZmZlY3QiOiAiRWZmZWt0IgogICAgfSwKICAgICJlbiI6IHsKICAgICAgICAiYmFzZV93ZWFwb25zIjogIkJhc2UgV2VhcG9ucyAmIFN5c3RlbXMiLAogICAgICAgICJhdHRhY2siOiAiQXR0YWNrIiwKICAgICAgICAiZGFtYWdlIjogIkRhbWFnZSIsCiAgICAgICAgImF1dG9fZXh0cmFjdGVkIjogIiooVGhpcyBub3RlIHdhcyBhdXRvbWF0aWNhbGx5IGV4dHJhY3RlZCBmcm9tIGFuIExDUCBmaWxlLikqIiwKICAgICAgICAiaW5kZXhfZW5lbXkiOiAiKipJbmRleDoqKiBbW0luZGV4X0VuZW15X1N0YXRibG9ja3NdXSIsCiAgICAgICAgImJhc2Vfc3RhdHMiOiAiQmFzZSBTdGF0cyIsCiAgICAgICAgInRlbXBsYXRlX2ZlYXR1cmVzIjogIlRlbXBsYXRlIEZlYXR1cmVzIiwKICAgICAgICAiZWZmZWN0IjogIkVmZmVjdCIKICAgIH0KfQoKZGVmIGdldF9pMThuKGxhbmcpOgogICAgcmV0dXJuIEkxOE4uZ2V0KGxhbmcsIEkxOE5bImVuIl0pCgpkZWYgc3RyaXBfaHRtbCh0ZXh0KToKICAgIGlmIG5vdCBpc2luc3RhbmNlKHRleHQsIHN0cik6CiAgICAgICAgcmV0dXJuICIiCiAgICByZXR1cm4gcmUuc3ViKCc8W148XSs+JywgJycsIHRleHQpCgpkZWYgcHJvY2Vzc19ucGNfY2xhc3Nlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QsIGxhbmcpOgogICAgdCA9IGdldF9pMThuKGxhbmcpCiAgICB0YXJnZXRfZGlyID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICIwMF9SZWdlbG4iLCAiRmVpbmRfU3RhdGJsb2NrcyIpCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgCiAgICB0cnk6CiAgICAgICAgY2xhc3NlcyA9IGpzb24ubG9hZHMoei5yZWFkKCJucGNfY2xhc3Nlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgZXhjZXB0IEtleUVycm9yOgogICAgICAgIHJldHVybgogICAgICAgIAogICAgZm9yIG5wYyBpbiBjbGFzc2VzOgogICAgICAgIG5hbWUgPSBucGMuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIHN0YXRzID0gbnBjLmdldCgic3RhdHMiLCB7fSkKICAgICAgICBocCA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImhwIiwgWzBdKSkpCiAgICAgICAgZXZhc2lvbiA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImV2YXNpb24iLCBzdGF0cy5nZXQoImV2YWRlIiwgWzBdKSkpKQogICAgICAgIGVkZWYgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJlZGVmIiwgWzBdKSkpCiAgICAgICAgYXJtb3IgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJhcm1vciIsIFswXSkpKQogICAgICAgIHNwZWVkID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic3BlZWQiLCBbMF0pKSkKICAgICAgICBzZW5zb3JzID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic2Vuc29yIiwgWzBdKSkpCiAgICAgICAgc2F2ZSA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoInNhdmUiLCBbMF0pKSkKICAgICAgICBlYXR0YWNrID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgiZWF0dGFjayIsIHN0YXRzLmdldCgidGVjaF9hdHRhY2siLCBbMF0pKSkpCiAgICAgICAgaGVhdGNhcCA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImhlYXRjYXAiLCBbMF0pKSkKICAgICAgICBodWxsID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgiaHVsbCIsIFswXSkpKQogICAgICAgIGFnaSA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImFnaSIsIFswXSkpKQogICAgICAgIHN5cyA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoInN5cyIsIFswXSkpKQogICAgICAgIGVuZyA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImVuZyIsIFswXSkpKQogICAgICAgIHNpemUgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJzaXplIiwgWzFdKSkpCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gPSBmIiMjIOKalO+4jyB7dFsnYmFzZV93ZWFwb25zJ119XG4iCiAgICAgICAgYmFzZV9mZWF0dXJlcyA9IG5wYy5nZXQoImJhc2VfZmVhdHVyZXMiLCBbXSkKICAgICAgICBmb3IgZl9pZCBpbiBiYXNlX2ZlYXR1cmVzOgogICAgICAgICAgICBpZiBmX2lkIGluIGZlYXR1cmVfZGljdDoKICAgICAgICAgICAgICAgIGYgPSBmZWF0dXJlX2RpY3RbZl9pZF0KICAgICAgICAgICAgICAgIGZfbmFtZSA9IGYuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgICAgICAgICAgZl90eXBlID0gZi5nZXQoInR5cGUiLCAiVHJhaXQiKQogICAgICAgICAgICAgICAgd190eXBlID0gZi5nZXQoIndlYXBvbl90eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGZfdHlwZSA9PSAiV2VhcG9uIjoKICAgICAgICAgICAgICAgICAgICBhdHRfYm9udXMgPSBmLmdldCgiYXR0YWNrX2JvbnVzIiwgWzBdKVswXQogICAgICAgICAgICAgICAgICAgIGRtZ19saXN0ID0gZi5nZXQoImRhbWFnZSIsIFtdKQogICAgICAgICAgICAgICAgICAgIGRtZ19zdHIgPSAiIgogICAgICAgICAgICAgICAgICAgIGlmIGRtZ19saXN0OgogICAgICAgICAgICAgICAgICAgICAgICBkID0gZG1nX2xpc3RbMF0KICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3ZhbCA9IGQuZ2V0KCJkYW1hZ2UiLCBbMF0pWzBdIGlmIGlzaW5zdGFuY2UoZC5nZXQoImRhbWFnZSIpLCBsaXN0KSBlbHNlIGQuZ2V0KCJ2YWwiLCAwKQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdHlwZSA9IGQuZ2V0KCJ0eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ19zdHIgPSBmIntkbWdfdmFsfSB7ZG1nX3R5cGV9IgogICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzX21hcmtkb3duICs9IGYiLSAqKntmX25hbWV9KiogKHt3X3R5cGV9KVxuICAtIHt0WydhdHRhY2snXX06ICt7YXR0X2JvbnVzfSB8IHt0WydkYW1hZ2UnXX06IHtkbWdfc3RyfVxuIgogICAgICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGYuZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgICAgICAgICAgICAgaWYgbGVuKGVmZmVjdCkgPiAzMDA6CiAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IGVmZmVjdFs6Mjk3XSArICIuLi4iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe2ZfdHlwZX0pXG4gIC0ge2VmZmVjdH1cbiIKCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gIgojIyA/PyBPcHRpb25hbCBGZWF0dXJlcwoiCiAgICAgICAgb3B0aW9uYWxfZmVhdHVyZXMgPSBucGMuZ2V0KCJvcHRpb25hbF9mZWF0dXJlcyIsIFtdKQogICAgICAgIGZvciBmX2lkIGluIG9wdGlvbmFsX2ZlYXR1cmVzOgogICAgICAgICAgICBpZiBmX2lkIGluIGZlYXR1cmVfZGljdDoKICAgICAgICAgICAgICAgIGYgPSBmZWF0dXJlX2RpY3RbZl9pZF0KICAgICAgICAgICAgICAgIGZfbmFtZSA9IGYuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgICAgICAgICAgZl90eXBlID0gZi5nZXQoInR5cGUiLCAiVHJhaXQiKQogICAgICAgICAgICAgICAgd190eXBlID0gZi5nZXQoIndlYXBvbl90eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGZfdHlwZSA9PSAiV2VhcG9uIjoKICAgICAgICAgICAgICAgICAgICBhdHRfYm9udXMgPSBmLmdldCgiYXR0YWNrX2JvbnVzIiwgWzBdKVswXSBpZiBmLmdldCgiYXR0YWNrX2JvbnVzIikgZWxzZSAwCiAgICAgICAgICAgICAgICAgICAgZG1nX2xpc3QgPSBmLmdldCgiZGFtYWdlIiwgW10pCiAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9ICIiCiAgICAgICAgICAgICAgICAgICAgaWYgZG1nX2xpc3Q6CiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBkbWdfbGlzdFswXQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdmFsID0gZC5nZXQoImRhbWFnZSIsIFswXSlbMF0gaWYgaXNpbnN0YW5jZShkLmdldCgiZGFtYWdlIiksIGxpc3QpIGVsc2UgZC5nZXQoInZhbCIsIDApCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ190eXBlID0gZC5nZXQoInR5cGUiLCAiIikKICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9IGYie2RtZ192YWx9IHtkbWdfdHlwZX0iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe3dfdHlwZX0pCiAgLSB7dFsnYXR0YWNrJ119OiAre2F0dF9ib251c30gfCB7dFsnZGFtYWdlJ119OiB7ZG1nX3N0cn0KIgogICAgICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGYuZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgICAgICAgICAgICAgaWYgbGVuKGVmZmVjdCkgPiAzMDA6CiAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IGVmZmVjdFs6Mjk3XSArICIuLi4iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe2ZfdHlwZX0pCiAgLSB7ZWZmZWN0fQoiCgogICAgICAgIGZhbGxiYWNrX2NvbnRlbnQgPSBmIlwiXCJcIi0tLVxudGFnczpcbiAgLSBOUENfQ2xhc3NcbkhQOiB7aHB9XG5Bcm1vcjoge2FybW9yfVxuRXZhc2lvbjoge2V2YXNpb259XG5FLURlZmVuc2U6IHtlZGVmfVxuU3BlZWQ6IHtzcGVlZH1cblNlbnNvciBSYW5nZToge3NlbnNvcnN9XG4tLS1cbiMge25hbWV9XG5cbnt7e3tMQU5DRVJfU1RBVFN9fX19XG5cbnt0WydhdXRvX2V4dHJhY3RlZCddfVxuXG4tLS1cbnt0WydpbmRleF9lbmVteSddfVxuXCJcIlwiIgogICAgICAgIAogICAgICAgIHRlbXBsYXRlX3BhdGggPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjk5X1RFTVBMQVRFUyIsICJUZW1wbGF0ZV9NZWNoLm1kIikKICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gZmFsbGJhY2tfY29udGVudAogICAgICAgIGlmIG9zLnBhdGguZXhpc3RzKHRlbXBsYXRlX3BhdGgpOgogICAgICAgICAgICB3aXRoIG9wZW4odGVtcGxhdGVfcGF0aCwgInIiLCBlbmNvZGluZz0idXRmLTgiKSBhcyB0ZjoKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSB0Zi5yZWFkKCkKICAgICAgICAgICAgCiAgICAgICAgICAgIHlhbWxfcmVnZXggPSByZS5jb21waWxlKHIiXi0tLVxuKFtcc1xTXSo/KVxuLS0tIikKICAgICAgICAgICAgbWF0Y2ggPSB5YW1sX3JlZ2V4LnNlYXJjaCh0ZW1wbGF0ZV90ZXh0KQogICAgICAgICAgICBtZXJnZWRfeWFtbCA9IGYiLS0tXG50YWdzOlxuICAtIE5QQ19DbGFzc1xuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cblNhdmUgVGFyZ2V0OiB7c2F2ZX1cblRlY2ggQXR0YWNrOiB7ZWF0dGFja31cbkhlYXRjYXA6IHtoZWF0Y2FwfVxuSHVsbDoge2h1bGx9XG5BZ2lsaXR5OiB7YWdpfVxuU3lzdGVtczoge3N5c31cbkVuZ2luZWVyaW5nOiB7ZW5nfVxuU2l6ZToge3NpemV9XG4iCiAgICAgICAgICAgIGlmIG1hdGNoOgogICAgICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxue21hdGNoLmdyb3VwKDEpfVxuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cblNhdmUgVGFyZ2V0OiB7c2F2ZX1cblRlY2ggQXR0YWNrOiB7ZWF0dGFja31cbkhlYXRjYXA6IHtoZWF0Y2FwfVxuSHVsbDoge2h1bGx9XG5BZ2lsaXR5OiB7YWdpfVxuU3lzdGVtczoge3N5c31cbkVuZ2luZWVyaW5nOiB7ZW5nfVxuU2l6ZToge3NpemV9XG4tLS0iCiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0geWFtbF9yZWdleC5zdWIobWVyZ2VkX3lhbWwsIHRlbXBsYXRlX3RleHQsIDEpCiAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gbWVyZ2VkX3lhbWwgKyAiLS0tXG4iICsgdGVtcGxhdGVfdGV4dAoKICAgICAgICBzdGF0c19ibG9jayA9IGYiYGxhbmNlci1zdGF0c1xu8J+TiiB7dFsnYmFzZV9zdGF0cyddfQpIUDoge2hwfQpBcm1vcjoge2FybW9yfQpFdmFzaW9uOiB7ZXZhc2lvbn0KRS1EZWZlbnNlOiB7ZWRlZn0KU3BlZWQ6IHtzcGVlZH0KU2Vuc29yIFJhbmdlOiB7c2Vuc29yc30KU2F2ZSBUYXJnZXQ6IHtzYXZlfQpIZWF0Y2FwOiB7aGVhdGNhcH0KSHVsbDoge2h1bGx9CkFnaWxpdHk6IHthZ2l9ClN5c3RlbXM6IHtzeXN9CkVuZ2luZWVyaW5nOiB7ZW5nfQpTaXplOiB7c2l6ZX0KYAp7ZmVhdHVyZXNfbWFya2Rvd259IgoKICAgICAgICBjb250ZW50ID0gdGVtcGxhdGVfdGV4dAogICAgICAgIGlmICJ7e0xBTkNFUl9TVEFUU319IiBpbiBjb250ZW50OgogICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCJ7e0xBTkNFUl9TVEFUU319Iiwgc3RhdHNfYmxvY2spCiAgICAgICAgZWxzZToKICAgICAgICAgICAgY29udGVudCArPSAiXG5cbiIgKyBzdGF0c19ibG9jawogICAgICAgICAgICAKICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCI8JSB0cC5maWxlLnRpdGxlICU+IiwgbmFtZSkKICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCJ7e25hbWV9fSIsIG5hbWUpCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgcHJvY2Vzc19ucGNfdGVtcGxhdGVzKHosIHZhdWx0X3BhdGgsIGZlYXR1cmVfZGljdCwgbGFuZyk6CiAgICB0ID0gZ2V0X2kxOG4obGFuZykKICAgIHRhcmdldF9kaXIgPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjAwX1JlZ2VsbiIsICJGZWluZF9UZW1wbGF0ZXMiKQogICAgb3MubWFrZWRpcnModGFyZ2V0X2RpciwgZXhpc3Rfb2s9VHJ1ZSkKICAgIHRyeToKICAgICAgICB0ZW1wbGF0ZXMgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX3RlbXBsYXRlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgZXhjZXB0IEtleUVycm9yOgogICAgICAgIHJldHVybgoKICAgIGZvciB0ZW1wIGluIHRlbXBsYXRlczoKICAgICAgICBuYW1lID0gdGVtcC5nZXQoIm5hbWUiLCAiVW5rbm93biIpCiAgICAgICAgZGVzYyA9IHN0cmlwX2h0bWwodGVtcC5nZXQoImRlc2NyaXB0aW9uIiwgIiIpKQogICAgICAgIAogICAgICAgIGZlYXR1cmVzX21hcmtkb3duID0gZiIjIyDimpTvuI8ge3RbJ3RlbXBsYXRlX2ZlYXR1cmVzJ119XG4iCiAgICAgICAgYmFzZV9mZWF0dXJlcyA9IHRlbXAuZ2V0KCJiYXNlX2ZlYXR1cmVzIiwgW10pCiAgICAgICAgZm9yIGZfaWQgaW4gYmFzZV9mZWF0dXJlczoKICAgICAgICAgICAgaWYgZl9pZCBpbiBmZWF0dXJlX2RpY3Q6CiAgICAgICAgICAgICAgICBmID0gZmVhdHVyZV9kaWN0W2ZfaWRdCiAgICAgICAgICAgICAgICBmX25hbWUgPSBmLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICAgICAgICAgIGVmZmVjdCA9IHN0cmlwX2h0bWwoZi5nZXQoImVmZmVjdCIsICIiKSkKICAgICAgICAgICAgICAgIGZlYXR1cmVzX21hcmtkb3duICs9IGYiLSAqKntmX25hbWV9KipcbiAgLSB7ZWZmZWN0fVxuIgogICAgICAgICAgICAgICAgCiAgICAgICAgY29udGVudCA9IGYiLS0tXG50YWdzOlxuICAtIE5QQ19UZW1wbGF0ZVxuLS0tXG4jIHtuYW1lfVxuXG57ZGVzY31cblxue2ZlYXR1cmVzX21hcmtkb3dufSIKICAgICAgICAKICAgICAgICBzYWZlX25hbWUgPSByZS5zdWIocidbPD46Ii9cXHw/Kl0nLCAnJywgc3RyKG5hbWUpKQogICAgICAgIGZpbGVfcGF0aCA9IG9zLnBhdGguam9pbih0YXJnZXRfZGlyLCBmIntzYWZlX25hbWV9Lm1kIikKICAgICAgICB3aXRoIG9wZW4oZmlsZV9wYXRoLCAidyIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGZpbGU6CiAgICAgICAgICAgIGZpbGUud3JpdGUoY29udGVudCkKCmRlZiBwcm9jZXNzX2dlbmVyaWNfanNvbih6LCBmaWxlbmFtZSwgdmF1bHRfcGF0aCwgbGFuZyk6CiAgICB0ID0gZ2V0X2kxOG4obGFuZykKICAgIGNhdGVnb3J5ID0gZmlsZW5hbWUucmVwbGFjZSgnLmpzb24nLCAnJykudGl0bGUoKQogICAgdGFyZ2V0X2RpciA9IG9zLnBhdGguam9pbih2YXVsdF9wYXRoLCAiMDBfUmVnZWxuIiwgIkxDUF9EYXRhIiwgY2F0ZWdvcnkpCiAgICAKICAgIHRyeToKICAgICAgICBkYXRhID0ganNvbi5sb2Fkcyh6LnJlYWQoZmlsZW5hbWUpLmRlY29kZSgidXRmLTgiKSkKICAgIGV4Y2VwdCBFeGNlcHRpb246CiAgICAgICAgcmV0dXJuCiAgICAgICAgCiAgICBpZiBub3QgaXNpbnN0YW5jZShkYXRhLCBsaXN0KToKICAgICAgICByZXR1cm4KICAgICAgICAKICAgIG9zLm1ha2VkaXJzKHRhcmdldF9kaXIsIGV4aXN0X29rPVRydWUpCiAgICAKICAgIGZvciBpdGVtIGluIGRhdGE6CiAgICAgICAgaWYgbm90IGlzaW5zdGFuY2UoaXRlbSwgZGljdCk6IGNvbnRpbnVlCiAgICAgICAgbmFtZSA9IGl0ZW0uZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIAogICAgICAgIHlhbWxfbGluZXMgPSBbIi0tLSJdCiAgICAgICAgZm9yIGssIHYgaW4gaXRlbS5pdGVtcygpOgogICAgICAgICAgICBpZiBrIGluIFsibmFtZSIsICJkZXNjcmlwdGlvbiIsICJlZmZlY3QiXTogY29udGludWUKICAgICAgICAgICAgaWYgaXNpbnN0YW5jZSh2LCAoc3RyLCBpbnQsIGJvb2wsIGZsb2F0KSk6CiAgICAgICAgICAgICAgICB5YW1sX2xpbmVzLmFwcGVuZChmIntrfToge3Z9IikKICAgICAgICAgICAgZWxpZiBpc2luc3RhbmNlKHYsIGxpc3QpIGFuZCBsZW4odikgPiAwIGFuZCBpc2luc3RhbmNlKHZbMF0sIHN0cik6CiAgICAgICAgICAgICAgICB5YW1sX2xpbmVzLmFwcGVuZChmIntrfTogW3snLCAnLmpvaW4odil9XSIpCiAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoIi0tLSIpCiAgICAgICAgCiAgICAgICAgeWFtbF9mcm9udG1hdHRlciA9ICJcbiIuam9pbih5YW1sX2xpbmVzKQogICAgICAgIGRlc2MgPSBzdHJpcF9odG1sKGl0ZW0uZ2V0KCJkZXNjcmlwdGlvbiIsICIiKSkKICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGl0ZW0uZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgCiAgICAgICAgY29udGVudCA9IGYie3lhbWxfZnJvbnRtYXR0ZXJ9XG4jIHtuYW1lfVxuXG4iCiAgICAgICAgaWYgZGVzYzogY29udGVudCArPSBmIntkZXNjfVxuXG4iCiAgICAgICAgaWYgZWZmZWN0OiBjb250ZW50ICs9IGYiIyMjIHt0WydlZmZlY3QnXX1cbntlZmZlY3R9XG4iCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgbWFpbigpOgogICAgaWYgbGVuKHN5cy5hcmd2KSA8IDQ6CiAgICAgICAgcHJpbnQoIlVzYWdlOiBweXRob24gbGNwX3BhcnNlci5weSA8bGNwX3BhdGg+IDx2YXVsdF9wYXRoPiA8b3B0aW9uc19qc29uPiIpCiAgICAgICAgc3lzLmV4aXQoMSkKCiAgICBsY3BfcGF0aCA9IHN5cy5hcmd2WzFdCiAgICB2YXVsdF9wYXRoID0gc3lzLmFyZ3ZbMl0KICAgIHRyeToKICAgICAgICBvcHRpb25zID0ganNvbi5sb2FkcyhzeXMuYXJndlszXSkKICAgIGV4Y2VwdDoKICAgICAgICBvcHRpb25zID0geyJucGNfY2xhc3NlcyI6IFRydWUsICJucGNfdGVtcGxhdGVzIjogVHJ1ZSwgInBsYXllcl9kYXRhIjogVHJ1ZSwgImxhbmciOiAiZW4ifQogICAgICAgIAogICAgbGFuZyA9IG9wdGlvbnMuZ2V0KCJsYW5nIiwgImVuIikKICAgIAogICAgdHJ5OgogICAgICAgIHdpdGggemlwZmlsZS5aaXBGaWxlKGxjcF9wYXRoLCAncicpIGFzIHo6CiAgICAgICAgICAgIHRyeToKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX2ZlYXR1cmVzLmpzb24iKS5kZWNvZGUoInV0Zi04IikpCiAgICAgICAgICAgIGV4Y2VwdCBLZXlFcnJvcjoKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBbXQogICAgICAgICAgICBmZWF0dXJlX2RpY3QgPSB7ZlsiaWQiXTogZiBmb3IgZiBpbiBmZWF0dXJlc19kYXRhfQogICAgICAgICAgICAKICAgICAgICAgICAgZm9yIGYgaW4gei5uYW1lbGlzdCgpOgogICAgICAgICAgICAgICAgaWYgbm90IGYuZW5kc3dpdGgoJy5qc29uJyk6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICBpZiBmID09ICJsY3BfbWFuaWZlc3QuanNvbiI6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGYgPT0gIm5wY19jbGFzc2VzLmpzb24iOgogICAgICAgICAgICAgICAgICAgIGlmIG9wdGlvbnMuZ2V0KCJucGNfY2xhc3NlcyIsIFRydWUpOgogICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzX25wY19jbGFzc2VzKHosIHZhdWx0X3BhdGgsIGZlYXR1cmVfZGljdCwgbGFuZykKICAgICAgICAgICAgICAgIGVsaWYgZiA9PSAibnBjX3RlbXBsYXRlcy5qc29uIjoKICAgICAgICAgICAgICAgICAgICBpZiBvcHRpb25zLmdldCgibnBjX3RlbXBsYXRlcyIsIFRydWUpOgogICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzX25wY190ZW1wbGF0ZXMoeiwgdmF1bHRfcGF0aCwgZmVhdHVyZV9kaWN0LCBsYW5nKQogICAgICAgICAgICAgICAgZWxpZiBmID09ICJucGNfZmVhdHVyZXMuanNvbiI6CiAgICAgICAgICAgICAgICAgICAgcGFzcyAjIE9ubHkgaW1wb3J0ZWQgd2hlbiBuZWVkZWQgYnkgY2xhc3Nlcy90ZW1wbGF0ZXMKICAgICAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICAgICAgaWYgb3B0aW9ucy5nZXQoInBsYXllcl9kYXRhIiwgVHJ1ZSk6CiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NfZ2VuZXJpY19qc29uKHosIGYsIHZhdWx0X3BhdGgsIGxhbmcpCiAgICAgICAgICAgIAogICAgICAgIHByaW50KCJMQ1AgZXJmb2xncmVpY2ggZXh0cmFoaWVydC4iKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiRmVobGVyOiB7ZX0iKQogICAgICAgIHN5cy5leGl0KDEpCgppZiBfX25hbWVfXyA9PSAiX19tYWluX18iOgogICAgbWFpbigpCgo=";

// ==========================================
// FEATURE: Glossary Tooltips
// ==========================================
class GlossaryFeature {
    constructor(plugin) {
        this.plugin = plugin;
        this.glossary = {
            "PRONE": "Attacks against Prone targets gain +1 Accuracy.\nProne targets are Slowed.\nGetting up costs a standard move.",
            "STUNNED": "Cannot act, overcharge, or move. Max evasion 5.\nAttacks against Stunned gain +1 Accuracy.",
            "SHREDDED": "Armor does not reduce damage.\nCannot benefit from Resistance.",
            "IMPAIRED": "+1 Difficulty on all attacks, saves, and skill checks.",
            "SLOWED": "Cannot boost.\nCan only move standard Speed.",
            "IMMOBILIZED": "Cannot move voluntarily.",
            "JAMMED": "Cannot use comms, make Tech Attacks, or make attacks with anything other than Melee or Improvised weapons.",
            "HIDDEN": "Cannot be targeted by attacks or effects unless they are AoE.\nRevealed if you attack, force a save, or take damage.",
            "INVISIBLE": "All attacks against you have a 50% chance to miss before rolling.",
            "DANGER ZONE": "Heat is at least half of Heat Capacity.",
            "ENGAGED": "Adjacent to a hostile character.\nRanged attacks gain +1 Difficulty."
        };
    }

    load() {
        this.plugin.registerMarkdownPostProcessor((element, context) => {
            const textNodes = this.getTextNodes(element);
            const terms = Object.keys(this.glossary);
            const regexStr = "\\b(" + terms.join("|") + ")\\b";
            const regex = new RegExp(regexStr, "g");
            
            for (let node of textNodes) {
                let match;
                let lastIndex = 0;
                let fragments = [];
                
                while ((match = regex.exec(node.nodeValue)) !== null) {
                    if (match.index > lastIndex) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex, match.index)));
                    }
                    
                    const term = match[1];
                    const span = document.createElement("span");
                    span.className = "lancer-tooltip";
                    span.innerText = term;
                    span.setAttribute("data-tooltip", this.glossary[term]);
                    
                    fragments.push(span);
                    lastIndex = regex.lastIndex;
                }
                
                if (fragments.length > 0) {
                    if (lastIndex < node.nodeValue.length) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex)));
                    }
                    const parent = node.parentNode;
                    if (parent) {
                        fragments.forEach(f => parent.insertBefore(f, node));
                        parent.removeChild(node);
                    }
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
            if (parentTag === 'CODE' || parentTag === 'PRE' || parentTag === 'H1' || parentTag === 'H2' || parentTag === 'H3' || parentTag === 'H4' || parentTag === 'A') continue;
            if (node.parentElement && node.parentElement.classList.contains('lancer-tooltip')) continue;
            textNodes.push(node);
        }
        return textNodes;
    }
}

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
                    if (parent) {
                        fragments.forEach(f => parent.insertBefore(f, node));
                        parent.removeChild(node);
                    }
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
// FEATURE: Dice Roller
// ==========================================
class DiceRollerFeature {
    constructor(plugin) {
        this.plugin = plugin;
    }

    load() {
        this.plugin.registerMarkdownPostProcessor((element, context) => {
            const textNodes = this.getTextNodes(element);
            
            for (let node of textNodes) {
                const regex = /\[Roll:\s*([^\]]+)\]/gi;
                let match;
                let lastIndex = 0;
                let fragments = [];
                
                while ((match = regex.exec(node.nodeValue)) !== null) {
                    if (match.index > lastIndex) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex, match.index)));
                    }
                    
                    const formula = match[1].trim();
                    const container = document.createElement("span");
                    container.style.display = "inline-flex";
                    container.style.alignItems = "center";
                    container.style.gap = "6px";
                    
                    const btn = document.createElement("button");
                    btn.innerText = `🎲 ${formula}`;
                    btn.className = "lancer-dice-button";
                    btn.style.cursor = "pointer";
                    btn.style.padding = "2px 6px";
                    btn.style.fontSize = "0.9em";
                    btn.style.backgroundColor = "var(--background-secondary)";
                    btn.style.border = "1px solid var(--text-accent)";
                    btn.style.color = "var(--text-accent)";
                    btn.style.borderRadius = "4px";
                    
                    const resSpan = document.createElement("span");
                    resSpan.className = "lancer-dice-result";
                    resSpan.style.fontWeight = "bold";
                    resSpan.style.color = "var(--text-normal)";
                    resSpan.style.fontSize = "0.95em";
                    
                    btn.onclick = () => {
                        const total = this.rollDice(formula);
                        if (total !== null) {
                            resSpan.innerText = `= ${total}`;
                            resSpan.style.color = "var(--text-accent)";
                        }
                    };
                    
                    container.appendChild(btn);
                    container.appendChild(resSpan);
                    fragments.push(container);
                    lastIndex = regex.lastIndex;
                }
                
                if (fragments.length > 0) {
                    if (lastIndex < node.nodeValue.length) {
                        fragments.push(document.createTextNode(node.nodeValue.substring(lastIndex)));
                    }
                    const parent = node.parentNode;
                    if (parent) {
                        fragments.forEach(f => parent.insertBefore(f, node));
                        parent.removeChild(node);
                    }
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

    rollDice(formula) {
        const parts = formula.toLowerCase().replace(/\s+/g, '').match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
        if (!parts) {
            new Notice(`Invalid Roll Formula: ${formula}. Try '1d20+2' or '2d6'.`);
            return null;
        }
        
        const count = parseInt(parts[1]);
        const faces = parseInt(parts[2]);
        const modSign = parts[3];
        const modVal = parseInt(parts[4]);
        
        let total = 0;
        let rolls = [];
        for(let i=0; i<count; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            rolls.push(r);
            total += r;
        }
        
        let resStr = `[${rolls.join(', ')}]`;
        if (modSign && !isNaN(modVal)) {
            if (modSign === '+') total += modVal;
            if (modSign === '-') total -= modVal;
            resStr += ` ${modSign} ${modVal}`;
        }
        
        const noticeEl = document.createDocumentFragment();
        const header = document.createElement('div');
        header.style.color = 'var(--text-accent)';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '5px';
        header.innerText = 'UNION_OS // COMBAT LOG';
        
        const res = document.createElement('div');
        res.innerHTML = `Rolling <b>${formula}</b><br/>Result: ${resStr} = <b style="font-size:1.2em;color:white;">${total}</b>`;
        
        noticeEl.appendChild(header);
        noticeEl.appendChild(res);
        
        new Notice(noticeEl, 5000);
        return total;
    }
}

// ==========================================
// FEATURE: PC JSON Importer
// ==========================================
class PcImporterFeature {
    constructor(plugin) {
        this.plugin = plugin;
    }

    load() {
        this.plugin.addCommand({
            id: 'import-pc-json',
            name: 'Import Player Character (JSON)',
            callback: () => this.importPcJson()
        });
        
        this.plugin.addRibbonIcon('user', 'Import Player JSON', () => {
            this.importPcJson();
        });
    }

    importPcJson() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const rawText = evt.target.result;
                    const json = JSON.parse(rawText);
                    
                    let pilots = [];
                    if (json.EXPORT_TYPE === "Pilot Group") {
                        const parsedData = JSON.parse(json.data);
                        pilots = parsedData.pilotData || [];
                    } else if (json.EXPORT_TYPE === "Save Pilot") {
                        if (typeof json.data === 'string') {
                            pilots = [JSON.parse(json.data)];
                        } else {
                            pilots = [json.data];
                        }
                    } else {
                        new Notice("Unbekanntes JSON Format.");
                        return;
                    }
                    
                    for (let pilot of pilots) {
                        if (pilot.itemType === 'pilot') {
                            await this.createPilotNote(pilot);
                        }
                    }
                    new Notice(`Erfolgreich ${pilots.length} Spieler importiert!`);
                    
                } catch (error) {
                    console.error(error);
                    new Notice("Fehler beim Parsen der JSON-Datei.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    async createPilotNote(pilot) {
        const callsign = pilot.callsign || pilot.name || "Unknown";
        const filename = `PC_${callsign.replace(/[^a-z0-9]/gi, '_')}.md`;
        
        let mechName = "Unknown Mech";
        let frameName = "Unknown Frame";
        let hp = 0, armor = 0, evasion = 0, edef = 0, speed = 0, sensor = 0;
        let structure = 4, stress = 4, heatcap = 0, save = 10;
        let mechWeapons = [];
        let mechSystems = [];
        let pilotWeapons = [];
        let pilotGear = [];
        let pilotSkills = [];
        
        const formatId = (id) => {
            if (!id) return "Unknown";
            return id.replace(/^(t_|mw_|ms_|pg_|mf_|sk_)/, '')
                     .split('_')
                     .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                     .join(' ');
        };

        if (pilot.mechs && pilot.mechs.length > 0) {
            const activeMech = pilot.mechs[pilot.active_index || 0] || pilot.mechs[0];
            mechName = activeMech.name || mechName;
            
            if (activeMech.frameData) {
                frameName = activeMech.frameData.name || frameName;
                if (activeMech.frameData.stats) {
                    const fs = activeMech.frameData.stats;
                    hp = fs.hp !== undefined ? fs.hp : hp;
                    armor = fs.armor !== undefined ? fs.armor : armor;
                    evasion = fs.evasion !== undefined ? fs.evasion : evasion;
                    edef = fs.edef !== undefined ? fs.edef : edef;
                    speed = fs.speed !== undefined ? fs.speed : speed;
                    sensor = fs.sensor_range !== undefined ? fs.sensor_range : sensor;
                    structure = fs.structure !== undefined ? fs.structure : structure;
                    stress = fs.stress !== undefined ? fs.stress : stress;
                    heatcap = fs.heatcap !== undefined ? fs.heatcap : heatcap;
                    save = fs.save !== undefined ? fs.save : save;
                }
            } else if (activeMech.frame) {
                frameName = formatId(activeMech.frame);
            }
            
            // Extract Mech Loadout
            if (activeMech.loadouts && activeMech.loadouts.length > 0) {
                const loadout = activeMech.loadouts[activeMech.active_loadout_index || 0] || activeMech.loadouts[0];
                if (loadout.mounts) {
                    loadout.mounts.forEach(m => {
                        if (m.slots) {
                            m.slots.forEach(s => {
                                if (s.weapon) {
                                    mechWeapons.push({
                                        mount: m.mount_type,
                                        name: s.weapon.data?.name || formatId(s.weapon.id)
                                    });
                                }
                            });
                        }
                    });
                }
                if (loadout.systems) {
                    loadout.systems.forEach(sys => {
                        mechSystems.push(sys.data?.name || formatId(sys.id));
                    });
                }
            }
        }
        
        // Extract Pilot Loadout correctly from pilot.loadouts
        if (pilot.loadouts && pilot.loadouts.length > 0) {
            const ploadout = pilot.loadouts[pilot.active_index || 0] || pilot.loadouts[0];
            if (ploadout.weapons) {
                ploadout.weapons.forEach(w => pilotWeapons.push(w.data?.name || formatId(w.id)));
            }
            if (ploadout.gear) {
                ploadout.gear.forEach(g => pilotGear.push(g.data?.name || formatId(g.id)));
            }
            if (ploadout.armor) {
                ploadout.armor.forEach(a => pilotGear.push(a.data?.name || formatId(a.id)));
            }
        }

        if (pilot.skills && pilot.skills.length > 0) {
            pilot.skills.forEach(sk => {
                const name = sk.data?.name || formatId(sk.id);
                pilotSkills.push(`${name} (+${sk.rank || 1})`);
            });
        }
        
        let fallbackContent = `---
tags:
  - PC
callsign: "${pilot.callsign}"
name: "${pilot.name}"
player: "${pilot.player_name || ''}"
background: "${pilot.background || ''}"
hp: ${hp}
armor: ${armor}
evasion: ${evasion}
edef: ${edef}
speed: ${speed}
sensor: ${sensor}
structure: ${structure}
stress: ${stress}
heatcap: ${heatcap}
save: ${save}
---
# ${callsign.toUpperCase()} (${pilot.name})

**Player:** ${pilot.player_name || 'N/A'} | **Background:** ${pilot.background || 'N/A'}

## Active Mech: ${mechName} (${frameName})

{{LANCER_STATS}}

## Lore & Notes\n`;
        if (pilot.text_appearance) fallbackContent += `### Appearance\n${pilot.text_appearance}\n\n`;
        if (pilot.history) fallbackContent += `### History\n${pilot.history}\n\n`;
        if (pilot.notes) fallbackContent += `### Pilot Notes\n${pilot.notes}\n\n`;

        let templateText = fallbackContent;
        const templateFile = this.plugin.app.metadataCache.getFirstLinkpathDest("TEMPLATE_PC", "");
        if (templateFile) {
            templateText = await this.plugin.app.vault.read(templateFile);
            
            // Merge YAML Frontmatter
            const yamlRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
            const match = templateText.match(yamlRegex);
            let mergedYaml = `---
tags:
  - PC
callsign: "${pilot.callsign}"
name: "${pilot.name}"
background: "${pilot.background || ''}"
hp: ${hp}
armor: ${armor}
evasion: ${evasion}
edef: ${edef}
speed: ${speed}
sensor: ${sensor}
structure: ${structure}
stress: ${stress}
heatcap: ${heatcap}
save: ${save}
`;
            if (match) {
                mergedYaml = `---\n${match[1]}\ncallsign: "${pilot.callsign}"\nname: "${pilot.name}"\nbackground: "${pilot.background || ''}"\nhp: ${hp}\narmor: ${armor}\nevasion: ${evasion}\nedef: ${edef}\nspeed: ${speed}\nsensor: ${sensor}\nstructure: ${structure}\nstress: ${stress}\nheatcap: ${heatcap}\nsave: ${save}\n---`;
                templateText = templateText.replace(yamlRegex, mergedYaml);
            } else {
                templateText = mergedYaml + "---" + "\n" + templateText;
            }
        }

        // Generate the LANCER_STATS block
        let statsBlock = `\`\`\`lancer-stats
🤖 Mech-Stats
HP: ${hp}
Armor: ${armor}
Evasion: ${evasion}
E-Defense: ${edef}
Speed: ${speed}
Sensor Range: ${sensor}
Structure: ${structure}
Stress: ${stress}
Heat Cap: ${heatcap}
Save: ${save}
\`\`\`

### Mech Loadout
**Weapons:**
${mechWeapons.length > 0 ? mechWeapons.map(w => `- [${w.mount}] ${w.name}`).join("\n") : "- None"}

**Systems:**
${mechSystems.length > 0 ? mechSystems.map(s => `- ${s}`).join("\n") : "- None"}

### Pilot Loadout
**Weapons:** ${pilotWeapons.length > 0 ? pilotWeapons.join(", ") : "None"}
**Gear / Armor:** ${pilotGear.length > 0 ? pilotGear.join(", ") : "None"}

## Skills, Licenses & Talents
`;
        if (pilotSkills.length > 0) {
            statsBlock += "**Skills:**\n" + pilotSkills.map(sk => `- ${sk}`).join("\n") + "\n\n";
        }
        if (pilot.licenses && pilot.licenses.length > 0) {
            statsBlock += "**Licenses:**\n" + pilot.licenses.map(l => `- ${l.stub?.name || formatId(l.id)} (Rank ${l.rank})`).join("\n") + "\n\n";
        }
        if (pilot.talents && pilot.talents.length > 0) {
            statsBlock += "**Talents:**\n" + pilot.talents.map(t => `- ${t.data?.name || formatId(t.id)} (Rank ${t.rank})`).join("\n") + "\n\n";
        }
        
        if (pilot.mechs && pilot.mechs.length > 0) {
            const activeMech = pilot.mechs[pilot.active_index || 0] || pilot.mechs[0];
            if (activeMech.notes) {
                statsBlock += `### Mech Notes (${mechName})\n${activeMech.notes}\n\n`;
            }
            if (activeMech.frameData && activeMech.frameData.traits && activeMech.frameData.traits.length > 0) {
                statsBlock += `### Frame Traits\n` + activeMech.frameData.traits.map(tr => `- **${tr.name}**: ${tr.description}`).join("\n") + "\n\n";
            }
            if (activeMech.frameData && activeMech.frameData.core_system) {
                const cs = activeMech.frameData.core_system;
                statsBlock += `### Core System: ${cs.name}\n**Active (${cs.active_name}):** ${cs.active_effect}\n\n`;
            }
        }

        let content = templateText;
        if (content.includes("{{LANCER_STATS}}")) {
            content = content.replace("{{LANCER_STATS}}", statsBlock);
        } else {
            content += "\n\n" + statsBlock;
        }
        
        content = content.replace(/{{name}}/gi, pilot.name);
        content = content.replace(/{{callsign}}/gi, pilot.callsign);
        content = content.replace(/{{mechName}}/gi, mechName);
        content = content.replace(/{{frameName}}/gi, frameName);

        const existing = this.plugin.app.metadataCache.getFirstLinkpathDest(filename, "");
        if (existing) {
            await this.plugin.app.vault.modify(existing, content);
        } else {
            await this.plugin.app.vault.create(filename, content);
        }
    }
}

class LcpImportModal extends Modal {
    constructor(app, onSubmit) {
        super(app);
        this.onSubmit = onSubmit;
        this.options = {
            npc_classes: true,
            npc_templates: true,
            player_data: false,
            lang: window.moment ? window.moment.locale() : 'en'
        };
    }

    onOpen() {
        const { contentEl } = this;
        const t = getT();
        contentEl.empty();
        contentEl.createEl("h2", { text: t.import_modal_title });

        new Setting(contentEl)
            .setName(t.npc_classes)
            .setDesc(t.npc_classes_desc)
            .addToggle(toggle => toggle
                .setValue(this.options.npc_classes)
                .onChange(value => {
                    this.options.npc_classes = value;
                }));

        new Setting(contentEl)
            .setName(t.npc_templates)
            .setDesc(t.npc_templates_desc)
            .addToggle(toggle => toggle
                .setValue(this.options.npc_templates)
                .onChange(value => {
                    this.options.npc_templates = value;
                }));

        new Setting(contentEl)
            .setName(t.player_data)
            .setDesc(t.player_data_desc)
            .addToggle(toggle => toggle
                .setValue(this.options.player_data)
                .onChange(value => {
                    this.options.player_data = value;
                }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText(t.btn_select_import)
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.options);
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
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
            id: 'import-lcp-data',
            name: 'Import LCP Data (Feinde, Templates, etc)',
            callback: () => this.importLcp()
        });
        
        this.plugin.addRibbonIcon('import', getT().import_lcp, (evt) => {
            this.importLcp();
        });
    }

    importLcp() {
        new LcpImportModal(this.plugin.app, (options) => {
            const t = getT();
            new Notice(t.select_file);
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.lcp,.zip';
            
            input.onchange = async e => {
                const file = e.target.files[0];
                if (!file) {
                    new Notice(t.no_file);
                    return;
                }
                const { vault } = this.plugin.app;
                
                try {
                    new Notice(t.reading_file.replace('{name}', file.name));
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // Lazy-load JSZip from embedded base64 string
                    if (!JSZip) {
                        const jszipCode = atob(JSZIP_BASE64);
                        const _module = { exports: {} };
                        const _fn = new Function('module', 'exports', jszipCode);
                        _fn(_module, _module.exports);
                        JSZip = _module.exports;
                    }
                    
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const zipFiles = Object.keys(zip.files);
                    
                    const lang = window.moment ? window.moment.locale() : 'en';
                    const pt = {
                        de: {
                            base_weapons: "Basis-Waffen & Systeme", attack: "Angriff", damage: "Schaden", auto_extracted: "*(Diese Notiz wurde automatisch aus einer LCP-Datei extrahiert.)*", index_enemy: "**Index:** [[Index_Feind_Statblocks]]", base_stats: "Basis-Stats", template_features: "Template Features", effect: "Effekt"
                        },
                        en: {
                            base_weapons: "Base Weapons & Systems", attack: "Attack", damage: "Damage", auto_extracted: "*(This note was automatically extracted from an LCP file.)*", index_enemy: "**Index:** [[Index_Enemy_Statblocks]]", base_stats: "Base Stats", template_features: "Template Features", effect: "Effect"
                        }
                    };
                    const pt_lang = pt[lang] || pt['en'];
                    
                    const stripHtml = (text) => {
                        if (typeof text !== 'string') return '';
                        return text.replace(/<[^<]+>/g, '');
                    };
                    
                    const safeName = (str) => {
                        return String(str).replace(/[<>:"\/\\|?*]/g, '');
                    };
                    
                    const ensureDir = async (folderPath) => {
                        const parts = folderPath.split('/');
                        let currentPath = '';
                        for (let part of parts) {
                            if (!part) continue;
                            currentPath = currentPath ? currentPath + '/' + part : part;
                            try {
                                if (!vault.getAbstractFileByPath(currentPath)) {
                                    await vault.createFolder(currentPath);
                                }
                            } catch (e) { /* ignore if exists */ }
                        }
                    };
                    
                    const readJson = async (filename) => {
                        const f = zip.file(filename);
                        if (!f) return null;
                        const raw = await f.async("string");
                        return JSON.parse(raw);
                    };
                    
                    // Load NPC features for cross-referencing
                    let featureDict = {};
                    try {
                        const featuresData = await readJson("npc_features.json");
                        if (Array.isArray(featuresData)) {
                            for (const f of featuresData) {
                                if (f && f.id) featureDict[f.id] = f;
                            }
                        }
                    } catch (e) { /* no features file */ }
                    
                    // Try to load the user's template
                    let templateText = null;
                    const templatePath = "99_TEMPLATES/Template_Mech.md";
                    const templateFile = vault.getAbstractFileByPath(templatePath);
                    if (templateFile) {
                        templateText = await vault.read(templateFile);
                    }
                    
                    for (let fname of zipFiles) {
                        if (!fname.endsWith('.json')) continue;
                        if (fname === "lcp_manifest.json") continue;
                        
                        if (fname === "npc_classes.json" && options.npc_classes) {
                            const classes = await readJson(fname);
                            if (!Array.isArray(classes)) continue;
                            await ensureDir("00_Regeln/Feind_Statblocks");
                            
                            for (let npc of classes) {
                                const name = npc.name || "Unknown";
                                const stats = npc.stats || {};
                                
                                const hp = stats.hp ? (Array.isArray(stats.hp) ? stats.hp.join(", ") : stats.hp) : "0";
                                const armor = stats.armor ? (Array.isArray(stats.armor) ? stats.armor.join(", ") : stats.armor) : "0";
                                const evasion = stats.evasion ? (Array.isArray(stats.evasion) ? stats.evasion.join(", ") : stats.evasion) : "0";
                                const edef = stats.edef ? (Array.isArray(stats.edef) ? stats.edef.join(", ") : stats.edef) : "0";
                                const speed = stats.speed ? (Array.isArray(stats.speed) ? stats.speed.join(", ") : stats.speed) : "0";
                                const sensors = stats.sensor ? (Array.isArray(stats.sensor) ? stats.sensor.join(", ") : stats.sensor) : "0";
                                
                                let featuresMd = "## ⛔️ " + pt_lang.base_weapons + "\n";
                                const baseFeatures = npc.base_features || [];
                                for (let fId of baseFeatures) {
                                    if (featureDict[fId]) {
                                        const feat = featureDict[fId];
                                        const fName = feat.name || "Unknown";
                                        const fType = feat.type || "System";
                                        const wType = feat.weapon_type || "Main";
                                        
                                        if (fType === "Weapon") {
                                            const attBonus = (feat.attack_bonus || [0])[0];
                                            const dmgList = feat.damage || [];
                                            let dmgStr = "";
                                            if (dmgList.length > 0) {
                                                const d = dmgList[0];
                                                const dmgVal = Array.isArray(d.damage) ? (d.damage[0] || 0) : (d.val || 0);
                                                const dmgType = d.type || "";
                                                dmgStr = dmgVal + " " + dmgType;
                                            }
                                            featuresMd += "- **" + fName + "** (" + wType + ")\n  - " + pt_lang.attack + ": +" + attBonus + " | " + pt_lang.damage + ": " + dmgStr + "\n";
                                        } else {
                                            let effect = stripHtml(feat.effect || "");
                                            if (effect.length > 300) effect = effect.substring(0, 297) + "...";
                                            featuresMd += "- **" + fName + "** (" + fType + ")\n  - " + effect + "\n";
                                        }
                                    }
                                }
                                
                                const statsBlock = "```lancer-stats\n📊 " + pt_lang.base_stats + "\nHP: " + hp + "\nArmor: " + armor + "\nEvasion: " + evasion + "\nE-Defense: " + edef + "\nSpeed: " + speed + "\nSensor Range: " + sensors + "\n```\n" + featuresMd;
                                
                                let content;
                                if (templateText) {
                                    content = templateText;
                                    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
                                    let mergedYaml = "---\ntags:\n  - NPC_Class\nHP: " + hp + "\nArmor: " + armor + "\nEvasion: " + evasion + "\nE-Defense: " + edef + "\nSpeed: " + speed + "\nSensor Range: " + sensors + "\n---";
                                    if (yamlMatch) {
                                        content = content.replace(/^---\n[\s\S]*?\n---/, mergedYaml);
                                    } else {
                                        content = mergedYaml + "\n" + content;
                                    }
                                    if (content.includes("{{LANCER_STATS}}")) {
                                        content = content.replace("{{LANCER_STATS}}", statsBlock);
                                    } else {
                                        content += "\n\n" + statsBlock;
                                    }
                                    content = content.replace(/<% tp.file.title %>/g, name);
                                    content = content.replace(/{{name}}/g, name);
                                } else {
                                    content = "---\ntags:\n  - NPC_Class\nHP: " + hp + "\nArmor: " + armor + "\nEvasion: " + evasion + "\nE-Defense: " + edef + "\nSpeed: " + speed + "\nSensor Range: " + sensors + "\n---\n# " + name + "\n\n" + statsBlock + "\n\n" + pt_lang.auto_extracted + "\n\n---\n" + pt_lang.index_enemy;
                                }
                                
                                const filePath = "00_Regeln/Feind_Statblocks/" + safeName(name) + ".md";
                                const existing = vault.getAbstractFileByPath(filePath);
                                if (existing) { await vault.modify(existing, content); }
                                else { await vault.create(filePath, content); }
                            }
                        } else if (fname === "npc_templates.json" && options.npc_templates) {
                            const templates = await readJson(fname);
                            if (!Array.isArray(templates)) continue;
                            await ensureDir("00_Regeln/Feind_Templates");
                            
                            for (let temp of templates) {
                                const name = temp.name || "Unknown";
                                const desc = stripHtml(temp.description || "");
                                
                                let featuresMd = "## ⛔️ " + pt_lang.template_features + "\n";
                                const baseFeatures = temp.base_features || [];
                                for (let fId of baseFeatures) {
                                    if (featureDict[fId]) {
                                        const feat = featureDict[fId];
                                        const fName = feat.name || "Unknown";
                                        const effect = stripHtml(feat.effect || "");
                                        featuresMd += "- **" + fName + "**\n  - " + effect + "\n";
                                    }
                                }
                                
                                const content = "---\ntags:\n  - NPC_Template\n---\n# " + name + "\n\n" + desc + "\n\n" + featuresMd;
                                const filePath = "00_Regeln/Feind_Templates/" + safeName(name) + ".md";
                                const existing = vault.getAbstractFileByPath(filePath);
                                if (existing) { await vault.modify(existing, content); }
                                else { await vault.create(filePath, content); }
                            }
                        } else if (fname === "npc_features.json") {
                            // Only imported when needed by classes/templates
                        } else if (options.player_data) {
                            const data = await readJson(fname);
                            if (!Array.isArray(data)) continue;
                            
                            const category = fname.replace('.json', '');
                            const capCategory = category.charAt(0).toUpperCase() + category.slice(1);
                            await ensureDir("00_Regeln/LCP_Data");
                            await ensureDir("00_Regeln/LCP_Data/" + capCategory);
                            
                            for (let item of data) {
                                if (typeof item !== 'object' || item === null) continue;
                                const name = item.name || "Unknown";
                                
                                let yamlLines = ["---"];
                                for (const [k, v] of Object.entries(item)) {
                                    if (["name", "description", "effect"].includes(k)) continue;
                                    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                                        yamlLines.push(k + ": " + v);
                                    } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') {
                                        yamlLines.push(k + ": [" + v.join(", ") + "]");
                                    }
                                }
                                yamlLines.push("---");
                                
                                const desc = stripHtml(item.description || "");
                                const effect = stripHtml(item.effect || "");
                                let content = yamlLines.join("\n") + "\n# " + name + "\n\n";
                                if (desc) content += desc + "\n\n";
                                if (effect) content += "### " + pt_lang.effect + "\n" + effect + "\n";
                                
                                const filePath = "00_Regeln/LCP_Data/" + capCategory + "/" + safeName(name) + ".md";
                                const existing = vault.getAbstractFileByPath(filePath);
                                if (existing) { await vault.modify(existing, content); }
                                else { await vault.create(filePath, content); }
                            }
                        }
                    }
                    
                    new Notice(t.import_success);
                } catch (err) {
                    new Notice(t.script_error.replace('{err}', err.message));
                    console.error("LCP Import error:", err);
                }
            };
            input.click();
        }).open();
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
            let templateLabels = [];
            let headerText = "🤖 Basis-Stats";

            for (let line of lines) {
                if (!line.trim()) continue;
                
                let parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const valRaw = parts.slice(1).join(':').trim();
                    const vals = valRaw.split(',').map(v => v.trim());
                    
                    if (key.toLowerCase() === 'template' || key.toLowerCase() === 'label') {
                        templateLabels.push(...vals);
                    } else {
                        statsData.push({ key, vals });
                    }
                } else {
                    if (line.includes("Tier") && line.includes("1")) {
                        // Ignore the static tier header if it's there
                        continue;
                    }
                    headerText = line.trim();
                }
            }

            const headerContainer = document.createElement("div");
            headerContainer.style.gridColumn = "1 / -1";
            headerContainer.style.borderBottom = "1px solid var(--text-muted)";
            headerContainer.style.paddingBottom = "4px";
            headerContainer.style.marginBottom = "8px";
            headerContainer.style.display = "flex";
            headerContainer.style.alignItems = "center";
            headerContainer.style.gap = "10px";
            container.appendChild(headerContainer);

            const header = document.createElement("div");
            header.innerText = headerText + " (TIER 1)";
            header.style.color = "var(--text-accent)";
            header.style.fontWeight = "bold";
            header.style.textTransform = "uppercase";
            headerContainer.appendChild(header);

            // Render badges
            templateLabels.forEach(label => {
                const badge = document.createElement("span");
                badge.innerText = label.toUpperCase();
                badge.style.backgroundColor = "var(--interactive-accent)";
                badge.style.color = "var(--text-on-accent)";
                badge.style.fontSize = "0.7em";
                badge.style.padding = "2px 6px";
                badge.style.borderRadius = "4px";
                badge.style.fontWeight = "bold";
                headerContainer.appendChild(badge);
            });

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
        
        // Initialize global state if it doesn't exist yet
        if (!this.plugin.trackerState) {
            this.plugin.trackerState = {
                selectedTiers: {}, // { basename: tierIndex }
                combatants: [], // array of basenames
                activeTab: 'roster', // 'roster' or 'initiative'
                isCombatActive: false,
                turnIndex: 0 // index in this.combatants
            };
        }
    }

    // Helper getters/setters to keep existing code working
    get selectedTiers() { return this.plugin.trackerState.selectedTiers; }
    set selectedTiers(v) { this.plugin.trackerState.selectedTiers = v; }
    get combatants() { return this.plugin.trackerState.combatants; }
    set combatants(v) { this.plugin.trackerState.combatants = v; }
    get activeTab() { return this.plugin.trackerState.activeTab; }
    set activeTab(v) { this.plugin.trackerState.activeTab = v; }
    get isCombatActive() { return this.plugin.trackerState.isCombatActive; }
    set isCombatActive(v) { this.plugin.trackerState.isCombatActive = v; }
    get turnIndex() { return this.plugin.trackerState.turnIndex; }
    set turnIndex(v) { this.plugin.trackerState.turnIndex = v; }

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
        header.style.marginBottom = "5px";
        
        // Tab Navigation
        this.tabNav = container.createEl("div");
        this.tabNav.style.display = "flex";
        this.tabNav.style.gap = "5px";
        this.tabNav.style.marginBottom = "15px";
        this.tabNav.style.borderBottom = "1px solid var(--background-modifier-border)";
        
        this.contentEl = container.createEl("div");
        this.contentEl.className = "lancer-tracker-content";
        
        this.updateView(this.plugin.app.workspace.getActiveFile());
    }

    async onClose() {
        // Cleanup if needed
    }

    renderTabNavigation(currentFile) {
        this.tabNav.empty();
        
        const btnRoster = this.tabNav.createEl("button", { text: "ROSTER" });
        const btnInit = this.tabNav.createEl("button", { text: "INITIATIVE" });
        
        const styleTab = (btn, isActive) => {
            btn.style.flex = "1";
            btn.style.padding = "5px";
            btn.style.cursor = "pointer";
            btn.style.border = "none";
            btn.style.borderBottom = isActive ? "2px solid var(--text-accent)" : "2px solid transparent";
            btn.style.backgroundColor = isActive ? "var(--background-secondary-alt)" : "transparent";
            btn.style.color = isActive ? "var(--text-accent)" : "var(--text-muted)";
            btn.style.fontWeight = "bold";
            btn.style.borderRadius = "0";
        };
        
        styleTab(btnRoster, this.activeTab === 'roster');
        styleTab(btnInit, this.activeTab === 'initiative');
        
        btnRoster.onclick = () => {
            this.activeTab = 'roster';
            this.updateView(currentFile);
        };
        
        btnInit.onclick = () => {
            this.activeTab = 'initiative';
            this.updateView(currentFile);
        };
    }

    async updateView(file) {
        if (!this.contentEl) return;
        
        // If combat is active, ignore the new file and stick to the locked encounter file
        if (this.isCombatActive && this.plugin.trackerState.lockedFilePath) {
            const lockedFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.trackerState.lockedFilePath);
            if (lockedFile) {
                file = lockedFile;
            }
        } else if (file) {
            this.plugin.trackerState.lockedFilePath = file.path;
        }

        this.renderTabNavigation(file);
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

        const uniqueLinks = new Map();
        for (let l of cache.links) {
            const basename = l.link.split('#')[0];
            const hash = l.link.split('#')[1];
            if (!uniqueLinks.has(basename)) {
                uniqueLinks.set(basename, hash);
            }
        }

        let allNpcs = {};

        for (let [basename, hash] of uniqueLinks.entries()) {
            const linkedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(basename, file.path);
            if (!linkedFile) continue;

            const linkedCache = this.plugin.app.metadataCache.getFileCache(linkedFile);
            if (!linkedCache || !linkedCache.frontmatter) continue;

            const fm = linkedCache.frontmatter;
            const tags = fm.tags || [];
            
            if (hash) {
                const upperHash = hash.toUpperCase();
                if (upperHash === "T1") this.selectedTiers[linkedFile.basename] = 0;
                if (upperHash === "T2") this.selectedTiers[linkedFile.basename] = 1;
                if (upperHash === "T3") this.selectedTiers[linkedFile.basename] = 2;
            }
            
            const hasStats = fm.HP !== undefined || fm.hp !== undefined;
            const isClass = tags.includes("NPC_Class") || tags.includes("Mech");
            const isPC = tags.includes("PC");
            
            if (hasStats || isClass || tags.includes("NPC") || isPC) {
                allNpcs[linkedFile.basename] = {
                    name: linkedFile.basename,
                    fm: fm,
                    file: linkedFile,
                    isCombatMech: hasStats || isClass || isPC,
                    isPC: isPC
                };
            }
        }

        // Migrate old string-based combatants to objects, then filter out deleted links
        this.combatants = this.combatants
            .map(c => typeof c === 'string' ? { id: Date.now() + Math.random(), basename: c, currentHp: null, template: "NONE", tier: 0 } : c)
            .filter(c => allNpcs[c.basename]);
        // Adjust turn index if combatants array shrank
        if (this.turnIndex >= this.combatants.length) this.turnIndex = 0;

        if (Object.keys(allNpcs).length === 0) {
            this.contentEl.createEl("p", { text: "Keine validen NPC-Notizen gefunden.", cls: "text-muted" });
            return;
        }

        if (this.activeTab === 'roster') {
            this.renderRosterTab(allNpcs, file);
        } else {
            this.renderInitiativeTab(allNpcs, file);
        }
    }

    renderRosterTab(allNpcs, currentFile) {
        let pcs = [];
        let storyNpcs = [];
        let combatNpcs = [];

        Object.values(allNpcs).forEach(npc => {
            if (npc.isPC) pcs.push(npc);
            else if (npc.isCombatMech) combatNpcs.push(npc);
            else storyNpcs.push(npc);
        });

        if (pcs.length > 0) {
            const pcHeader = this.contentEl.createEl("div", { text: "PLAYER CHARACTERS" });
            pcHeader.style.color = "var(--text-accent)";
            pcHeader.style.fontWeight = "bold";
            pcHeader.style.fontSize = "0.8em";
            pcHeader.style.marginBottom = "8px";
            pcHeader.style.letterSpacing = "1px";
            
            for (let npc of pcs) {
                this.renderRosterCard(npc, currentFile);
            }
        }

        if (storyNpcs.length > 0) {
            const storyHeader = this.contentEl.createEl("div", { text: "STORY CHARAKTERE" });
            storyHeader.style.color = "var(--text-muted)";
            storyHeader.style.fontWeight = "bold";
            storyHeader.style.fontSize = "0.8em";
            storyHeader.style.marginBottom = "8px";
            storyHeader.style.letterSpacing = "1px";
            
            for (let npc of storyNpcs) {
                this.renderRosterCard(npc, currentFile);
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
                this.renderRosterCard(npc, currentFile);
            }
        }
    }

    renderRosterCard(npc, currentFile) {
        const inCombat = this.combatants.some(c => c.basename === npc.name);
        
        const card = this.contentEl.createEl("div");
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.style.border = "1px solid var(--background-modifier-border)";
        card.style.backgroundColor = "var(--background-secondary)";
        card.style.padding = "6px 8px";
        card.style.marginBottom = "4px";
        
        const leftBox = card.createEl("div");
        
        const title = leftBox.createEl("div", { text: npc.name });
        title.style.fontSize = "0.9em";
        title.style.fontWeight = "bold";
        title.style.cursor = "pointer";
        title.onclick = () => this.plugin.app.workspace.getLeaf('tab').openFile(npc.file);
        
        let details = [];
        if (npc.fm.fraktion) details.push(npc.fm.fraktion);
        if (npc.fm.rolle) details.push(npc.fm.rolle);
        if (details.length > 0) {
            const sub = leftBox.createEl("div", { text: details.join(" • ") });
            sub.style.fontSize = "0.7em";
            sub.style.color = "var(--text-muted)";
        }

        const btnAdd = card.createEl("button", { text: inCombat ? "- Combat" : "+ Combat" });
        btnAdd.style.padding = "2px 6px";
        btnAdd.style.fontSize = "0.7em";
        btnAdd.style.minWidth = "65px";
        
        if (inCombat) {
            btnAdd.style.backgroundColor = "var(--background-modifier-border)";
            btnAdd.style.color = "var(--text-muted)";
        } else {
            btnAdd.style.backgroundColor = "transparent";
            btnAdd.style.color = "var(--text-accent)";
            btnAdd.style.border = "1px solid var(--text-accent)";
        }
        
        btnAdd.onclick = () => {
            const count = this.combatants.filter(c => c.basename === npc.name).length;
            const suffix = count > 0 ? " " + String.fromCharCode(65 + count) : ""; // A, B, C...
            this.combatants.push({
                id: Date.now() + Math.random().toString(36).substring(7),
                basename: npc.name,
                nameSuffix: suffix,
                currentHp: null, // will be set when initialized in MiniGrid
                template: "NONE",
                tier: this.selectedTiers[npc.name] || 0
            });
            this.updateView(currentFile);
        };
    }

    renderInitiativeTab(allNpcs, currentFile) {
        if (this.combatants.length === 0) {
            this.contentEl.createEl("p", { text: "No combatants added. Go to the Roster tab to add characters to combat.", cls: "text-muted" });
            return;
        }

        // Global Combat Controls
        const controlBar = this.contentEl.createEl("div");
        controlBar.style.display = "flex";
        controlBar.style.justifyContent = "space-between";
        controlBar.style.gap = "10px";
        controlBar.style.marginBottom = "15px";

        const btnToggleCombat = controlBar.createEl("button", { text: this.isCombatActive ? "⏹ END COMBAT" : "▶ START COMBAT" });
        btnToggleCombat.style.flex = "1";
        btnToggleCombat.style.fontWeight = "bold";
        btnToggleCombat.style.backgroundColor = this.isCombatActive ? "var(--background-secondary)" : "var(--color-red, #ff5555)";
        btnToggleCombat.style.color = this.isCombatActive ? "var(--text-normal)" : "white";
        
        btnToggleCombat.onclick = () => {
            this.isCombatActive = !this.isCombatActive;
            if (this.isCombatActive) this.turnIndex = 0; // reset to top
            this.updateView(currentFile);
        };

        if (this.isCombatActive) {
            const btnNextTurn = controlBar.createEl("button", { text: "NEXT TURN ⏭" });
            btnNextTurn.style.flex = "1";
            btnNextTurn.style.fontWeight = "bold";
            btnNextTurn.style.backgroundColor = "var(--text-accent)";
            btnNextTurn.style.color = "var(--background-primary)";
            
            btnNextTurn.onclick = () => {
                if (this.combatants.length > 0) {
                    this.turnIndex = (this.turnIndex + 1) % this.combatants.length;
                }
                this.updateView(currentFile);
            };
        }

        const activeCombatants = this.combatants.map(c => ({ instance: c, baseStats: allNpcs[c.basename] }));
        activeCombatants.forEach((combatantData, index) => {
            if (combatantData && combatantData.baseStats) {
                this.renderInitiativeCard(combatantData.instance, combatantData.baseStats, index, currentFile);
            }
        });
    }

    renderInitiativeCard(instance, baseStats, index, currentFile) {
        const isMyTurn = this.isCombatActive && this.turnIndex === index;
        
        const card = this.contentEl.createEl("div");
        card.style.position = "relative";
        card.style.border = isMyTurn ? "2px solid var(--text-accent)" : "1px solid var(--border-color)";
        card.style.borderLeft = isMyTurn ? "4px solid var(--text-accent)" : "3px solid var(--color-red, #ff5555)";
        card.style.backgroundColor = isMyTurn ? "var(--background-secondary-alt)" : "var(--background-secondary)";
        card.style.padding = "8px";
        card.style.marginBottom = "8px";
        card.style.borderRadius = "4px";
        if (isMyTurn) card.style.boxShadow = "0 0 10px rgba(255, 102, 0, 0.2)";

        const controlBar = card.createEl("div");
        controlBar.style.display = "flex";
        controlBar.style.justifyContent = "space-between";
        controlBar.style.marginBottom = "5px";

        const leftControls = controlBar.createEl("div");
        leftControls.style.display = "flex";
        leftControls.style.gap = "5px";

        // Up/Down Arrows
        const btnUp = leftControls.createEl("button", { text: "▲" });
        btnUp.style.padding = "0px 6px";
        btnUp.style.fontSize = "0.7em";
        btnUp.onclick = () => {
            if (index > 0) {
                // If moving the active turn, update turnIndex
                if (this.isCombatActive) {
                    if (this.turnIndex === index) this.turnIndex = index - 1;
                    else if (this.turnIndex === index - 1) this.turnIndex = index;
                }
                const temp = this.combatants[index - 1];
                this.combatants[index - 1] = this.combatants[index];
                this.combatants[index] = temp;
                this.updateView(currentFile);
            }
        };

        const btnDown = leftControls.createEl("button", { text: "▼" });
        btnDown.style.padding = "0px 6px";
        btnDown.style.fontSize = "0.7em";
        btnDown.onclick = () => {
            if (index < this.combatants.length - 1) {
                if (this.isCombatActive) {
                    if (this.turnIndex === index) this.turnIndex = index + 1;
                    else if (this.turnIndex === index + 1) this.turnIndex = index;
                }
                const temp = this.combatants[index + 1];
                this.combatants[index + 1] = this.combatants[index];
                this.combatants[index] = temp;
                this.updateView(currentFile);
            }
        };

        const btnRemove = controlBar.createEl("button", { text: "✖" });
        btnRemove.style.padding = "0px 6px";
        btnRemove.style.fontSize = "0.7em";
        btnRemove.style.color = "var(--text-muted)";
        btnRemove.style.backgroundColor = "transparent";
        btnRemove.onclick = () => {
            this.combatants.splice(index, 1);
            if (this.isCombatActive && this.turnIndex >= this.combatants.length) {
                this.turnIndex = 0;
            }
            this.updateView(currentFile);
        };

        
        const headerRow = card.createEl("div");
        headerRow.style.display = "flex";
        headerRow.style.justifyContent = "flex-start";
        headerRow.style.alignItems = "center";
        headerRow.style.gap = "10px";
        headerRow.style.marginBottom = baseStats.isCombatMech ? "5px" : "0";

        const title = headerRow.createEl("div", { text: `${instance.basename}${instance.nameSuffix || ""}`.toUpperCase() });
        title.style.fontWeight = "bold";
        title.style.color = "var(--text-normal)";
        title.style.cursor = "pointer";
        title.onclick = () => this.plugin.app.workspace.getLeaf('tab').openFile(baseStats.file);
        
        if (baseStats.isCombatMech) {
            const templateSelect = headerRow.createEl("select");
            templateSelect.style.fontSize = "0.75em";
            templateSelect.style.padding = "2px";
            templateSelect.style.backgroundColor = "var(--background-primary)";
            templateSelect.style.color = "var(--text-muted)";
            templateSelect.style.border = "1px solid var(--background-modifier-border)";
            
            const templates = ["NONE", "GRUNT", "ELITE", "VETERAN", "ULTRA", "COMMANDER", "EXOTIC", "MERCENARY"];
            templates.forEach(t => {
                const opt = templateSelect.createEl("option", { text: t, value: t });
                if (instance.template === t) opt.selected = true;
            });
            
            templateSelect.onchange = (e) => {
                instance.template = e.target.value;
                if (instance.template === "GRUNT") {
                    instance.currentHp = 1;
                }
                this.updateView(currentFile);
            };
        }


        if (baseStats.isCombatMech) {
            this.renderMiniGrid(card, instance, baseStats.fm, currentFile, headerRow);
        } else {
            let details = [];
            if (baseStats.fm.fraktion) details.push(baseStats.fm.fraktion);
            if (baseStats.fm.rolle) details.push(baseStats.fm.rolle);
            if (details.length > 0) {
                const sub = card.createEl("div", { text: details.join(" • ") });
                sub.style.fontSize = "0.75em";
                sub.style.color = "var(--text-muted)";
            }
        }
    }

    createInteractiveStatBox(grid, label, valueProp, maxVal, currentFile, instance, color) {
        const box = grid.createEl("div");
        box.style.border = "1px solid var(--background-modifier-border)";
        box.style.padding = "4px";
        box.style.textAlign = "center";
        box.style.backgroundColor = "var(--background-primary)";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.justifyContent = "center";
        box.style.alignItems = "center";
        
        const valContainer = box.createEl("div");
        valContainer.style.display = "flex";
        valContainer.style.alignItems = "center";
        valContainer.style.justifyContent = "space-between";
        valContainer.style.width = "100%";
        
        const btnMinus = valContainer.createEl("button", { text: "-" });
        btnMinus.style.padding = "0 4px";
        btnMinus.style.backgroundColor = "transparent";
        btnMinus.style.border = "none";
        btnMinus.style.color = "var(--text-muted)";
        btnMinus.style.cursor = "pointer";
        btnMinus.onclick = () => { instance[valueProp]--; this.updateView(currentFile); };
        
        const text = valContainer.createEl("div", { text: `${instance[valueProp]} / ${maxVal}` });
        text.style.fontWeight = "bold";
        if (color) text.style.color = color;
        text.style.fontSize = "1.1em";
        
        const btnPlus = valContainer.createEl("button", { text: "+" });
        btnPlus.style.padding = "0 4px";
        btnPlus.style.backgroundColor = "transparent";
        btnPlus.style.border = "none";
        btnPlus.style.color = "var(--text-muted)";
        btnPlus.style.cursor = "pointer";
        btnPlus.onclick = () => { instance[valueProp]++; this.updateView(currentFile); };
        
        const labelEl = box.createEl("div", { text: label });
        labelEl.style.fontSize = "0.7em";
        labelEl.style.color = "var(--text-muted)";
        
        return box;
    }

    renderMiniGrid(card, instance, stats, currentFile, headerRow) {
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
        
        let currentTier = instance.tier || 0;
        const boxes = [];
        
        // Calculate Max HP
        let maxHp = parseInt(hpArr[currentTier] || hpArr[0]) || 0;
        if (instance.template === "GRUNT") maxHp = 1;
        
        // Initialize current HP if null
        if (instance.currentHp === null) instance.currentHp = maxHp;
        
        let maxStructure = parseInt(stats.Structure || stats.structure || stats.STR || "1") || 1;
        let maxStress = parseInt(stats.Stress || stats.stress || stats.STRS || "1") || 1;
        
        if (instance.template === "ELITE") {
            maxStructure = 2;
            maxStress = 2;
        } else if (instance.template === "ULTRA") {
            maxStructure = 1 + (currentTier + 1);
            maxStress = 1 + (currentTier + 1);
        }
        
        if (instance.currentStructure === undefined || instance.currentStructure === null) instance.currentStructure = maxStructure;
        if (instance.currentStress === undefined || instance.currentStress === null) instance.currentStress = maxStress;
        if (instance.currentHeat === undefined || instance.currentHeat === null) instance.currentHeat = 0;
        
        let maxHeat = parseInt(stats.Heatcap || stats.heatcap || stats['Heat Cap'] || stats.Heat || "8") || 8;

        boxes.push(this.createInteractiveStatBox(grid, "HP", "currentHp", maxHp, currentFile, instance, "var(--color-red, #ff5555)"));
        boxes.push(this.createInteractiveStatBox(grid, "STR", "currentStructure", maxStructure, currentFile, instance, "var(--color-orange, #ff9900)"));
        boxes.push(this.createInteractiveStatBox(grid, "STRS", "currentStress", maxStress, currentFile, instance, "var(--color-yellow, #ffcc00)"));
        boxes.push(this.createInteractiveStatBox(grid, "HEAT", "currentHeat", maxHeat, currentFile, instance, "var(--color-orange, #ff6600)"));
        
        boxes.push(this.createStatBox(grid, "ARMOR", armorArr[currentTier] || armorArr[0]));
        boxes.push(this.createStatBox(grid, "EVA", evaArr[currentTier] || evaArr[0]));
        boxes.push(this.createStatBox(grid, "E-DEF", edefArr[currentTier] || edefArr[0]));
        boxes.push(this.createStatBox(grid, "SPD", speedArr[currentTier] || speedArr[0]));

        if (hpArr.length > 1 && headerRow) {
            const toggleContainer = headerRow.createEl("div");
            toggleContainer.style.display = "flex";
            toggleContainer.style.flexDirection = "row";
            toggleContainer.style.gap = "4px";
            toggleContainer.style.marginLeft = "auto";

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
                    
                    // If HP is at Max, scale it automatically when changing tiers
                    let oldMax = parseInt(hpArr[currentTier] || hpArr[0]) || 0;
                    if (instance.template === "GRUNT") oldMax = 1;
                    let newMax = parseInt(hpArr[i] || hpArr[0]) || 0;
                    if (instance.template === "GRUNT") newMax = 1;
                    
                    if (instance.currentHp === oldMax) {
                        instance.currentHp = newMax;
                    }
                    
                    instance.tier = i;
                    this.updateView(currentFile); // Trigger a full re-render which updates all boxes safely
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
        
        this.features = [
            new GlossaryFeature(this),
            new ClocksFeature(this),
            new StatblockFeature(this),
            new DiceRollerFeature(this),
            new PcImporterFeature(this),
            new LcpImporterFeature(this)
        ];

        this.features.forEach(f => f.load());

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
const JSZIP_BASE64 = "aW1wb3J0IHN5cwppbXBvcnQgemlwZmlsZQppbXBvcnQganNvbgppbXBvcnQgb3MKaW1wb3J0IHJlCgpJMThOID0gewogICAgImRlIjogewogICAgICAgICJiYXNlX3dlYXBvbnMiOiAiQmFzaXMtV2FmZmVuICYgU3lzdGVtZSIsCiAgICAgICAgImF0dGFjayI6ICJBbmdyaWZmIiwKICAgICAgICAiZGFtYWdlIjogIlNjaGFkZW4iLAogICAgICAgICJhdXRvX2V4dHJhY3RlZCI6ICIqKERpZXNlIE5vdGl6IHd1cmRlIGF1dG9tYXRpc2NoIGF1cyBlaW5lciBMQ1AtRGF0ZWkgZXh0cmFoaWVydC4pKiIsCiAgICAgICAgImluZGV4X2VuZW15IjogIioqSW5kZXg6KiogW1tJbmRleF9GZWluZF9TdGF0YmxvY2tzXV0iLAogICAgICAgICJiYXNlX3N0YXRzIjogIkJhc2lzLVN0YXRzIiwKICAgICAgICAidGVtcGxhdGVfZmVhdHVyZXMiOiAiVGVtcGxhdGUgRmVhdHVyZXMiLAogICAgICAgICJlZmZlY3QiOiAiRWZmZWt0IgogICAgfSwKICAgICJlbiI6IHsKICAgICAgICAiYmFzZV93ZWFwb25zIjogIkJhc2UgV2VhcG9ucyAmIFN5c3RlbXMiLAogICAgICAgICJhdHRhY2siOiAiQXR0YWNrIiwKICAgICAgICAiZGFtYWdlIjogIkRhbWFnZSIsCiAgICAgICAgImF1dG9fZXh0cmFjdGVkIjogIiooVGhpcyBub3RlIHdhcyBhdXRvbWF0aWNhbGx5IGV4dHJhY3RlZCBmcm9tIGFuIExDUCBmaWxlLikqIiwKICAgICAgICAiaW5kZXhfZW5lbXkiOiAiKipJbmRleDoqKiBbW0luZGV4X0VuZW15X1N0YXRibG9ja3NdXSIsCiAgICAgICAgImJhc2Vfc3RhdHMiOiAiQmFzZSBTdGF0cyIsCiAgICAgICAgInRlbXBsYXRlX2ZlYXR1cmVzIjogIlRlbXBsYXRlIEZlYXR1cmVzIiwKICAgICAgICAiZWZmZWN0IjogIkVmZmVjdCIKICAgIH0KfQoKZGVmIGdldF9pMThuKGxhbmcpOgogICAgcmV0dXJuIEkxOE4uZ2V0KGxhbmcsIEkxOE5bImVuIl0pCgpkZWYgc3RyaXBfaHRtbCh0ZXh0KToKICAgIGlmIG5vdCBpc2luc3RhbmNlKHRleHQsIHN0cik6CiAgICAgICAgcmV0dXJuICIiCiAgICByZXR1cm4gcmUuc3ViKCc8W148XSs+JywgJycsIHRleHQpCgpkZWYgcHJvY2Vzc19ucGNfY2xhc3Nlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QsIGxhbmcpOgogICAgdCA9IGdldF9pMThuKGxhbmcpCiAgICB0YXJnZXRfZGlyID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICIwMF9SZWdlbG4iLCAiRmVpbmRfU3RhdGJsb2NrcyIpCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgCiAgICB0cnk6CiAgICAgICAgY2xhc3NlcyA9IGpzb24ubG9hZHMoei5yZWFkKCJucGNfY2xhc3Nlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgZXhjZXB0IEtleUVycm9yOgogICAgICAgIHJldHVybgogICAgICAgIAogICAgZm9yIG5wYyBpbiBjbGFzc2VzOgogICAgICAgIG5hbWUgPSBucGMuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIHN0YXRzID0gbnBjLmdldCgic3RhdHMiLCB7fSkKICAgICAgICBocCA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImhwIiwgWzBdKSkpCiAgICAgICAgZXZhc2lvbiA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImV2YXNpb24iLCBzdGF0cy5nZXQoImV2YWRlIiwgWzBdKSkpKQogICAgICAgIGVkZWYgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJlZGVmIiwgWzBdKSkpCiAgICAgICAgYXJtb3IgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJhcm1vciIsIFswXSkpKQogICAgICAgIHNwZWVkID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic3BlZWQiLCBbMF0pKSkKICAgICAgICBzZW5zb3JzID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic2Vuc29yIiwgWzBdKSkpCiAgICAgICAgc2F2ZSA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoInNhdmUiLCBbMF0pKSkKICAgICAgICBlYXR0YWNrID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgiZWF0dGFjayIsIHN0YXRzLmdldCgidGVjaF9hdHRhY2siLCBbMF0pKSkpCiAgICAgICAgaGVhdGNhcCA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImhlYXRjYXAiLCBbMF0pKSkKICAgICAgICBodWxsID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgiaHVsbCIsIFswXSkpKQogICAgICAgIGFnaSA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImFnaSIsIFswXSkpKQogICAgICAgIHN5cyA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoInN5cyIsIFswXSkpKQogICAgICAgIGVuZyA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImVuZyIsIFswXSkpKQogICAgICAgIHNpemUgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJzaXplIiwgWzFdKSkpCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gPSBmIiMjIOKalO+4jyB7dFsnYmFzZV93ZWFwb25zJ119XG4iCiAgICAgICAgYmFzZV9mZWF0dXJlcyA9IG5wYy5nZXQoImJhc2VfZmVhdHVyZXMiLCBbXSkKICAgICAgICBmb3IgZl9pZCBpbiBiYXNlX2ZlYXR1cmVzOgogICAgICAgICAgICBpZiBmX2lkIGluIGZlYXR1cmVfZGljdDoKICAgICAgICAgICAgICAgIGYgPSBmZWF0dXJlX2RpY3RbZl9pZF0KICAgICAgICAgICAgICAgIGZfbmFtZSA9IGYuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgICAgICAgICAgZl90eXBlID0gZi5nZXQoInR5cGUiLCAiVHJhaXQiKQogICAgICAgICAgICAgICAgd190eXBlID0gZi5nZXQoIndlYXBvbl90eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGZfdHlwZSA9PSAiV2VhcG9uIjoKICAgICAgICAgICAgICAgICAgICBhdHRfYm9udXMgPSBmLmdldCgiYXR0YWNrX2JvbnVzIiwgWzBdKVswXQogICAgICAgICAgICAgICAgICAgIGRtZ19saXN0ID0gZi5nZXQoImRhbWFnZSIsIFtdKQogICAgICAgICAgICAgICAgICAgIGRtZ19zdHIgPSAiIgogICAgICAgICAgICAgICAgICAgIGlmIGRtZ19saXN0OgogICAgICAgICAgICAgICAgICAgICAgICBkID0gZG1nX2xpc3RbMF0KICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3ZhbCA9IGQuZ2V0KCJkYW1hZ2UiLCBbMF0pWzBdIGlmIGlzaW5zdGFuY2UoZC5nZXQoImRhbWFnZSIpLCBsaXN0KSBlbHNlIGQuZ2V0KCJ2YWwiLCAwKQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdHlwZSA9IGQuZ2V0KCJ0eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ19zdHIgPSBmIntkbWdfdmFsfSB7ZG1nX3R5cGV9IgogICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzX21hcmtkb3duICs9IGYiLSAqKntmX25hbWV9KiogKHt3X3R5cGV9KVxuICAtIHt0WydhdHRhY2snXX06ICt7YXR0X2JvbnVzfSB8IHt0WydkYW1hZ2UnXX06IHtkbWdfc3RyfVxuIgogICAgICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGYuZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgICAgICAgICAgICAgaWYgbGVuKGVmZmVjdCkgPiAzMDA6CiAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IGVmZmVjdFs6Mjk3XSArICIuLi4iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe2ZfdHlwZX0pXG4gIC0ge2VmZmVjdH1cbiIKCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gIgojIyA/PyBPcHRpb25hbCBGZWF0dXJlcwoiCiAgICAgICAgb3B0aW9uYWxfZmVhdHVyZXMgPSBucGMuZ2V0KCJvcHRpb25hbF9mZWF0dXJlcyIsIFtdKQogICAgICAgIGZvciBmX2lkIGluIG9wdGlvbmFsX2ZlYXR1cmVzOgogICAgICAgICAgICBpZiBmX2lkIGluIGZlYXR1cmVfZGljdDoKICAgICAgICAgICAgICAgIGYgPSBmZWF0dXJlX2RpY3RbZl9pZF0KICAgICAgICAgICAgICAgIGZfbmFtZSA9IGYuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgICAgICAgICAgZl90eXBlID0gZi5nZXQoInR5cGUiLCAiVHJhaXQiKQogICAgICAgICAgICAgICAgd190eXBlID0gZi5nZXQoIndlYXBvbl90eXBlIiwgIiIpCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGZfdHlwZSA9PSAiV2VhcG9uIjoKICAgICAgICAgICAgICAgICAgICBhdHRfYm9udXMgPSBmLmdldCgiYXR0YWNrX2JvbnVzIiwgWzBdKVswXSBpZiBmLmdldCgiYXR0YWNrX2JvbnVzIikgZWxzZSAwCiAgICAgICAgICAgICAgICAgICAgZG1nX2xpc3QgPSBmLmdldCgiZGFtYWdlIiwgW10pCiAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9ICIiCiAgICAgICAgICAgICAgICAgICAgaWYgZG1nX2xpc3Q6CiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBkbWdfbGlzdFswXQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdmFsID0gZC5nZXQoImRhbWFnZSIsIFswXSlbMF0gaWYgaXNpbnN0YW5jZShkLmdldCgiZGFtYWdlIiksIGxpc3QpIGVsc2UgZC5nZXQoInZhbCIsIDApCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ190eXBlID0gZC5nZXQoInR5cGUiLCAiIikKICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9IGYie2RtZ192YWx9IHtkbWdfdHlwZX0iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe3dfdHlwZX0pCiAgLSB7dFsnYXR0YWNrJ119OiAre2F0dF9ib251c30gfCB7dFsnZGFtYWdlJ119OiB7ZG1nX3N0cn0KIgogICAgICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGYuZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgICAgICAgICAgICAgaWYgbGVuKGVmZmVjdCkgPiAzMDA6CiAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IGVmZmVjdFs6Mjk3XSArICIuLi4iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe2ZfdHlwZX0pCiAgLSB7ZWZmZWN0fQoiCgogICAgICAgIGZhbGxiYWNrX2NvbnRlbnQgPSBmIlwiXCJcIi0tLVxudGFnczpcbiAgLSBOUENfQ2xhc3NcbkhQOiB7aHB9XG5Bcm1vcjoge2FybW9yfVxuRXZhc2lvbjoge2V2YXNpb259XG5FLURlZmVuc2U6IHtlZGVmfVxuU3BlZWQ6IHtzcGVlZH1cblNlbnNvciBSYW5nZToge3NlbnNvcnN9XG4tLS1cbiMge25hbWV9XG5cbnt7e3tMQU5DRVJfU1RBVFN9fX19XG5cbnt0WydhdXRvX2V4dHJhY3RlZCddfVxuXG4tLS1cbnt0WydpbmRleF9lbmVteSddfVxuXCJcIlwiIgogICAgICAgIAogICAgICAgIHRlbXBsYXRlX3BhdGggPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjk5X1RFTVBMQVRFUyIsICJUZW1wbGF0ZV9NZWNoLm1kIikKICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gZmFsbGJhY2tfY29udGVudAogICAgICAgIGlmIG9zLnBhdGguZXhpc3RzKHRlbXBsYXRlX3BhdGgpOgogICAgICAgICAgICB3aXRoIG9wZW4odGVtcGxhdGVfcGF0aCwgInIiLCBlbmNvZGluZz0idXRmLTgiKSBhcyB0ZjoKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSB0Zi5yZWFkKCkKICAgICAgICAgICAgCiAgICAgICAgICAgIHlhbWxfcmVnZXggPSByZS5jb21waWxlKHIiXi0tLVxuKFtcc1xTXSo/KVxuLS0tIikKICAgICAgICAgICAgbWF0Y2ggPSB5YW1sX3JlZ2V4LnNlYXJjaCh0ZW1wbGF0ZV90ZXh0KQogICAgICAgICAgICBtZXJnZWRfeWFtbCA9IGYiLS0tXG50YWdzOlxuICAtIE5QQ19DbGFzc1xuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cblNhdmUgVGFyZ2V0OiB7c2F2ZX1cblRlY2ggQXR0YWNrOiB7ZWF0dGFja31cbkhlYXRjYXA6IHtoZWF0Y2FwfVxuSHVsbDoge2h1bGx9XG5BZ2lsaXR5OiB7YWdpfVxuU3lzdGVtczoge3N5c31cbkVuZ2luZWVyaW5nOiB7ZW5nfVxuU2l6ZToge3NpemV9XG4iCiAgICAgICAgICAgIGlmIG1hdGNoOgogICAgICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxue21hdGNoLmdyb3VwKDEpfVxuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cblNhdmUgVGFyZ2V0OiB7c2F2ZX1cblRlY2ggQXR0YWNrOiB7ZWF0dGFja31cbkhlYXRjYXA6IHtoZWF0Y2FwfVxuSHVsbDoge2h1bGx9XG5BZ2lsaXR5OiB7YWdpfVxuU3lzdGVtczoge3N5c31cbkVuZ2luZWVyaW5nOiB7ZW5nfVxuU2l6ZToge3NpemV9XG4tLS0iCiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0geWFtbF9yZWdleC5zdWIobWVyZ2VkX3lhbWwsIHRlbXBsYXRlX3RleHQsIDEpCiAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gbWVyZ2VkX3lhbWwgKyAiLS0tXG4iICsgdGVtcGxhdGVfdGV4dAoKICAgICAgICBzdGF0c19ibG9jayA9IGYiYGxhbmNlci1zdGF0c1xu8J+TiiB7dFsnYmFzZV9zdGF0cyddfQpIUDoge2hwfQpBcm1vcjoge2FybW9yfQpFdmFzaW9uOiB7ZXZhc2lvbn0KRS1EZWZlbnNlOiB7ZWRlZn0KU3BlZWQ6IHtzcGVlZH0KU2Vuc29yIFJhbmdlOiB7c2Vuc29yc30KU2F2ZSBUYXJnZXQ6IHtzYXZlfQpIZWF0Y2FwOiB7aGVhdGNhcH0KSHVsbDoge2h1bGx9CkFnaWxpdHk6IHthZ2l9ClN5c3RlbXM6IHtzeXN9CkVuZ2luZWVyaW5nOiB7ZW5nfQpTaXplOiB7c2l6ZX0KYAp7ZmVhdHVyZXNfbWFya2Rvd259IgoKICAgICAgICBjb250ZW50ID0gdGVtcGxhdGVfdGV4dAogICAgICAgIGlmICJ7e0xBTkNFUl9TVEFUU319IiBpbiBjb250ZW50OgogICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCJ7e0xBTkNFUl9TVEFUU319Iiwgc3RhdHNfYmxvY2spCiAgICAgICAgZWxzZToKICAgICAgICAgICAgY29udGVudCArPSAiXG5cbiIgKyBzdGF0c19ibG9jawogICAgICAgICAgICAKICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCI8JSB0cC5maWxlLnRpdGxlICU+IiwgbmFtZSkKICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCJ7e25hbWV9fSIsIG5hbWUpCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgcHJvY2Vzc19ucGNfdGVtcGxhdGVzKHosIHZhdWx0X3BhdGgsIGZlYXR1cmVfZGljdCwgbGFuZyk6CiAgICB0ID0gZ2V0X2kxOG4obGFuZykKICAgIHRhcmdldF9kaXIgPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjAwX1JlZ2VsbiIsICJGZWluZF9UZW1wbGF0ZXMiKQogICAgb3MubWFrZWRpcnModGFyZ2V0X2RpciwgZXhpc3Rfb2s9VHJ1ZSkKICAgIHRyeToKICAgICAgICB0ZW1wbGF0ZXMgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX3RlbXBsYXRlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgZXhjZXB0IEtleUVycm9yOgogICAgICAgIHJldHVybgoKICAgIGZvciB0ZW1wIGluIHRlbXBsYXRlczoKICAgICAgICBuYW1lID0gdGVtcC5nZXQoIm5hbWUiLCAiVW5rbm93biIpCiAgICAgICAgZGVzYyA9IHN0cmlwX2h0bWwodGVtcC5nZXQoImRlc2NyaXB0aW9uIiwgIiIpKQogICAgICAgIAogICAgICAgIGZlYXR1cmVzX21hcmtkb3duID0gZiIjIyDimpTvuI8ge3RbJ3RlbXBsYXRlX2ZlYXR1cmVzJ119XG4iCiAgICAgICAgYmFzZV9mZWF0dXJlcyA9IHRlbXAuZ2V0KCJiYXNlX2ZlYXR1cmVzIiwgW10pCiAgICAgICAgZm9yIGZfaWQgaW4gYmFzZV9mZWF0dXJlczoKICAgICAgICAgICAgaWYgZl9pZCBpbiBmZWF0dXJlX2RpY3Q6CiAgICAgICAgICAgICAgICBmID0gZmVhdHVyZV9kaWN0W2ZfaWRdCiAgICAgICAgICAgICAgICBmX25hbWUgPSBmLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICAgICAgICAgIGVmZmVjdCA9IHN0cmlwX2h0bWwoZi5nZXQoImVmZmVjdCIsICIiKSkKICAgICAgICAgICAgICAgIGZlYXR1cmVzX21hcmtkb3duICs9IGYiLSAqKntmX25hbWV9KipcbiAgLSB7ZWZmZWN0fVxuIgogICAgICAgICAgICAgICAgCiAgICAgICAgY29udGVudCA9IGYiLS0tXG50YWdzOlxuICAtIE5QQ19UZW1wbGF0ZVxuLS0tXG4jIHtuYW1lfVxuXG57ZGVzY31cblxue2ZlYXR1cmVzX21hcmtkb3dufSIKICAgICAgICAKICAgICAgICBzYWZlX25hbWUgPSByZS5zdWIocidbPD46Ii9cXHw/Kl0nLCAnJywgc3RyKG5hbWUpKQogICAgICAgIGZpbGVfcGF0aCA9IG9zLnBhdGguam9pbih0YXJnZXRfZGlyLCBmIntzYWZlX25hbWV9Lm1kIikKICAgICAgICB3aXRoIG9wZW4oZmlsZV9wYXRoLCAidyIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGZpbGU6CiAgICAgICAgICAgIGZpbGUud3JpdGUoY29udGVudCkKCmRlZiBwcm9jZXNzX2dlbmVyaWNfanNvbih6LCBmaWxlbmFtZSwgdmF1bHRfcGF0aCwgbGFuZyk6CiAgICB0ID0gZ2V0X2kxOG4obGFuZykKICAgIGNhdGVnb3J5ID0gZmlsZW5hbWUucmVwbGFjZSgnLmpzb24nLCAnJykudGl0bGUoKQogICAgdGFyZ2V0X2RpciA9IG9zLnBhdGguam9pbih2YXVsdF9wYXRoLCAiMDBfUmVnZWxuIiwgIkxDUF9EYXRhIiwgY2F0ZWdvcnkpCiAgICAKICAgIHRyeToKICAgICAgICBkYXRhID0ganNvbi5sb2Fkcyh6LnJlYWQoZmlsZW5hbWUpLmRlY29kZSgidXRmLTgiKSkKICAgIGV4Y2VwdCBFeGNlcHRpb246CiAgICAgICAgcmV0dXJuCiAgICAgICAgCiAgICBpZiBub3QgaXNpbnN0YW5jZShkYXRhLCBsaXN0KToKICAgICAgICByZXR1cm4KICAgICAgICAKICAgIG9zLm1ha2VkaXJzKHRhcmdldF9kaXIsIGV4aXN0X29rPVRydWUpCiAgICAKICAgIGZvciBpdGVtIGluIGRhdGE6CiAgICAgICAgaWYgbm90IGlzaW5zdGFuY2UoaXRlbSwgZGljdCk6IGNvbnRpbnVlCiAgICAgICAgbmFtZSA9IGl0ZW0uZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIAogICAgICAgIHlhbWxfbGluZXMgPSBbIi0tLSJdCiAgICAgICAgZm9yIGssIHYgaW4gaXRlbS5pdGVtcygpOgogICAgICAgICAgICBpZiBrIGluIFsibmFtZSIsICJkZXNjcmlwdGlvbiIsICJlZmZlY3QiXTogY29udGludWUKICAgICAgICAgICAgaWYgaXNpbnN0YW5jZSh2LCAoc3RyLCBpbnQsIGJvb2wsIGZsb2F0KSk6CiAgICAgICAgICAgICAgICB5YW1sX2xpbmVzLmFwcGVuZChmIntrfToge3Z9IikKICAgICAgICAgICAgZWxpZiBpc2luc3RhbmNlKHYsIGxpc3QpIGFuZCBsZW4odikgPiAwIGFuZCBpc2luc3RhbmNlKHZbMF0sIHN0cik6CiAgICAgICAgICAgICAgICB5YW1sX2xpbmVzLmFwcGVuZChmIntrfTogW3snLCAnLmpvaW4odil9XSIpCiAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoIi0tLSIpCiAgICAgICAgCiAgICAgICAgeWFtbF9mcm9udG1hdHRlciA9ICJcbiIuam9pbih5YW1sX2xpbmVzKQogICAgICAgIGRlc2MgPSBzdHJpcF9odG1sKGl0ZW0uZ2V0KCJkZXNjcmlwdGlvbiIsICIiKSkKICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGl0ZW0uZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgCiAgICAgICAgY29udGVudCA9IGYie3lhbWxfZnJvbnRtYXR0ZXJ9XG4jIHtuYW1lfVxuXG4iCiAgICAgICAgaWYgZGVzYzogY29udGVudCArPSBmIntkZXNjfVxuXG4iCiAgICAgICAgaWYgZWZmZWN0OiBjb250ZW50ICs9IGYiIyMjIHt0WydlZmZlY3QnXX1cbntlZmZlY3R9XG4iCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgbWFpbigpOgogICAgaWYgbGVuKHN5cy5hcmd2KSA8IDQ6CiAgICAgICAgcHJpbnQoIlVzYWdlOiBweXRob24gbGNwX3BhcnNlci5weSA8bGNwX3BhdGg+IDx2YXVsdF9wYXRoPiA8b3B0aW9uc19qc29uPiIpCiAgICAgICAgc3lzLmV4aXQoMSkKCiAgICBsY3BfcGF0aCA9IHN5cy5hcmd2WzFdCiAgICB2YXVsdF9wYXRoID0gc3lzLmFyZ3ZbMl0KICAgIHRyeToKICAgICAgICBvcHRpb25zID0ganNvbi5sb2FkcyhzeXMuYXJndlszXSkKICAgIGV4Y2VwdDoKICAgICAgICBvcHRpb25zID0geyJucGNfY2xhc3NlcyI6IFRydWUsICJucGNfdGVtcGxhdGVzIjogVHJ1ZSwgInBsYXllcl9kYXRhIjogVHJ1ZSwgImxhbmciOiAiZW4ifQogICAgICAgIAogICAgbGFuZyA9IG9wdGlvbnMuZ2V0KCJsYW5nIiwgImVuIikKICAgIAogICAgdHJ5OgogICAgICAgIHdpdGggemlwZmlsZS5aaXBGaWxlKGxjcF9wYXRoLCAncicpIGFzIHo6CiAgICAgICAgICAgIHRyeToKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX2ZlYXR1cmVzLmpzb24iKS5kZWNvZGUoInV0Zi04IikpCiAgICAgICAgICAgIGV4Y2VwdCBLZXlFcnJvcjoKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBbXQogICAgICAgICAgICBmZWF0dXJlX2RpY3QgPSB7ZlsiaWQiXTogZiBmb3IgZiBpbiBmZWF0dXJlc19kYXRhfQogICAgICAgICAgICAKICAgICAgICAgICAgZm9yIGYgaW4gei5uYW1lbGlzdCgpOgogICAgICAgICAgICAgICAgaWYgbm90IGYuZW5kc3dpdGgoJy5qc29uJyk6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICBpZiBmID09ICJsY3BfbWFuaWZlc3QuanNvbiI6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGYgPT0gIm5wY19jbGFzc2VzLmpzb24iOgogICAgICAgICAgICAgICAgICAgIGlmIG9wdGlvbnMuZ2V0KCJucGNfY2xhc3NlcyIsIFRydWUpOgogICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzX25wY19jbGFzc2VzKHosIHZhdWx0X3BhdGgsIGZlYXR1cmVfZGljdCwgbGFuZykKICAgICAgICAgICAgICAgIGVsaWYgZiA9PSAibnBjX3RlbXBsYXRlcy5qc29uIjoKICAgICAgICAgICAgICAgICAgICBpZiBvcHRpb25zLmdldCgibnBjX3RlbXBsYXRlcyIsIFRydWUpOgogICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzX25wY190ZW1wbGF0ZXMoeiwgdmF1bHRfcGF0aCwgZmVhdHVyZV9kaWN0LCBsYW5nKQogICAgICAgICAgICAgICAgZWxpZiBmID09ICJucGNfZmVhdHVyZXMuanNvbiI6CiAgICAgICAgICAgICAgICAgICAgcGFzcyAjIE9ubHkgaW1wb3J0ZWQgd2hlbiBuZWVkZWQgYnkgY2xhc3Nlcy90ZW1wbGF0ZXMKICAgICAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICAgICAgaWYgb3B0aW9ucy5nZXQoInBsYXllcl9kYXRhIiwgVHJ1ZSk6CiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NfZ2VuZXJpY19qc29uKHosIGYsIHZhdWx0X3BhdGgsIGxhbmcpCiAgICAgICAgICAgIAogICAgICAgIHByaW50KCJMQ1AgZXJmb2xncmVpY2ggZXh0cmFoaWVydC4iKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiRmVobGVyOiB7ZX0iKQogICAgICAgIHN5cy5leGl0KDEpCgppZiBfX25hbWVfXyA9PSAiX19tYWluX18iOgogICAgbWFpbigpCgo=";

