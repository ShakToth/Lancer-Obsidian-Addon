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

const LCP_PARSER_PYTHON_BASE64 = "aW1wb3J0IHN5cwppbXBvcnQgemlwZmlsZQppbXBvcnQganNvbgppbXBvcnQgb3MKaW1wb3J0IHJlCgpJMThOID0gewogICAgImRlIjogewogICAgICAgICJiYXNlX3dlYXBvbnMiOiAiQmFzaXMtV2FmZmVuICYgU3lzdGVtZSIsCiAgICAgICAgImF0dGFjayI6ICJBbmdyaWZmIiwKICAgICAgICAiZGFtYWdlIjogIlNjaGFkZW4iLAogICAgICAgICJhdXRvX2V4dHJhY3RlZCI6ICIqKERpZXNlIE5vdGl6IHd1cmRlIGF1dG9tYXRpc2NoIGF1cyBlaW5lciBMQ1AtRGF0ZWkgZXh0cmFoaWVydC4pKiIsCiAgICAgICAgImluZGV4X2VuZW15IjogIioqSW5kZXg6KiogW1tJbmRleF9GZWluZF9TdGF0YmxvY2tzXV0iLAogICAgICAgICJiYXNlX3N0YXRzIjogIkJhc2lzLVN0YXRzIiwKICAgICAgICAidGVtcGxhdGVfZmVhdHVyZXMiOiAiVGVtcGxhdGUgRmVhdHVyZXMiLAogICAgICAgICJlZmZlY3QiOiAiRWZmZWt0IgogICAgfSwKICAgICJlbiI6IHsKICAgICAgICAiYmFzZV93ZWFwb25zIjogIkJhc2UgV2VhcG9ucyAmIFN5c3RlbXMiLAogICAgICAgICJhdHRhY2siOiAiQXR0YWNrIiwKICAgICAgICAiZGFtYWdlIjogIkRhbWFnZSIsCiAgICAgICAgImF1dG9fZXh0cmFjdGVkIjogIiooVGhpcyBub3RlIHdhcyBhdXRvbWF0aWNhbGx5IGV4dHJhY3RlZCBmcm9tIGFuIExDUCBmaWxlLikqIiwKICAgICAgICAiaW5kZXhfZW5lbXkiOiAiKipJbmRleDoqKiBbW0luZGV4X0VuZW15X1N0YXRibG9ja3NdXSIsCiAgICAgICAgImJhc2Vfc3RhdHMiOiAiQmFzZSBTdGF0cyIsCiAgICAgICAgInRlbXBsYXRlX2ZlYXR1cmVzIjogIlRlbXBsYXRlIEZlYXR1cmVzIiwKICAgICAgICAiZWZmZWN0IjogIkVmZmVjdCIKICAgIH0KfQoKZGVmIGdldF9pMThuKGxhbmcpOgogICAgcmV0dXJuIEkxOE4uZ2V0KGxhbmcsIEkxOE5bImVuIl0pCgpkZWYgc3RyaXBfaHRtbCh0ZXh0KToKICAgIGlmIG5vdCBpc2luc3RhbmNlKHRleHQsIHN0cik6CiAgICAgICAgcmV0dXJuICIiCiAgICByZXR1cm4gcmUuc3ViKCc8W148XSs+JywgJycsIHRleHQpCgpkZWYgcHJvY2Vzc19ucGNfY2xhc3Nlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QsIGxhbmcpOgogICAgdCA9IGdldF9pMThuKGxhbmcpCiAgICB0YXJnZXRfZGlyID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICIwMF9SZWdlbG4iLCAiRmVpbmRfU3RhdGJsb2NrcyIpCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgCiAgICB0cnk6CiAgICAgICAgY2xhc3NlcyA9IGpzb24ubG9hZHMoei5yZWFkKCJucGNfY2xhc3Nlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgZXhjZXB0IEtleUVycm9yOgogICAgICAgIHJldHVybgogICAgICAgIAogICAgZm9yIG5wYyBpbiBjbGFzc2VzOgogICAgICAgIG5hbWUgPSBucGMuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIHN0YXRzID0gbnBjLmdldCgic3RhdHMiLCB7fSkKICAgICAgICBocCA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImhwIiwgWzBdKSkpCiAgICAgICAgZXZhc2lvbiA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImV2YWRlIiwgWzBdKSkpCiAgICAgICAgZWRlZiA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImVkZWYiLCBbMF0pKSkKICAgICAgICBhcm1vciA9ICIsICIuam9pbihtYXAoc3RyLCBzdGF0cy5nZXQoImFybW9yIiwgWzBdKSkpCiAgICAgICAgc3BlZWQgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJzcGVlZCIsIFswXSkpKQogICAgICAgIHNlbnNvcnMgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJzZW5zb3IiLCBbMF0pKSkKICAgICAgICAKICAgICAgICBmZWF0dXJlc19tYXJrZG93biA9IGYiIyMg4pqU77iPIHt0WydiYXNlX3dlYXBvbnMnXX1cbiIKICAgICAgICBiYXNlX2ZlYXR1cmVzID0gbnBjLmdldCgiYmFzZV9mZWF0dXJlcyIsIFtdKQogICAgICAgIGZvciBmX2lkIGluIGJhc2VfZmVhdHVyZXM6CiAgICAgICAgICAgIGlmIGZfaWQgaW4gZmVhdHVyZV9kaWN0OgogICAgICAgICAgICAgICAgZiA9IGZlYXR1cmVfZGljdFtmX2lkXQogICAgICAgICAgICAgICAgZl9uYW1lID0gZi5nZXQoIm5hbWUiLCAiVW5rbm93biIpCiAgICAgICAgICAgICAgICBmX3R5cGUgPSBmLmdldCgidHlwZSIsICJUcmFpdCIpCiAgICAgICAgICAgICAgICB3X3R5cGUgPSBmLmdldCgid2VhcG9uX3R5cGUiLCAiIikKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgaWYgZl90eXBlID09ICJXZWFwb24iOgogICAgICAgICAgICAgICAgICAgIGF0dF9ib251cyA9IGYuZ2V0KCJhdHRhY2tfYm9udXMiLCBbMF0pWzBdCiAgICAgICAgICAgICAgICAgICAgZG1nX2xpc3QgPSBmLmdldCgiZGFtYWdlIiwgW10pCiAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9ICIiCiAgICAgICAgICAgICAgICAgICAgaWYgZG1nX2xpc3Q6CiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBkbWdfbGlzdFswXQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdmFsID0gZC5nZXQoImRhbWFnZSIsIFswXSlbMF0gaWYgaXNpbnN0YW5jZShkLmdldCgiZGFtYWdlIiksIGxpc3QpIGVsc2UgZC5nZXQoInZhbCIsIDApCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ190eXBlID0gZC5nZXQoInR5cGUiLCAiIikKICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9IGYie2RtZ192YWx9IHtkbWdfdHlwZX0iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe3dfdHlwZX0pXG4gIC0ge3RbJ2F0dGFjayddfTogK3thdHRfYm9udXN9IHwge3RbJ2RhbWFnZSddfToge2RtZ19zdHJ9XG4iCiAgICAgICAgICAgICAgICBlbHNlOgogICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IHN0cmlwX2h0bWwoZi5nZXQoImVmZmVjdCIsICIiKSkKICAgICAgICAgICAgICAgICAgICBpZiBsZW4oZWZmZWN0KSA+IDMwMDoKICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0ID0gZWZmZWN0WzoyOTddICsgIi4uLiIKICAgICAgICAgICAgICAgICAgICBmZWF0dXJlc19tYXJrZG93biArPSBmIi0gKip7Zl9uYW1lfSoqICh7Zl90eXBlfSlcbiAgLSB7ZWZmZWN0fVxuIgoKICAgICAgICBmYWxsYmFja19jb250ZW50ID0gZiJcIlwiXCItLS1cbnRhZ3M6XG4gIC0gTlBDX0NsYXNzXG5IUDoge2hwfVxuQXJtb3I6IHthcm1vcn1cbkV2YXNpb246IHtldmFzaW9ufVxuRS1EZWZlbnNlOiB7ZWRlZn1cblNwZWVkOiB7c3BlZWR9XG5TZW5zb3IgUmFuZ2U6IHtzZW5zb3JzfVxuLS0tXG4jIHtuYW1lfVxuXG57e3t7TEFOQ0VSX1NUQVRTfX19fVxuXG57dFsnYXV0b19leHRyYWN0ZWQnXX1cblxuLS0tXG57dFsnaW5kZXhfZW5lbXknXX1cblwiXCJcIiIKICAgICAgICAKICAgICAgICB0ZW1wbGF0ZV9wYXRoID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICI5OV9URU1QTEFURVMiLCAiVGVtcGxhdGVfTWVjaC5tZCIpCiAgICAgICAgdGVtcGxhdGVfdGV4dCA9IGZhbGxiYWNrX2NvbnRlbnQKICAgICAgICBpZiBvcy5wYXRoLmV4aXN0cyh0ZW1wbGF0ZV9wYXRoKToKICAgICAgICAgICAgd2l0aCBvcGVuKHRlbXBsYXRlX3BhdGgsICJyIiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgdGY6CiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gdGYucmVhZCgpCiAgICAgICAgICAgIAogICAgICAgICAgICB5YW1sX3JlZ2V4ID0gcmUuY29tcGlsZShyIl4tLS1cbihbXHNcU10qPylcbi0tLSIpCiAgICAgICAgICAgIG1hdGNoID0geWFtbF9yZWdleC5zZWFyY2godGVtcGxhdGVfdGV4dCkKICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxudGFnczpcbiAgLSBOUENfQ2xhc3NcbkhQOiB7aHB9XG5Bcm1vcjoge2FybW9yfVxuRXZhc2lvbjoge2V2YXNpb259XG5FLURlZmVuc2U6IHtlZGVmfVxuU3BlZWQ6IHtzcGVlZH1cblNlbnNvciBSYW5nZToge3NlbnNvcnN9XG4iCiAgICAgICAgICAgIGlmIG1hdGNoOgogICAgICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxue21hdGNoLmdyb3VwKDEpfVxuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cbi0tLSIKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSB5YW1sX3JlZ2V4LnN1YihtZXJnZWRfeWFtbCwgdGVtcGxhdGVfdGV4dCwgMSkKICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSBtZXJnZWRfeWFtbCArICItLS1cbiIgKyB0ZW1wbGF0ZV90ZXh0CgogICAgICAgIHN0YXRzX2Jsb2NrID0gZiJgbGFuY2VyLXN0YXRzXG7wn5OKIHt0WydiYXNlX3N0YXRzJ119XG5IUDoge2hwfVxuQXJtb3I6IHthcm1vcn1cbkV2YXNpb246IHtldmFzaW9ufVxuRS1EZWZlbnNlOiB7ZWRlZn1cblNwZWVkOiB7c3BlZWR9XG5TZW5zb3IgUmFuZ2U6IHtzZW5zb3JzfVxuYFxue2ZlYXR1cmVzX21hcmtkb3dufSIKCiAgICAgICAgY29udGVudCA9IHRlbXBsYXRlX3RleHQKICAgICAgICBpZiAie3tMQU5DRVJfU1RBVFN9fSIgaW4gY29udGVudDoKICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgie3tMQU5DRVJfU1RBVFN9fSIsIHN0YXRzX2Jsb2NrKQogICAgICAgIGVsc2U6CiAgICAgICAgICAgIGNvbnRlbnQgKz0gIlxuXG4iICsgc3RhdHNfYmxvY2sKICAgICAgICAgICAgCiAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgiPCUgdHAuZmlsZS50aXRsZSAlPiIsIG5hbWUpCiAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgie3tuYW1lfX0iLCBuYW1lKQogICAgICAgIAogICAgICAgIHNhZmVfbmFtZSA9IHJlLnN1YihyJ1s8PjoiL1xcfD8qXScsICcnLCBzdHIobmFtZSkpCiAgICAgICAgZmlsZV9wYXRoID0gb3MucGF0aC5qb2luKHRhcmdldF9kaXIsIGYie3NhZmVfbmFtZX0ubWQiKQogICAgICAgIHdpdGggb3BlbihmaWxlX3BhdGgsICJ3IiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgZmlsZToKICAgICAgICAgICAgZmlsZS53cml0ZShjb250ZW50KQoKZGVmIHByb2Nlc3NfbnBjX3RlbXBsYXRlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QsIGxhbmcpOgogICAgdCA9IGdldF9pMThuKGxhbmcpCiAgICB0YXJnZXRfZGlyID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICIwMF9SZWdlbG4iLCAiRmVpbmRfVGVtcGxhdGVzIikKICAgIG9zLm1ha2VkaXJzKHRhcmdldF9kaXIsIGV4aXN0X29rPVRydWUpCiAgICB0cnk6CiAgICAgICAgdGVtcGxhdGVzID0ganNvbi5sb2Fkcyh6LnJlYWQoIm5wY190ZW1wbGF0ZXMuanNvbiIpLmRlY29kZSgidXRmLTgiKSkKICAgIGV4Y2VwdCBLZXlFcnJvcjoKICAgICAgICByZXR1cm4KCiAgICBmb3IgdGVtcCBpbiB0ZW1wbGF0ZXM6CiAgICAgICAgbmFtZSA9IHRlbXAuZ2V0KCJuYW1lIiwgIlVua25vd24iKQogICAgICAgIGRlc2MgPSBzdHJpcF9odG1sKHRlbXAuZ2V0KCJkZXNjcmlwdGlvbiIsICIiKSkKICAgICAgICAKICAgICAgICBmZWF0dXJlc19tYXJrZG93biA9IGYiIyMg4pqU77iPIHt0Wyd0ZW1wbGF0ZV9mZWF0dXJlcyddfVxuIgogICAgICAgIGJhc2VfZmVhdHVyZXMgPSB0ZW1wLmdldCgiYmFzZV9mZWF0dXJlcyIsIFtdKQogICAgICAgIGZvciBmX2lkIGluIGJhc2VfZmVhdHVyZXM6CiAgICAgICAgICAgIGlmIGZfaWQgaW4gZmVhdHVyZV9kaWN0OgogICAgICAgICAgICAgICAgZiA9IGZlYXR1cmVfZGljdFtmX2lkXQogICAgICAgICAgICAgICAgZl9uYW1lID0gZi5nZXQoIm5hbWUiLCAiVW5rbm93biIpCiAgICAgICAgICAgICAgICBlZmZlY3QgPSBzdHJpcF9odG1sKGYuZ2V0KCJlZmZlY3QiLCAiIikpCiAgICAgICAgICAgICAgICBmZWF0dXJlc19tYXJrZG93biArPSBmIi0gKip7Zl9uYW1lfSoqXG4gIC0ge2VmZmVjdH1cbiIKICAgICAgICAgICAgICAgIAogICAgICAgIGNvbnRlbnQgPSBmIi0tLVxudGFnczpcbiAgLSBOUENfVGVtcGxhdGVcbi0tLVxuIyB7bmFtZX1cblxue2Rlc2N9XG5cbntmZWF0dXJlc19tYXJrZG93bn0iCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgcHJvY2Vzc19nZW5lcmljX2pzb24oeiwgZmlsZW5hbWUsIHZhdWx0X3BhdGgsIGxhbmcpOgogICAgdCA9IGdldF9pMThuKGxhbmcpCiAgICBjYXRlZ29yeSA9IGZpbGVuYW1lLnJlcGxhY2UoJy5qc29uJywgJycpLnRpdGxlKCkKICAgIHRhcmdldF9kaXIgPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjAwX1JlZ2VsbiIsICJMQ1BfRGF0YSIsIGNhdGVnb3J5KQogICAgCiAgICB0cnk6CiAgICAgICAgZGF0YSA9IGpzb24ubG9hZHMoei5yZWFkKGZpbGVuYW1lKS5kZWNvZGUoInV0Zi04IikpCiAgICBleGNlcHQgRXhjZXB0aW9uOgogICAgICAgIHJldHVybgogICAgICAgIAogICAgaWYgbm90IGlzaW5zdGFuY2UoZGF0YSwgbGlzdCk6CiAgICAgICAgcmV0dXJuCiAgICAgICAgCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgCiAgICBmb3IgaXRlbSBpbiBkYXRhOgogICAgICAgIGlmIG5vdCBpc2luc3RhbmNlKGl0ZW0sIGRpY3QpOiBjb250aW51ZQogICAgICAgIG5hbWUgPSBpdGVtLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICAKICAgICAgICB5YW1sX2xpbmVzID0gWyItLS0iXQogICAgICAgIGZvciBrLCB2IGluIGl0ZW0uaXRlbXMoKToKICAgICAgICAgICAgaWYgayBpbiBbIm5hbWUiLCAiZGVzY3JpcHRpb24iLCAiZWZmZWN0Il06IGNvbnRpbnVlCiAgICAgICAgICAgIGlmIGlzaW5zdGFuY2UodiwgKHN0ciwgaW50LCBib29sLCBmbG9hdCkpOgogICAgICAgICAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoZiJ7a306IHt2fSIpCiAgICAgICAgICAgIGVsaWYgaXNpbnN0YW5jZSh2LCBsaXN0KSBhbmQgbGVuKHYpID4gMCBhbmQgaXNpbnN0YW5jZSh2WzBdLCBzdHIpOgogICAgICAgICAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoZiJ7a306IFt7JywgJy5qb2luKHYpfV0iKQogICAgICAgIHlhbWxfbGluZXMuYXBwZW5kKCItLS0iKQogICAgICAgIAogICAgICAgIHlhbWxfZnJvbnRtYXR0ZXIgPSAiXG4iLmpvaW4oeWFtbF9saW5lcykKICAgICAgICBkZXNjID0gc3RyaXBfaHRtbChpdGVtLmdldCgiZGVzY3JpcHRpb24iLCAiIikpCiAgICAgICAgZWZmZWN0ID0gc3RyaXBfaHRtbChpdGVtLmdldCgiZWZmZWN0IiwgIiIpKQogICAgICAgIAogICAgICAgIGNvbnRlbnQgPSBmInt5YW1sX2Zyb250bWF0dGVyfVxuIyB7bmFtZX1cblxuIgogICAgICAgIGlmIGRlc2M6IGNvbnRlbnQgKz0gZiJ7ZGVzY31cblxuIgogICAgICAgIGlmIGVmZmVjdDogY29udGVudCArPSBmIiMjIyB7dFsnZWZmZWN0J119XG57ZWZmZWN0fVxuIgogICAgICAgIAogICAgICAgIHNhZmVfbmFtZSA9IHJlLnN1YihyJ1s8PjoiL1xcfD8qXScsICcnLCBzdHIobmFtZSkpCiAgICAgICAgZmlsZV9wYXRoID0gb3MucGF0aC5qb2luKHRhcmdldF9kaXIsIGYie3NhZmVfbmFtZX0ubWQiKQogICAgICAgIHdpdGggb3BlbihmaWxlX3BhdGgsICJ3IiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgZmlsZToKICAgICAgICAgICAgZmlsZS53cml0ZShjb250ZW50KQoKZGVmIG1haW4oKToKICAgIGlmIGxlbihzeXMuYXJndikgPCA0OgogICAgICAgIHByaW50KCJVc2FnZTogcHl0aG9uIGxjcF9wYXJzZXIucHkgPGxjcF9wYXRoPiA8dmF1bHRfcGF0aD4gPG9wdGlvbnNfanNvbj4iKQogICAgICAgIHN5cy5leGl0KDEpCgogICAgbGNwX3BhdGggPSBzeXMuYXJndlsxXQogICAgdmF1bHRfcGF0aCA9IHN5cy5hcmd2WzJdCiAgICB0cnk6CiAgICAgICAgb3B0aW9ucyA9IGpzb24ubG9hZHMoc3lzLmFyZ3ZbM10pCiAgICBleGNlcHQ6CiAgICAgICAgb3B0aW9ucyA9IHsibnBjX2NsYXNzZXMiOiBUcnVlLCAibnBjX3RlbXBsYXRlcyI6IFRydWUsICJwbGF5ZXJfZGF0YSI6IFRydWUsICJsYW5nIjogImVuIn0KICAgICAgICAKICAgIGxhbmcgPSBvcHRpb25zLmdldCgibGFuZyIsICJlbiIpCiAgICAKICAgIHRyeToKICAgICAgICB3aXRoIHppcGZpbGUuWmlwRmlsZShsY3BfcGF0aCwgJ3InKSBhcyB6OgogICAgICAgICAgICB0cnk6CiAgICAgICAgICAgICAgICBmZWF0dXJlc19kYXRhID0ganNvbi5sb2Fkcyh6LnJlYWQoIm5wY19mZWF0dXJlcy5qc29uIikuZGVjb2RlKCJ1dGYtOCIpKQogICAgICAgICAgICBleGNlcHQgS2V5RXJyb3I6CiAgICAgICAgICAgICAgICBmZWF0dXJlc19kYXRhID0gW10KICAgICAgICAgICAgZmVhdHVyZV9kaWN0ID0ge2ZbImlkIl06IGYgZm9yIGYgaW4gZmVhdHVyZXNfZGF0YX0KICAgICAgICAgICAgCiAgICAgICAgICAgIGZvciBmIGluIHoubmFtZWxpc3QoKToKICAgICAgICAgICAgICAgIGlmIG5vdCBmLmVuZHN3aXRoKCcuanNvbicpOiBjb250aW51ZQogICAgICAgICAgICAgICAgaWYgZiA9PSAibGNwX21hbmlmZXN0Lmpzb24iOiBjb250aW51ZQogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBpZiBmID09ICJucGNfY2xhc3Nlcy5qc29uIjoKICAgICAgICAgICAgICAgICAgICBpZiBvcHRpb25zLmdldCgibnBjX2NsYXNzZXMiLCBUcnVlKToKICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc19ucGNfY2xhc3Nlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QsIGxhbmcpCiAgICAgICAgICAgICAgICBlbGlmIGYgPT0gIm5wY190ZW1wbGF0ZXMuanNvbiI6CiAgICAgICAgICAgICAgICAgICAgaWYgb3B0aW9ucy5nZXQoIm5wY190ZW1wbGF0ZXMiLCBUcnVlKToKICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc19ucGNfdGVtcGxhdGVzKHosIHZhdWx0X3BhdGgsIGZlYXR1cmVfZGljdCwgbGFuZykKICAgICAgICAgICAgICAgIGVsaWYgZiA9PSAibnBjX2ZlYXR1cmVzLmpzb24iOgogICAgICAgICAgICAgICAgICAgIHBhc3MgIyBPbmx5IGltcG9ydGVkIHdoZW4gbmVlZGVkIGJ5IGNsYXNzZXMvdGVtcGxhdGVzCiAgICAgICAgICAgICAgICBlbHNlOgogICAgICAgICAgICAgICAgICAgIGlmIG9wdGlvbnMuZ2V0KCJwbGF5ZXJfZGF0YSIsIFRydWUpOgogICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzX2dlbmVyaWNfanNvbih6LCBmLCB2YXVsdF9wYXRoLCBsYW5nKQogICAgICAgICAgICAKICAgICAgICBwcmludCgiTENQIGVyZm9sZ3JlaWNoIGV4dHJhaGllcnQuIikKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICBwcmludChmIkZlaGxlcjoge2V9IikKICAgICAgICBzeXMuZXhpdCgxKQoKaWYgX19uYW1lX18gPT0gIl9fbWFpbl9fIjoKICAgIG1haW4oKQ0K";

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
const JSZIP_BASE64 = "LyohCgpKU1ppcCB2My4xMC4xIC0gQSBKYXZhU2NyaXB0IGNsYXNzIGZvciBnZW5lcmF0aW5nIGFuZCByZWFkaW5nIHppcCBmaWxlcwo8aHR0cDovL3N0dWFydGsuY29tL2pzemlwPgoKKGMpIDIwMDktMjAxNiBTdHVhcnQgS25pZ2h0bGV5IDxzdHVhcnQgW2F0XSBzdHVhcnRrLmNvbT4KRHVhbCBsaWNlbmNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2Ugb3IgR1BMdjMuIFNlZSBodHRwczovL3Jhdy5naXRodWIuY29tL1N0dWsvanN6aXAvbWFpbi9MSUNFTlNFLm1hcmtkb3duLgoKSlNaaXAgdXNlcyB0aGUgbGlicmFyeSBwYWtvIHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSA6Cmh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9ibG9iL21haW4vTElDRU5TRQoqLwoKIWZ1bmN0aW9uKGUpe2lmKCJvYmplY3QiPT10eXBlb2YgZXhwb3J0cyYmInVuZGVmaW5lZCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoImZ1bmN0aW9uIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sZSk7ZWxzZXsoInVuZGVmaW5lZCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OiJ1bmRlZmluZWQiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDoidW5kZWZpbmVkIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzKS5KU1ppcD1lKCl9fShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKGEsbyxoKXtmdW5jdGlvbiB1KHIsZSl7aWYoIW9bcl0pe2lmKCFhW3JdKXt2YXIgdD0iZnVuY3Rpb24iPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZSYmdClyZXR1cm4gdChyLCEwKTtpZihsKXJldHVybiBsKHIsITApO3ZhciBuPW5ldyBFcnJvcigiQ2Fubm90IGZpbmQgbW9kdWxlICciK3IrIiciKTt0aHJvdyBuLmNvZGU9Ik1PRFVMRV9OT1RfRk9VTkQiLG59dmFyIGk9b1tyXT17ZXhwb3J0czp7fX07YVtyXVswXS5jYWxsKGkuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgdD1hW3JdWzFdW2VdO3JldHVybiB1KHR8fGUpfSxpLGkuZXhwb3J0cyxzLGEsbyxoKX1yZXR1cm4gb1tyXS5leHBvcnRzfWZvcih2YXIgbD0iZnVuY3Rpb24iPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxlPTA7ZTxoLmxlbmd0aDtlKyspdShoW2VdKTtyZXR1cm4gdX0oezE6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dmFyIGQ9ZSgiLi91dGlscyIpLGM9ZSgiLi9zdXBwb3J0IikscD0iQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0iO3IuZW5jb2RlPWZ1bmN0aW9uKGUpe2Zvcih2YXIgdCxyLG4saSxzLGEsbyxoPVtdLHU9MCxsPWUubGVuZ3RoLGY9bCxjPSJzdHJpbmciIT09ZC5nZXRUeXBlT2YoZSk7dTxlLmxlbmd0aDspZj1sLXUsbj1jPyh0PWVbdSsrXSxyPXU8bD9lW3UrK106MCx1PGw/ZVt1KytdOjApOih0PWUuY2hhckNvZGVBdCh1KyspLHI9dTxsP2UuY2hhckNvZGVBdCh1KyspOjAsdTxsP2UuY2hhckNvZGVBdCh1KyspOjApLGk9dD4+MixzPSgzJnQpPDw0fHI+PjQsYT0xPGY/KDE1JnIpPDwyfG4+PjY6NjQsbz0yPGY/NjMmbjo2NCxoLnB1c2gocC5jaGFyQXQoaSkrcC5jaGFyQXQocykrcC5jaGFyQXQoYSkrcC5jaGFyQXQobykpO3JldHVybiBoLmpvaW4oIiIpfSxyLmRlY29kZT1mdW5jdGlvbihlKXt2YXIgdCxyLG4saSxzLGEsbz0wLGg9MCx1PSJkYXRhOiI7aWYoZS5zdWJzdHIoMCx1Lmxlbmd0aCk9PT11KXRocm93IG5ldyBFcnJvcigiSW52YWxpZCBiYXNlNjQgaW5wdXQsIGl0IGxvb2tzIGxpa2UgYSBkYXRhIHVybC4iKTt2YXIgbCxmPTMqKGU9ZS5yZXBsYWNlKC9bXkEtWmEtejAtOSsvPV0vZywiIikpLmxlbmd0aC80O2lmKGUuY2hhckF0KGUubGVuZ3RoLTEpPT09cC5jaGFyQXQoNjQpJiZmLS0sZS5jaGFyQXQoZS5sZW5ndGgtMik9PT1wLmNoYXJBdCg2NCkmJmYtLSxmJTEhPTApdGhyb3cgbmV3IEVycm9yKCJJbnZhbGlkIGJhc2U2NCBpbnB1dCwgYmFkIGNvbnRlbnQgbGVuZ3RoLiIpO2ZvcihsPWMudWludDhhcnJheT9uZXcgVWludDhBcnJheSgwfGYpOm5ldyBBcnJheSgwfGYpO288ZS5sZW5ndGg7KXQ9cC5pbmRleE9mKGUuY2hhckF0KG8rKykpPDwyfChpPXAuaW5kZXhPZihlLmNoYXJBdChvKyspKSk+PjQscj0oMTUmaSk8PDR8KHM9cC5pbmRleE9mKGUuY2hhckF0KG8rKykpKT4+MixuPSgzJnMpPDw2fChhPXAuaW5kZXhPZihlLmNoYXJBdChvKyspKSksbFtoKytdPXQsNjQhPT1zJiYobFtoKytdPXIpLDY0IT09YSYmKGxbaCsrXT1uKTtyZXR1cm4gbH19LHsiLi9zdXBwb3J0IjozMCwiLi91dGlscyI6MzJ9XSwyOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vZXh0ZXJuYWwiKSxpPWUoIi4vc3RyZWFtL0RhdGFXb3JrZXIiKSxzPWUoIi4vc3RyZWFtL0NyYzMyUHJvYmUiKSxhPWUoIi4vc3RyZWFtL0RhdGFMZW5ndGhQcm9iZSIpO2Z1bmN0aW9uIG8oZSx0LHIsbixpKXt0aGlzLmNvbXByZXNzZWRTaXplPWUsdGhpcy51bmNvbXByZXNzZWRTaXplPXQsdGhpcy5jcmMzMj1yLHRoaXMuY29tcHJlc3Npb249bix0aGlzLmNvbXByZXNzZWRDb250ZW50PWl9by5wcm90b3R5cGU9e2dldENvbnRlbnRXb3JrZXI6ZnVuY3Rpb24oKXt2YXIgZT1uZXcgaShuLlByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXByZXNzZWRDb250ZW50KSkucGlwZSh0aGlzLmNvbXByZXNzaW9uLnVuY29tcHJlc3NXb3JrZXIoKSkucGlwZShuZXcgYSgiZGF0YV9sZW5ndGgiKSksdD10aGlzO3JldHVybiBlLm9uKCJlbmQiLGZ1bmN0aW9uKCl7aWYodGhpcy5zdHJlYW1JbmZvLmRhdGFfbGVuZ3RoIT09dC51bmNvbXByZXNzZWRTaXplKXRocm93IG5ldyBFcnJvcigiQnVnIDogdW5jb21wcmVzc2VkIGRhdGEgc2l6ZSBtaXNtYXRjaCIpfSksZX0sZ2V0Q29tcHJlc3NlZFdvcmtlcjpmdW5jdGlvbigpe3JldHVybiBuZXcgaShuLlByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXByZXNzZWRDb250ZW50KSkud2l0aFN0cmVhbUluZm8oImNvbXByZXNzZWRTaXplIix0aGlzLmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbygidW5jb21wcmVzc2VkU2l6ZSIsdGhpcy51bmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbygiY3JjMzIiLHRoaXMuY3JjMzIpLndpdGhTdHJlYW1JbmZvKCJjb21wcmVzc2lvbiIsdGhpcy5jb21wcmVzc2lvbil9fSxvLmNyZWF0ZVdvcmtlckZyb209ZnVuY3Rpb24oZSx0LHIpe3JldHVybiBlLnBpcGUobmV3IHMpLnBpcGUobmV3IGEoInVuY29tcHJlc3NlZFNpemUiKSkucGlwZSh0LmNvbXByZXNzV29ya2VyKHIpKS5waXBlKG5ldyBhKCJjb21wcmVzc2VkU2l6ZSIpKS53aXRoU3RyZWFtSW5mbygiY29tcHJlc3Npb24iLHQpfSx0LmV4cG9ydHM9b30seyIuL2V4dGVybmFsIjo2LCIuL3N0cmVhbS9DcmMzMlByb2JlIjoyNSwiLi9zdHJlYW0vRGF0YUxlbmd0aFByb2JlIjoyNiwiLi9zdHJlYW0vRGF0YVdvcmtlciI6Mjd9XSwzOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXIiKTtyLlNUT1JFPXttYWdpYzoiXDBcMCIsY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4oIlNUT1JFIGNvbXByZXNzaW9uIil9LHVuY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4oIlNUT1JFIGRlY29tcHJlc3Npb24iKX19LHIuREVGTEFURT1lKCIuL2ZsYXRlIil9LHsiLi9mbGF0ZSI6NywiLi9zdHJlYW0vR2VuZXJpY1dvcmtlciI6Mjh9XSw0OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vdXRpbHMiKTt2YXIgbz1mdW5jdGlvbigpe2Zvcih2YXIgZSx0PVtdLHI9MDtyPDI1NjtyKyspe2U9cjtmb3IodmFyIG49MDtuPDg7bisrKWU9MSZlPzM5ODgyOTIzODReZT4+PjE6ZT4+PjE7dFtyXT1lfXJldHVybiB0fSgpO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQpe3JldHVybiB2b2lkIDAhPT1lJiZlLmxlbmd0aD8ic3RyaW5nIiE9PW4uZ2V0VHlwZU9mKGUpP2Z1bmN0aW9uKGUsdCxyLG4pe3ZhciBpPW8scz1uK3I7ZV49LTE7Zm9yKHZhciBhPW47YTxzO2ErKyllPWU+Pj44XmlbMjU1JihlXnRbYV0pXTtyZXR1cm4tMV5lfSgwfHQsZSxlLmxlbmd0aCwwKTpmdW5jdGlvbihlLHQscixuKXt2YXIgaT1vLHM9bityO2VePS0xO2Zvcih2YXIgYT1uO2E8czthKyspZT1lPj4+OF5pWzI1NSYoZV50LmNoYXJDb2RlQXQoYSkpXTtyZXR1cm4tMV5lfSgwfHQsZSxlLmxlbmd0aCwwKTowfX0seyIuL3V0aWxzIjozMn1dLDU6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7ci5iYXNlNjQ9ITEsci5iaW5hcnk9ITEsci5kaXI9ITEsci5jcmVhdGVGb2xkZXJzPSEwLHIuZGF0ZT1udWxsLHIuY29tcHJlc3Npb249bnVsbCxyLmNvbXByZXNzaW9uT3B0aW9ucz1udWxsLHIuY29tbWVudD1udWxsLHIudW5peFBlcm1pc3Npb25zPW51bGwsci5kb3NQZXJtaXNzaW9ucz1udWxsfSx7fV0sNjpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1udWxsO249InVuZGVmaW5lZCIhPXR5cGVvZiBQcm9taXNlP1Byb21pc2U6ZSgibGllIiksdC5leHBvcnRzPXtQcm9taXNlOm59fSx7bGllOjM3fV0sNzpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj0idW5kZWZpbmVkIiE9dHlwZW9mIFVpbnQ4QXJyYXkmJiJ1bmRlZmluZWQiIT10eXBlb2YgVWludDE2QXJyYXkmJiJ1bmRlZmluZWQiIT10eXBlb2YgVWludDMyQXJyYXksaT1lKCJwYWtvIikscz1lKCIuL3V0aWxzIiksYT1lKCIuL3N0cmVhbS9HZW5lcmljV29ya2VyIiksbz1uPyJ1aW50OGFycmF5IjoiYXJyYXkiO2Z1bmN0aW9uIGgoZSx0KXthLmNhbGwodGhpcywiRmxhdGVXb3JrZXIvIitlKSx0aGlzLl9wYWtvPW51bGwsdGhpcy5fcGFrb0FjdGlvbj1lLHRoaXMuX3Bha29PcHRpb25zPXQsdGhpcy5tZXRhPXt9fXIubWFnaWM9IlxiXDAiLHMuaW5oZXJpdHMoaCxhKSxoLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7dGhpcy5tZXRhPWUubWV0YSxudWxsPT09dGhpcy5fcGFrbyYmdGhpcy5fY3JlYXRlUGFrbygpLHRoaXMuX3Bha28ucHVzaChzLnRyYW5zZm9ybVRvKG8sZS5kYXRhKSwhMSl9LGgucHJvdG90eXBlLmZsdXNoPWZ1bmN0aW9uKCl7YS5wcm90b3R5cGUuZmx1c2guY2FsbCh0aGlzKSxudWxsPT09dGhpcy5fcGFrbyYmdGhpcy5fY3JlYXRlUGFrbygpLHRoaXMuX3Bha28ucHVzaChbXSwhMCl9LGgucHJvdG90eXBlLmNsZWFuVXA9ZnVuY3Rpb24oKXthLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyksdGhpcy5fcGFrbz1udWxsfSxoLnByb3RvdHlwZS5fY3JlYXRlUGFrbz1mdW5jdGlvbigpe3RoaXMuX3Bha289bmV3IGlbdGhpcy5fcGFrb0FjdGlvbl0oe3JhdzohMCxsZXZlbDp0aGlzLl9wYWtvT3B0aW9ucy5sZXZlbHx8LTF9KTt2YXIgdD10aGlzO3RoaXMuX3Bha28ub25EYXRhPWZ1bmN0aW9uKGUpe3QucHVzaCh7ZGF0YTplLG1ldGE6dC5tZXRhfSl9fSxyLmNvbXByZXNzV29ya2VyPWZ1bmN0aW9uKGUpe3JldHVybiBuZXcgaCgiRGVmbGF0ZSIsZSl9LHIudW5jb21wcmVzc1dvcmtlcj1mdW5jdGlvbigpe3JldHVybiBuZXcgaCgiSW5mbGF0ZSIse30pfX0seyIuL3N0cmVhbS9HZW5lcmljV29ya2VyIjoyOCwiLi91dGlscyI6MzIscGFrbzozOH1dLDg6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7ZnVuY3Rpb24gQShlLHQpe3ZhciByLG49IiI7Zm9yKHI9MDtyPHQ7cisrKW4rPVN0cmluZy5mcm9tQ2hhckNvZGUoMjU1JmUpLGU+Pj49ODtyZXR1cm4gbn1mdW5jdGlvbiBuKGUsdCxyLG4saSxzKXt2YXIgYSxvLGg9ZS5maWxlLHU9ZS5jb21wcmVzc2lvbixsPXMhPT1PLnV0ZjhlbmNvZGUsZj1JLnRyYW5zZm9ybVRvKCJzdHJpbmciLHMoaC5uYW1lKSksYz1JLnRyYW5zZm9ybVRvKCJzdHJpbmciLE8udXRmOGVuY29kZShoLm5hbWUpKSxkPWguY29tbWVudCxwPUkudHJhbnNmb3JtVG8oInN0cmluZyIscyhkKSksbT1JLnRyYW5zZm9ybVRvKCJzdHJpbmciLE8udXRmOGVuY29kZShkKSksXz1jLmxlbmd0aCE9PWgubmFtZS5sZW5ndGgsZz1tLmxlbmd0aCE9PWQubGVuZ3RoLGI9IiIsdj0iIix5PSIiLHc9aC5kaXIsaz1oLmRhdGUseD17Y3JjMzI6MCxjb21wcmVzc2VkU2l6ZTowLHVuY29tcHJlc3NlZFNpemU6MH07dCYmIXJ8fCh4LmNyYzMyPWUuY3JjMzIseC5jb21wcmVzc2VkU2l6ZT1lLmNvbXByZXNzZWRTaXplLHgudW5jb21wcmVzc2VkU2l6ZT1lLnVuY29tcHJlc3NlZFNpemUpO3ZhciBTPTA7dCYmKFN8PTgpLGx8fCFfJiYhZ3x8KFN8PTIwNDgpO3ZhciB6PTAsQz0wO3cmJih6fD0xNiksIlVOSVgiPT09aT8oQz03OTgsenw9ZnVuY3Rpb24oZSx0KXt2YXIgcj1lO3JldHVybiBlfHwocj10PzE2ODkzOjMzMjA0KSwoNjU1MzUmcik8PDE2fShoLnVuaXhQZXJtaXNzaW9ucyx3KSk6KEM9MjAsenw9ZnVuY3Rpb24oZSl7cmV0dXJuIDYzJihlfHwwKX0oaC5kb3NQZXJtaXNzaW9ucykpLGE9ay5nZXRVVENIb3VycygpLGE8PD02LGF8PWsuZ2V0VVRDTWludXRlcygpLGE8PD01LGF8PWsuZ2V0VVRDU2Vjb25kcygpLzIsbz1rLmdldFVUQ0Z1bGxZZWFyKCktMTk4MCxvPDw9NCxvfD1rLmdldFVUQ01vbnRoKCkrMSxvPDw9NSxvfD1rLmdldFVUQ0RhdGUoKSxfJiYodj1BKDEsMSkrQShCKGYpLDQpK2MsYis9InVwIitBKHYubGVuZ3RoLDIpK3YpLGcmJih5PUEoMSwxKStBKEIocCksNCkrbSxiKz0idWMiK0EoeS5sZW5ndGgsMikreSk7dmFyIEU9IiI7cmV0dXJuIEUrPSJcblwwIixFKz1BKFMsMiksRSs9dS5tYWdpYyxFKz1BKGEsMiksRSs9QShvLDIpLEUrPUEoeC5jcmMzMiw0KSxFKz1BKHguY29tcHJlc3NlZFNpemUsNCksRSs9QSh4LnVuY29tcHJlc3NlZFNpemUsNCksRSs9QShmLmxlbmd0aCwyKSxFKz1BKGIubGVuZ3RoLDIpLHtmaWxlUmVjb3JkOlIuTE9DQUxfRklMRV9IRUFERVIrRStmK2IsZGlyUmVjb3JkOlIuQ0VOVFJBTF9GSUxFX0hFQURFUitBKEMsMikrRStBKHAubGVuZ3RoLDIpKyJcMFwwXDBcMCIrQSh6LDQpK0Eobiw0KStmK2IrcH19dmFyIEk9ZSgiLi4vdXRpbHMiKSxpPWUoIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyIiksTz1lKCIuLi91dGY4IiksQj1lKCIuLi9jcmMzMiIpLFI9ZSgiLi4vc2lnbmF0dXJlIik7ZnVuY3Rpb24gcyhlLHQscixuKXtpLmNhbGwodGhpcywiWmlwRmlsZVdvcmtlciIpLHRoaXMuYnl0ZXNXcml0dGVuPTAsdGhpcy56aXBDb21tZW50PXQsdGhpcy56aXBQbGF0Zm9ybT1yLHRoaXMuZW5jb2RlRmlsZU5hbWU9bix0aGlzLnN0cmVhbUZpbGVzPWUsdGhpcy5hY2N1bXVsYXRlPSExLHRoaXMuY29udGVudEJ1ZmZlcj1bXSx0aGlzLmRpclJlY29yZHM9W10sdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0PTAsdGhpcy5lbnRyaWVzQ291bnQ9MCx0aGlzLmN1cnJlbnRGaWxlPW51bGwsdGhpcy5fc291cmNlcz1bXX1JLmluaGVyaXRzKHMsaSkscy5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlKXt2YXIgdD1lLm1ldGEucGVyY2VudHx8MCxyPXRoaXMuZW50cmllc0NvdW50LG49dGhpcy5fc291cmNlcy5sZW5ndGg7dGhpcy5hY2N1bXVsYXRlP3RoaXMuY29udGVudEJ1ZmZlci5wdXNoKGUpOih0aGlzLmJ5dGVzV3JpdHRlbis9ZS5kYXRhLmxlbmd0aCxpLnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcyx7ZGF0YTplLmRhdGEsbWV0YTp7Y3VycmVudEZpbGU6dGhpcy5jdXJyZW50RmlsZSxwZXJjZW50OnI/KHQrMTAwKihyLW4tMSkpL3I6MTAwfX0pKX0scy5wcm90b3R5cGUub3BlbmVkU291cmNlPWZ1bmN0aW9uKGUpe3RoaXMuY3VycmVudFNvdXJjZU9mZnNldD10aGlzLmJ5dGVzV3JpdHRlbix0aGlzLmN1cnJlbnRGaWxlPWUuZmlsZS5uYW1lO3ZhciB0PXRoaXMuc3RyZWFtRmlsZXMmJiFlLmZpbGUuZGlyO2lmKHQpe3ZhciByPW4oZSx0LCExLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCx0aGlzLnppcFBsYXRmb3JtLHRoaXMuZW5jb2RlRmlsZU5hbWUpO3RoaXMucHVzaCh7ZGF0YTpyLmZpbGVSZWNvcmQsbWV0YTp7cGVyY2VudDowfX0pfWVsc2UgdGhpcy5hY2N1bXVsYXRlPSEwfSxzLnByb3RvdHlwZS5jbG9zZWRTb3VyY2U9ZnVuY3Rpb24oZSl7dGhpcy5hY2N1bXVsYXRlPSExO3ZhciB0PXRoaXMuc3RyZWFtRmlsZXMmJiFlLmZpbGUuZGlyLHI9bihlLHQsITAsdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0LHRoaXMuemlwUGxhdGZvcm0sdGhpcy5lbmNvZGVGaWxlTmFtZSk7aWYodGhpcy5kaXJSZWNvcmRzLnB1c2goci5kaXJSZWNvcmQpLHQpdGhpcy5wdXNoKHtkYXRhOmZ1bmN0aW9uKGUpe3JldHVybiBSLkRBVEFfREVTQ1JJUFRPUitBKGUuY3JjMzIsNCkrQShlLmNvbXByZXNzZWRTaXplLDQpK0EoZS51bmNvbXByZXNzZWRTaXplLDQpfShlKSxtZXRhOntwZXJjZW50OjEwMH19KTtlbHNlIGZvcih0aGlzLnB1c2goe2RhdGE6ci5maWxlUmVjb3JkLG1ldGE6e3BlcmNlbnQ6MH19KTt0aGlzLmNvbnRlbnRCdWZmZXIubGVuZ3RoOyl0aGlzLnB1c2godGhpcy5jb250ZW50QnVmZmVyLnNoaWZ0KCkpO3RoaXMuY3VycmVudEZpbGU9bnVsbH0scy5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXtmb3IodmFyIGU9dGhpcy5ieXRlc1dyaXR0ZW4sdD0wO3Q8dGhpcy5kaXJSZWNvcmRzLmxlbmd0aDt0KyspdGhpcy5wdXNoKHtkYXRhOnRoaXMuZGlyUmVjb3Jkc1t0XSxtZXRhOntwZXJjZW50OjEwMH19KTt2YXIgcj10aGlzLmJ5dGVzV3JpdHRlbi1lLG49ZnVuY3Rpb24oZSx0LHIsbixpKXt2YXIgcz1JLnRyYW5zZm9ybVRvKCJzdHJpbmciLGkobikpO3JldHVybiBSLkNFTlRSQUxfRElSRUNUT1JZX0VORCsiXDBcMFwwXDAiK0EoZSwyKStBKGUsMikrQSh0LDQpK0Eociw0KStBKHMubGVuZ3RoLDIpK3N9KHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGgscixlLHRoaXMuemlwQ29tbWVudCx0aGlzLmVuY29kZUZpbGVOYW1lKTt0aGlzLnB1c2goe2RhdGE6bixtZXRhOntwZXJjZW50OjEwMH19KX0scy5wcm90b3R5cGUucHJlcGFyZU5leHRTb3VyY2U9ZnVuY3Rpb24oKXt0aGlzLnByZXZpb3VzPXRoaXMuX3NvdXJjZXMuc2hpZnQoKSx0aGlzLm9wZW5lZFNvdXJjZSh0aGlzLnByZXZpb3VzLnN0cmVhbUluZm8pLHRoaXMuaXNQYXVzZWQ/dGhpcy5wcmV2aW91cy5wYXVzZSgpOnRoaXMucHJldmlvdXMucmVzdW1lKCl9LHMucHJvdG90eXBlLnJlZ2lzdGVyUHJldmlvdXM9ZnVuY3Rpb24oZSl7dGhpcy5fc291cmNlcy5wdXNoKGUpO3ZhciB0PXRoaXM7cmV0dXJuIGUub24oImRhdGEiLGZ1bmN0aW9uKGUpe3QucHJvY2Vzc0NodW5rKGUpfSksZS5vbigiZW5kIixmdW5jdGlvbigpe3QuY2xvc2VkU291cmNlKHQucHJldmlvdXMuc3RyZWFtSW5mbyksdC5fc291cmNlcy5sZW5ndGg/dC5wcmVwYXJlTmV4dFNvdXJjZSgpOnQuZW5kKCl9KSxlLm9uKCJlcnJvciIsZnVuY3Rpb24oZSl7dC5lcnJvcihlKX0pLHRoaXN9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhaS5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5wcmV2aW91cyYmdGhpcy5fc291cmNlcy5sZW5ndGg/KHRoaXMucHJlcGFyZU5leHRTb3VyY2UoKSwhMCk6dGhpcy5wcmV2aW91c3x8dGhpcy5fc291cmNlcy5sZW5ndGh8fHRoaXMuZ2VuZXJhdGVkRXJyb3I/dm9pZCAwOih0aGlzLmVuZCgpLCEwKSl9LHMucHJvdG90eXBlLmVycm9yPWZ1bmN0aW9uKGUpe3ZhciB0PXRoaXMuX3NvdXJjZXM7aWYoIWkucHJvdG90eXBlLmVycm9yLmNhbGwodGhpcyxlKSlyZXR1cm4hMTtmb3IodmFyIHI9MDtyPHQubGVuZ3RoO3IrKyl0cnl7dFtyXS5lcnJvcihlKX1jYXRjaChlKXt9cmV0dXJuITB9LHMucHJvdG90eXBlLmxvY2s9ZnVuY3Rpb24oKXtpLnByb3RvdHlwZS5sb2NrLmNhbGwodGhpcyk7Zm9yKHZhciBlPXRoaXMuX3NvdXJjZXMsdD0wO3Q8ZS5sZW5ndGg7dCsrKWVbdF0ubG9jaygpfSx0LmV4cG9ydHM9c30seyIuLi9jcmMzMiI6NCwiLi4vc2lnbmF0dXJlIjoyMywiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXIiOjI4LCIuLi91dGY4IjozMSwiLi4vdXRpbHMiOjMyfV0sOTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgdT1lKCIuLi9jb21wcmVzc2lvbnMiKSxuPWUoIi4vWmlwRmlsZVdvcmtlciIpO3IuZ2VuZXJhdGVXb3JrZXI9ZnVuY3Rpb24oZSxhLHQpe3ZhciBvPW5ldyBuKGEuc3RyZWFtRmlsZXMsdCxhLnBsYXRmb3JtLGEuZW5jb2RlRmlsZU5hbWUpLGg9MDt0cnl7ZS5mb3JFYWNoKGZ1bmN0aW9uKGUsdCl7aCsrO3ZhciByPWZ1bmN0aW9uKGUsdCl7dmFyIHI9ZXx8dCxuPXVbcl07aWYoIW4pdGhyb3cgbmV3IEVycm9yKHIrIiBpcyBub3QgYSB2YWxpZCBjb21wcmVzc2lvbiBtZXRob2QgISIpO3JldHVybiBufSh0Lm9wdGlvbnMuY29tcHJlc3Npb24sYS5jb21wcmVzc2lvbiksbj10Lm9wdGlvbnMuY29tcHJlc3Npb25PcHRpb25zfHxhLmNvbXByZXNzaW9uT3B0aW9uc3x8e30saT10LmRpcixzPXQuZGF0ZTt0Ll9jb21wcmVzc1dvcmtlcihyLG4pLndpdGhTdHJlYW1JbmZvKCJmaWxlIix7bmFtZTplLGRpcjppLGRhdGU6cyxjb21tZW50OnQuY29tbWVudHx8IiIsdW5peFBlcm1pc3Npb25zOnQudW5peFBlcm1pc3Npb25zLGRvc1Blcm1pc3Npb25zOnQuZG9zUGVybWlzc2lvbnN9KS5waXBlKG8pfSksby5lbnRyaWVzQ291bnQ9aH1jYXRjaChlKXtvLmVycm9yKGUpfXJldHVybiBvfX0seyIuLi9jb21wcmVzc2lvbnMiOjMsIi4vWmlwRmlsZVdvcmtlciI6OH1dLDEwOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO2Z1bmN0aW9uIG4oKXtpZighKHRoaXMgaW5zdGFuY2VvZiBuKSlyZXR1cm4gbmV3IG47aWYoYXJndW1lbnRzLmxlbmd0aCl0aHJvdyBuZXcgRXJyb3IoIlRoZSBjb25zdHJ1Y3RvciB3aXRoIHBhcmFtZXRlcnMgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS4iKTt0aGlzLmZpbGVzPU9iamVjdC5jcmVhdGUobnVsbCksdGhpcy5jb21tZW50PW51bGwsdGhpcy5yb290PSIiLHRoaXMuY2xvbmU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbjtmb3IodmFyIHQgaW4gdGhpcykiZnVuY3Rpb24iIT10eXBlb2YgdGhpc1t0XSYmKGVbdF09dGhpc1t0XSk7cmV0dXJuIGV9fShuLnByb3RvdHlwZT1lKCIuL29iamVjdCIpKS5sb2FkQXN5bmM9ZSgiLi9sb2FkIiksbi5zdXBwb3J0PWUoIi4vc3VwcG9ydCIpLG4uZGVmYXVsdHM9ZSgiLi9kZWZhdWx0cyIpLG4udmVyc2lvbj0iMy4xMC4xIixuLmxvYWRBc3luYz1mdW5jdGlvbihlLHQpe3JldHVybihuZXcgbikubG9hZEFzeW5jKGUsdCl9LG4uZXh0ZXJuYWw9ZSgiLi9leHRlcm5hbCIpLHQuZXhwb3J0cz1ufSx7Ii4vZGVmYXVsdHMiOjUsIi4vZXh0ZXJuYWwiOjYsIi4vbG9hZCI6MTEsIi4vb2JqZWN0IjoxNSwiLi9zdXBwb3J0IjozMH1dLDExOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciB1PWUoIi4vdXRpbHMiKSxpPWUoIi4vZXh0ZXJuYWwiKSxuPWUoIi4vdXRmOCIpLHM9ZSgiLi96aXBFbnRyaWVzIiksYT1lKCIuL3N0cmVhbS9DcmMzMlByb2JlIiksbD1lKCIuL25vZGVqc1V0aWxzIik7ZnVuY3Rpb24gZihuKXtyZXR1cm4gbmV3IGkuUHJvbWlzZShmdW5jdGlvbihlLHQpe3ZhciByPW4uZGVjb21wcmVzc2VkLmdldENvbnRlbnRXb3JrZXIoKS5waXBlKG5ldyBhKTtyLm9uKCJlcnJvciIsZnVuY3Rpb24oZSl7dChlKX0pLm9uKCJlbmQiLGZ1bmN0aW9uKCl7ci5zdHJlYW1JbmZvLmNyYzMyIT09bi5kZWNvbXByZXNzZWQuY3JjMzI/dChuZXcgRXJyb3IoIkNvcnJ1cHRlZCB6aXAgOiBDUkMzMiBtaXNtYXRjaCIpKTplKCl9KS5yZXN1bWUoKX0pfXQuZXhwb3J0cz1mdW5jdGlvbihlLG8pe3ZhciBoPXRoaXM7cmV0dXJuIG89dS5leHRlbmQob3x8e30se2Jhc2U2NDohMSxjaGVja0NSQzMyOiExLG9wdGltaXplZEJpbmFyeVN0cmluZzohMSxjcmVhdGVGb2xkZXJzOiExLGRlY29kZUZpbGVOYW1lOm4udXRmOGRlY29kZX0pLGwuaXNOb2RlJiZsLmlzU3RyZWFtKGUpP2kuUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCJKU1ppcCBjYW4ndCBhY2NlcHQgYSBzdHJlYW0gd2hlbiBsb2FkaW5nIGEgemlwIGZpbGUuIikpOnUucHJlcGFyZUNvbnRlbnQoInRoZSBsb2FkZWQgemlwIGZpbGUiLGUsITAsby5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcsby5iYXNlNjQpLnRoZW4oZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IHMobyk7cmV0dXJuIHQubG9hZChlKSx0fSkudGhlbihmdW5jdGlvbihlKXt2YXIgdD1baS5Qcm9taXNlLnJlc29sdmUoZSldLHI9ZS5maWxlcztpZihvLmNoZWNrQ1JDMzIpZm9yKHZhciBuPTA7bjxyLmxlbmd0aDtuKyspdC5wdXNoKGYocltuXSkpO3JldHVybiBpLlByb21pc2UuYWxsKHQpfSkudGhlbihmdW5jdGlvbihlKXtmb3IodmFyIHQ9ZS5zaGlmdCgpLHI9dC5maWxlcyxuPTA7bjxyLmxlbmd0aDtuKyspe3ZhciBpPXJbbl0scz1pLmZpbGVOYW1lU3RyLGE9dS5yZXNvbHZlKGkuZmlsZU5hbWVTdHIpO2guZmlsZShhLGkuZGVjb21wcmVzc2VkLHtiaW5hcnk6ITAsb3B0aW1pemVkQmluYXJ5U3RyaW5nOiEwLGRhdGU6aS5kYXRlLGRpcjppLmRpcixjb21tZW50OmkuZmlsZUNvbW1lbnRTdHIubGVuZ3RoP2kuZmlsZUNvbW1lbnRTdHI6bnVsbCx1bml4UGVybWlzc2lvbnM6aS51bml4UGVybWlzc2lvbnMsZG9zUGVybWlzc2lvbnM6aS5kb3NQZXJtaXNzaW9ucyxjcmVhdGVGb2xkZXJzOm8uY3JlYXRlRm9sZGVyc30pLGkuZGlyfHwoaC5maWxlKGEpLnVuc2FmZU9yaWdpbmFsTmFtZT1zKX1yZXR1cm4gdC56aXBDb21tZW50Lmxlbmd0aCYmKGguY29tbWVudD10LnppcENvbW1lbnQpLGh9KX19LHsiLi9leHRlcm5hbCI6NiwiLi9ub2RlanNVdGlscyI6MTQsIi4vc3RyZWFtL0NyYzMyUHJvYmUiOjI1LCIuL3V0ZjgiOjMxLCIuL3V0aWxzIjozMiwiLi96aXBFbnRyaWVzIjozM31dLDEyOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4uL3V0aWxzIiksaT1lKCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlciIpO2Z1bmN0aW9uIHMoZSx0KXtpLmNhbGwodGhpcywiTm9kZWpzIHN0cmVhbSBpbnB1dCBhZGFwdGVyIGZvciAiK2UpLHRoaXMuX3Vwc3RyZWFtRW5kZWQ9ITEsdGhpcy5fYmluZFN0cmVhbSh0KX1uLmluaGVyaXRzKHMsaSkscy5wcm90b3R5cGUuX2JpbmRTdHJlYW09ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpczsodGhpcy5fc3RyZWFtPWUpLnBhdXNlKCksZS5vbigiZGF0YSIsZnVuY3Rpb24oZSl7dC5wdXNoKHtkYXRhOmUsbWV0YTp7cGVyY2VudDowfX0pfSkub24oImVycm9yIixmdW5jdGlvbihlKXt0LmlzUGF1c2VkP3RoaXMuZ2VuZXJhdGVkRXJyb3I9ZTp0LmVycm9yKGUpfSkub24oImVuZCIsZnVuY3Rpb24oKXt0LmlzUGF1c2VkP3QuX3Vwc3RyZWFtRW5kZWQ9ITA6dC5lbmQoKX0pfSxzLnByb3RvdHlwZS5wYXVzZT1mdW5jdGlvbigpe3JldHVybiEhaS5wcm90b3R5cGUucGF1c2UuY2FsbCh0aGlzKSYmKHRoaXMuX3N0cmVhbS5wYXVzZSgpLCEwKX0scy5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFpLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKHRoaXMuX3Vwc3RyZWFtRW5kZWQ/dGhpcy5lbmQoKTp0aGlzLl9zdHJlYW0ucmVzdW1lKCksITApfSx0LmV4cG9ydHM9c30seyIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlciI6MjgsIi4uL3V0aWxzIjozMn1dLDEzOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBpPWUoInJlYWRhYmxlLXN0cmVhbSIpLlJlYWRhYmxlO2Z1bmN0aW9uIG4oZSx0LHIpe2kuY2FsbCh0aGlzLHQpLHRoaXMuX2hlbHBlcj1lO3ZhciBuPXRoaXM7ZS5vbigiZGF0YSIsZnVuY3Rpb24oZSx0KXtuLnB1c2goZSl8fG4uX2hlbHBlci5wYXVzZSgpLHImJnIodCl9KS5vbigiZXJyb3IiLGZ1bmN0aW9uKGUpe24uZW1pdCgiZXJyb3IiLGUpfSkub24oImVuZCIsZnVuY3Rpb24oKXtuLnB1c2gobnVsbCl9KX1lKCIuLi91dGlscyIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUuX3JlYWQ9ZnVuY3Rpb24oKXt0aGlzLl9oZWxwZXIucmVzdW1lKCl9LHQuZXhwb3J0cz1ufSx7Ii4uL3V0aWxzIjozMiwicmVhZGFibGUtc3RyZWFtIjoxNn1dLDE0OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3QuZXhwb3J0cz17aXNOb2RlOiJ1bmRlZmluZWQiIT10eXBlb2YgQnVmZmVyLG5ld0J1ZmZlckZyb206ZnVuY3Rpb24oZSx0KXtpZihCdWZmZXIuZnJvbSYmQnVmZmVyLmZyb20hPT1VaW50OEFycmF5LmZyb20pcmV0dXJuIEJ1ZmZlci5mcm9tKGUsdCk7aWYoIm51bWJlciI9PXR5cGVvZiBlKXRocm93IG5ldyBFcnJvcignVGhlICJkYXRhIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlcicpO3JldHVybiBuZXcgQnVmZmVyKGUsdCl9LGFsbG9jQnVmZmVyOmZ1bmN0aW9uKGUpe2lmKEJ1ZmZlci5hbGxvYylyZXR1cm4gQnVmZmVyLmFsbG9jKGUpO3ZhciB0PW5ldyBCdWZmZXIoZSk7cmV0dXJuIHQuZmlsbCgwKSx0fSxpc0J1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGUpfSxpc1N0cmVhbTpmdW5jdGlvbihlKXtyZXR1cm4gZSYmImZ1bmN0aW9uIj09dHlwZW9mIGUub24mJiJmdW5jdGlvbiI9PXR5cGVvZiBlLnBhdXNlJiYiZnVuY3Rpb24iPT10eXBlb2YgZS5yZXN1bWV9fX0se31dLDE1OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO2Z1bmN0aW9uIHMoZSx0LHIpe3ZhciBuLGk9dS5nZXRUeXBlT2YodCkscz11LmV4dGVuZChyfHx7fSxmKTtzLmRhdGU9cy5kYXRlfHxuZXcgRGF0ZSxudWxsIT09cy5jb21wcmVzc2lvbiYmKHMuY29tcHJlc3Npb249cy5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpKSwic3RyaW5nIj09dHlwZW9mIHMudW5peFBlcm1pc3Npb25zJiYocy51bml4UGVybWlzc2lvbnM9cGFyc2VJbnQocy51bml4UGVybWlzc2lvbnMsOCkpLHMudW5peFBlcm1pc3Npb25zJiYxNjM4NCZzLnVuaXhQZXJtaXNzaW9ucyYmKHMuZGlyPSEwKSxzLmRvc1Blcm1pc3Npb25zJiYxNiZzLmRvc1Blcm1pc3Npb25zJiYocy5kaXI9ITApLHMuZGlyJiYoZT1nKGUpKSxzLmNyZWF0ZUZvbGRlcnMmJihuPV8oZSkpJiZiLmNhbGwodGhpcyxuLCEwKTt2YXIgYT0ic3RyaW5nIj09PWkmJiExPT09cy5iaW5hcnkmJiExPT09cy5iYXNlNjQ7ciYmdm9pZCAwIT09ci5iaW5hcnl8fChzLmJpbmFyeT0hYSksKHQgaW5zdGFuY2VvZiBjJiYwPT09dC51bmNvbXByZXNzZWRTaXplfHxzLmRpcnx8IXR8fDA9PT10Lmxlbmd0aCkmJihzLmJhc2U2ND0hMSxzLmJpbmFyeT0hMCx0PSIiLHMuY29tcHJlc3Npb249IlNUT1JFIixpPSJzdHJpbmciKTt2YXIgbz1udWxsO289dCBpbnN0YW5jZW9mIGN8fHQgaW5zdGFuY2VvZiBsP3Q6cC5pc05vZGUmJnAuaXNTdHJlYW0odCk/bmV3IG0oZSx0KTp1LnByZXBhcmVDb250ZW50KGUsdCxzLmJpbmFyeSxzLm9wdGltaXplZEJpbmFyeVN0cmluZyxzLmJhc2U2NCk7dmFyIGg9bmV3IGQoZSxvLHMpO3RoaXMuZmlsZXNbZV09aH12YXIgaT1lKCIuL3V0ZjgiKSx1PWUoIi4vdXRpbHMiKSxsPWUoIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXIiKSxhPWUoIi4vc3RyZWFtL1N0cmVhbUhlbHBlciIpLGY9ZSgiLi9kZWZhdWx0cyIpLGM9ZSgiLi9jb21wcmVzc2VkT2JqZWN0IiksZD1lKCIuL3ppcE9iamVjdCIpLG89ZSgiLi9nZW5lcmF0ZSIpLHA9ZSgiLi9ub2RlanNVdGlscyIpLG09ZSgiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyIiksXz1mdW5jdGlvbihlKXsiLyI9PT1lLnNsaWNlKC0xKSYmKGU9ZS5zdWJzdHJpbmcoMCxlLmxlbmd0aC0xKSk7dmFyIHQ9ZS5sYXN0SW5kZXhPZigiLyIpO3JldHVybiAwPHQ/ZS5zdWJzdHJpbmcoMCx0KToiIn0sZz1mdW5jdGlvbihlKXtyZXR1cm4iLyIhPT1lLnNsaWNlKC0xKSYmKGUrPSIvIiksZX0sYj1mdW5jdGlvbihlLHQpe3JldHVybiB0PXZvaWQgMCE9PXQ/dDpmLmNyZWF0ZUZvbGRlcnMsZT1nKGUpLHRoaXMuZmlsZXNbZV18fHMuY2FsbCh0aGlzLGUsbnVsbCx7ZGlyOiEwLGNyZWF0ZUZvbGRlcnM6dH0pLHRoaXMuZmlsZXNbZV19O2Z1bmN0aW9uIGgoZSl7cmV0dXJuIltvYmplY3QgUmVnRXhwXSI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSl9dmFyIG49e2xvYWQ6ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuIil9LGZvckVhY2g6ZnVuY3Rpb24oZSl7dmFyIHQscixuO2Zvcih0IGluIHRoaXMuZmlsZXMpbj10aGlzLmZpbGVzW3RdLChyPXQuc2xpY2UodGhpcy5yb290Lmxlbmd0aCx0Lmxlbmd0aCkpJiZ0LnNsaWNlKDAsdGhpcy5yb290Lmxlbmd0aCk9PT10aGlzLnJvb3QmJmUocixuKX0sZmlsdGVyOmZ1bmN0aW9uKHIpe3ZhciBuPVtdO3JldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24oZSx0KXtyKGUsdCkmJm4ucHVzaCh0KX0pLG59LGZpbGU6ZnVuY3Rpb24oZSx0LHIpe2lmKDEhPT1hcmd1bWVudHMubGVuZ3RoKXJldHVybiBlPXRoaXMucm9vdCtlLHMuY2FsbCh0aGlzLGUsdCxyKSx0aGlzO2lmKGgoZSkpe3ZhciBuPWU7cmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIXQuZGlyJiZuLnRlc3QoZSl9KX12YXIgaT10aGlzLmZpbGVzW3RoaXMucm9vdCtlXTtyZXR1cm4gaSYmIWkuZGlyP2k6bnVsbH0sZm9sZGVyOmZ1bmN0aW9uKHIpe2lmKCFyKXJldHVybiB0aGlzO2lmKGgocikpcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIHQuZGlyJiZyLnRlc3QoZSl9KTt2YXIgZT10aGlzLnJvb3Qrcix0PWIuY2FsbCh0aGlzLGUpLG49dGhpcy5jbG9uZSgpO3JldHVybiBuLnJvb3Q9dC5uYW1lLG59LHJlbW92ZTpmdW5jdGlvbihyKXtyPXRoaXMucm9vdCtyO3ZhciBlPXRoaXMuZmlsZXNbcl07aWYoZXx8KCIvIiE9PXIuc2xpY2UoLTEpJiYocis9Ii8iKSxlPXRoaXMuZmlsZXNbcl0pLGUmJiFlLmRpcilkZWxldGUgdGhpcy5maWxlc1tyXTtlbHNlIGZvcih2YXIgdD10aGlzLmZpbHRlcihmdW5jdGlvbihlLHQpe3JldHVybiB0Lm5hbWUuc2xpY2UoMCxyLmxlbmd0aCk9PT1yfSksbj0wO248dC5sZW5ndGg7bisrKWRlbGV0ZSB0aGlzLmZpbGVzW3Rbbl0ubmFtZV07cmV0dXJuIHRoaXN9LGdlbmVyYXRlOmZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLiIpfSxnZW5lcmF0ZUludGVybmFsU3RyZWFtOmZ1bmN0aW9uKGUpe3ZhciB0LHI9e307dHJ5e2lmKChyPXUuZXh0ZW5kKGV8fHt9LHtzdHJlYW1GaWxlczohMSxjb21wcmVzc2lvbjoiU1RPUkUiLGNvbXByZXNzaW9uT3B0aW9uczpudWxsLHR5cGU6IiIscGxhdGZvcm06IkRPUyIsY29tbWVudDpudWxsLG1pbWVUeXBlOiJhcHBsaWNhdGlvbi96aXAiLGVuY29kZUZpbGVOYW1lOmkudXRmOGVuY29kZX0pKS50eXBlPXIudHlwZS50b0xvd2VyQ2FzZSgpLHIuY29tcHJlc3Npb249ci5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpLCJiaW5hcnlzdHJpbmciPT09ci50eXBlJiYoci50eXBlPSJzdHJpbmciKSwhci50eXBlKXRocm93IG5ldyBFcnJvcigiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLiIpO3UuY2hlY2tTdXBwb3J0KHIudHlwZSksImRhcndpbiIhPT1yLnBsYXRmb3JtJiYiZnJlZWJzZCIhPT1yLnBsYXRmb3JtJiYibGludXgiIT09ci5wbGF0Zm9ybSYmInN1bm9zIiE9PXIucGxhdGZvcm18fChyLnBsYXRmb3JtPSJVTklYIiksIndpbjMyIj09PXIucGxhdGZvcm0mJihyLnBsYXRmb3JtPSJET1MiKTt2YXIgbj1yLmNvbW1lbnR8fHRoaXMuY29tbWVudHx8IiI7dD1vLmdlbmVyYXRlV29ya2VyKHRoaXMscixuKX1jYXRjaChlKXsodD1uZXcgbCgiZXJyb3IiKSkuZXJyb3IoZSl9cmV0dXJuIG5ldyBhKHQsci50eXBlfHwic3RyaW5nIixyLm1pbWVUeXBlKX0sZ2VuZXJhdGVBc3luYzpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLmdlbmVyYXRlSW50ZXJuYWxTdHJlYW0oZSkuYWNjdW11bGF0ZSh0KX0sZ2VuZXJhdGVOb2RlU3RyZWFtOmZ1bmN0aW9uKGUsdCl7cmV0dXJuKGU9ZXx8e30pLnR5cGV8fChlLnR5cGU9Im5vZGVidWZmZXIiKSx0aGlzLmdlbmVyYXRlSW50ZXJuYWxTdHJlYW0oZSkudG9Ob2RlanNTdHJlYW0odCl9fTt0LmV4cG9ydHM9bn0seyIuL2NvbXByZXNzZWRPYmplY3QiOjIsIi4vZGVmYXVsdHMiOjUsIi4vZ2VuZXJhdGUiOjksIi4vbm9kZWpzL05vZGVqc1N0cmVhbUlucHV0QWRhcHRlciI6MTIsIi4vbm9kZWpzVXRpbHMiOjE0LCIuL3N0cmVhbS9HZW5lcmljV29ya2VyIjoyOCwiLi9zdHJlYW0vU3RyZWFtSGVscGVyIjoyOSwiLi91dGY4IjozMSwiLi91dGlscyI6MzIsIi4vemlwT2JqZWN0IjozNX1dLDE2OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3QuZXhwb3J0cz1lKCJzdHJlYW0iKX0se3N0cmVhbTp2b2lkIDB9XSwxNzpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuL0RhdGFSZWFkZXIiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpO2Zvcih2YXIgdD0wO3Q8dGhpcy5kYXRhLmxlbmd0aDt0KyspZVt0XT0yNTUmZVt0XX1lKCIuLi91dGlscyIpLmluaGVyaXRzKGksbiksaS5wcm90b3R5cGUuYnl0ZUF0PWZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLmRhdGFbdGhpcy56ZXJvK2VdfSxpLnByb3RvdHlwZS5sYXN0SW5kZXhPZlNpZ25hdHVyZT1mdW5jdGlvbihlKXtmb3IodmFyIHQ9ZS5jaGFyQ29kZUF0KDApLHI9ZS5jaGFyQ29kZUF0KDEpLG49ZS5jaGFyQ29kZUF0KDIpLGk9ZS5jaGFyQ29kZUF0KDMpLHM9dGhpcy5sZW5ndGgtNDswPD1zOy0tcylpZih0aGlzLmRhdGFbc109PT10JiZ0aGlzLmRhdGFbcysxXT09PXImJnRoaXMuZGF0YVtzKzJdPT09biYmdGhpcy5kYXRhW3MrM109PT1pKXJldHVybiBzLXRoaXMuemVybztyZXR1cm4tMX0saS5wcm90b3R5cGUucmVhZEFuZENoZWNrU2lnbmF0dXJlPWZ1bmN0aW9uKGUpe3ZhciB0PWUuY2hhckNvZGVBdCgwKSxyPWUuY2hhckNvZGVBdCgxKSxuPWUuY2hhckNvZGVBdCgyKSxpPWUuY2hhckNvZGVBdCgzKSxzPXRoaXMucmVhZERhdGEoNCk7cmV0dXJuIHQ9PT1zWzBdJiZyPT09c1sxXSYmbj09PXNbMl0mJmk9PT1zWzNdfSxpLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbihlKXtpZih0aGlzLmNoZWNrT2Zmc2V0KGUpLDA9PT1lKXJldHVybltdO3ZhciB0PXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCtlKTtyZXR1cm4gdGhpcy5pbmRleCs9ZSx0fSx0LmV4cG9ydHM9aX0seyIuLi91dGlscyI6MzIsIi4vRGF0YVJlYWRlciI6MTh9XSwxODpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuLi91dGlscyIpO2Z1bmN0aW9uIGkoZSl7dGhpcy5kYXRhPWUsdGhpcy5sZW5ndGg9ZS5sZW5ndGgsdGhpcy5pbmRleD0wLHRoaXMuemVybz0wfWkucHJvdG90eXBlPXtjaGVja09mZnNldDpmdW5jdGlvbihlKXt0aGlzLmNoZWNrSW5kZXgodGhpcy5pbmRleCtlKX0sY2hlY2tJbmRleDpmdW5jdGlvbihlKXtpZih0aGlzLmxlbmd0aDx0aGlzLnplcm8rZXx8ZTwwKXRocm93IG5ldyBFcnJvcigiRW5kIG9mIGRhdGEgcmVhY2hlZCAoZGF0YSBsZW5ndGggPSAiK3RoaXMubGVuZ3RoKyIsIGFza2VkIGluZGV4ID0gIitlKyIpLiBDb3JydXB0ZWQgemlwID8iKX0sc2V0SW5kZXg6ZnVuY3Rpb24oZSl7dGhpcy5jaGVja0luZGV4KGUpLHRoaXMuaW5kZXg9ZX0sc2tpcDpmdW5jdGlvbihlKXt0aGlzLnNldEluZGV4KHRoaXMuaW5kZXgrZSl9LGJ5dGVBdDpmdW5jdGlvbigpe30scmVhZEludDpmdW5jdGlvbihlKXt2YXIgdCxyPTA7Zm9yKHRoaXMuY2hlY2tPZmZzZXQoZSksdD10aGlzLmluZGV4K2UtMTt0Pj10aGlzLmluZGV4O3QtLSlyPShyPDw4KSt0aGlzLmJ5dGVBdCh0KTtyZXR1cm4gdGhpcy5pbmRleCs9ZSxyfSxyZWFkU3RyaW5nOmZ1bmN0aW9uKGUpe3JldHVybiBuLnRyYW5zZm9ybVRvKCJzdHJpbmciLHRoaXMucmVhZERhdGEoZSkpfSxyZWFkRGF0YTpmdW5jdGlvbigpe30sbGFzdEluZGV4T2ZTaWduYXR1cmU6ZnVuY3Rpb24oKXt9LHJlYWRBbmRDaGVja1NpZ25hdHVyZTpmdW5jdGlvbigpe30scmVhZERhdGU6ZnVuY3Rpb24oKXt2YXIgZT10aGlzLnJlYWRJbnQoNCk7cmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKDE5ODArKGU+PjI1JjEyNyksKGU+PjIxJjE1KS0xLGU+PjE2JjMxLGU+PjExJjMxLGU+PjUmNjMsKDMxJmUpPDwxKSl9fSx0LmV4cG9ydHM9aX0seyIuLi91dGlscyI6MzJ9XSwxOTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuL1VpbnQ4QXJyYXlSZWFkZXIiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpfWUoIi4uL3V0aWxzIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbihlKXt0aGlzLmNoZWNrT2Zmc2V0KGUpO3ZhciB0PXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCtlKTtyZXR1cm4gdGhpcy5pbmRleCs9ZSx0fSx0LmV4cG9ydHM9aX0seyIuLi91dGlscyI6MzIsIi4vVWludDhBcnJheVJlYWRlciI6MjF9XSwyMDpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuL0RhdGFSZWFkZXIiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpfWUoIi4uL3V0aWxzIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMuemVybytlKX0saS5wcm90b3R5cGUubGFzdEluZGV4T2ZTaWduYXR1cmU9ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuZGF0YS5sYXN0SW5kZXhPZihlKS10aGlzLnplcm99LGkucHJvdG90eXBlLnJlYWRBbmRDaGVja1NpZ25hdHVyZT1mdW5jdGlvbihlKXtyZXR1cm4gZT09PXRoaXMucmVhZERhdGEoNCl9LGkucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKGUpe3RoaXMuY2hlY2tPZmZzZXQoZSk7dmFyIHQ9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K2UpO3JldHVybiB0aGlzLmluZGV4Kz1lLHR9LHQuZXhwb3J0cz1pfSx7Ii4uL3V0aWxzIjozMiwiLi9EYXRhUmVhZGVyIjoxOH1dLDIxOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vQXJyYXlSZWFkZXIiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpfWUoIi4uL3V0aWxzIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbihlKXtpZih0aGlzLmNoZWNrT2Zmc2V0KGUpLDA9PT1lKXJldHVybiBuZXcgVWludDhBcnJheSgwKTt2YXIgdD10aGlzLmRhdGEuc3ViYXJyYXkodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrZSk7cmV0dXJuIHRoaXMuaW5kZXgrPWUsdH0sdC5leHBvcnRzPWl9LHsiLi4vdXRpbHMiOjMyLCIuL0FycmF5UmVhZGVyIjoxN31dLDIyOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4uL3V0aWxzIiksaT1lKCIuLi9zdXBwb3J0Iikscz1lKCIuL0FycmF5UmVhZGVyIiksYT1lKCIuL1N0cmluZ1JlYWRlciIpLG89ZSgiLi9Ob2RlQnVmZmVyUmVhZGVyIiksaD1lKCIuL1VpbnQ4QXJyYXlSZWFkZXIiKTt0LmV4cG9ydHM9ZnVuY3Rpb24oZSl7dmFyIHQ9bi5nZXRUeXBlT2YoZSk7cmV0dXJuIG4uY2hlY2tTdXBwb3J0KHQpLCJzdHJpbmciIT09dHx8aS51aW50OGFycmF5PyJub2RlYnVmZmVyIj09PXQ/bmV3IG8oZSk6aS51aW50OGFycmF5P25ldyBoKG4udHJhbnNmb3JtVG8oInVpbnQ4YXJyYXkiLGUpKTpuZXcgcyhuLnRyYW5zZm9ybVRvKCJhcnJheSIsZSkpOm5ldyBhKGUpfX0seyIuLi9zdXBwb3J0IjozMCwiLi4vdXRpbHMiOjMyLCIuL0FycmF5UmVhZGVyIjoxNywiLi9Ob2RlQnVmZmVyUmVhZGVyIjoxOSwiLi9TdHJpbmdSZWFkZXIiOjIwLCIuL1VpbnQ4QXJyYXlSZWFkZXIiOjIxfV0sMjM6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7ci5MT0NBTF9GSUxFX0hFQURFUj0iUEsDBCIsci5DRU5UUkFMX0ZJTEVfSEVBREVSPSJQSwECIixyLkNFTlRSQUxfRElSRUNUT1JZX0VORD0iUEsFBiIsci5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SPSJQSwYHIixyLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORD0iUEsGBiIsci5EQVRBX0RFU0NSSVBUT1I9IlBLB1xiIn0se31dLDI0OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vR2VuZXJpY1dvcmtlciIpLGk9ZSgiLi4vdXRpbHMiKTtmdW5jdGlvbiBzKGUpe24uY2FsbCh0aGlzLCJDb252ZXJ0V29ya2VyIHRvICIrZSksdGhpcy5kZXN0VHlwZT1lfWkuaW5oZXJpdHMocyxuKSxzLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7dGhpcy5wdXNoKHtkYXRhOmkudHJhbnNmb3JtVG8odGhpcy5kZXN0VHlwZSxlLmRhdGEpLG1ldGE6ZS5tZXRhfSl9LHQuZXhwb3J0cz1zfSx7Ii4uL3V0aWxzIjozMiwiLi9HZW5lcmljV29ya2VyIjoyOH1dLDI1OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vR2VuZXJpY1dvcmtlciIpLGk9ZSgiLi4vY3JjMzIiKTtmdW5jdGlvbiBzKCl7bi5jYWxsKHRoaXMsIkNyYzMyUHJvYmUiKSx0aGlzLndpdGhTdHJlYW1JbmZvKCJjcmMzMiIsMCl9ZSgiLi4vdXRpbHMiKS5pbmhlcml0cyhzLG4pLHMucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbihlKXt0aGlzLnN0cmVhbUluZm8uY3JjMzI9aShlLmRhdGEsdGhpcy5zdHJlYW1JbmZvLmNyYzMyfHwwKSx0aGlzLnB1c2goZSl9LHQuZXhwb3J0cz1zfSx7Ii4uL2NyYzMyIjo0LCIuLi91dGlscyI6MzIsIi4vR2VuZXJpY1dvcmtlciI6Mjh9XSwyNjpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuLi91dGlscyIpLGk9ZSgiLi9HZW5lcmljV29ya2VyIik7ZnVuY3Rpb24gcyhlKXtpLmNhbGwodGhpcywiRGF0YUxlbmd0aFByb2JlIGZvciAiK2UpLHRoaXMucHJvcE5hbWU9ZSx0aGlzLndpdGhTdHJlYW1JbmZvKGUsMCl9bi5pbmhlcml0cyhzLGkpLHMucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbihlKXtpZihlKXt2YXIgdD10aGlzLnN0cmVhbUluZm9bdGhpcy5wcm9wTmFtZV18fDA7dGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdPXQrZS5kYXRhLmxlbmd0aH1pLnByb3RvdHlwZS5wcm9jZXNzQ2h1bmsuY2FsbCh0aGlzLGUpfSx0LmV4cG9ydHM9c30seyIuLi91dGlscyI6MzIsIi4vR2VuZXJpY1dvcmtlciI6Mjh9XSwyNzpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbj1lKCIuLi91dGlscyIpLGk9ZSgiLi9HZW5lcmljV29ya2VyIik7ZnVuY3Rpb24gcyhlKXtpLmNhbGwodGhpcywiRGF0YVdvcmtlciIpO3ZhciB0PXRoaXM7dGhpcy5kYXRhSXNSZWFkeT0hMSx0aGlzLmluZGV4PTAsdGhpcy5tYXg9MCx0aGlzLmRhdGE9bnVsbCx0aGlzLnR5cGU9IiIsdGhpcy5fdGlja1NjaGVkdWxlZD0hMSxlLnRoZW4oZnVuY3Rpb24oZSl7dC5kYXRhSXNSZWFkeT0hMCx0LmRhdGE9ZSx0Lm1heD1lJiZlLmxlbmd0aHx8MCx0LnR5cGU9bi5nZXRUeXBlT2YoZSksdC5pc1BhdXNlZHx8dC5fdGlja0FuZFJlcGVhdCgpfSxmdW5jdGlvbihlKXt0LmVycm9yKGUpfSl9bi5pbmhlcml0cyhzLGkpLHMucHJvdG90eXBlLmNsZWFuVXA9ZnVuY3Rpb24oKXtpLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyksdGhpcy5kYXRhPW51bGx9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhaS5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5fdGlja1NjaGVkdWxlZCYmdGhpcy5kYXRhSXNSZWFkeSYmKHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITAsbi5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpKSwhMCl9LHMucHJvdG90eXBlLl90aWNrQW5kUmVwZWF0PWZ1bmN0aW9uKCl7dGhpcy5fdGlja1NjaGVkdWxlZD0hMSx0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWR8fCh0aGlzLl90aWNrKCksdGhpcy5pc0ZpbmlzaGVkfHwobi5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpLHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITApKX0scy5wcm90b3R5cGUuX3RpY2s9ZnVuY3Rpb24oKXtpZih0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dmFyIGU9bnVsbCx0PU1hdGgubWluKHRoaXMubWF4LHRoaXMuaW5kZXgrMTYzODQpO2lmKHRoaXMuaW5kZXg+PXRoaXMubWF4KXJldHVybiB0aGlzLmVuZCgpO3N3aXRjaCh0aGlzLnR5cGUpe2Nhc2Uic3RyaW5nIjplPXRoaXMuZGF0YS5zdWJzdHJpbmcodGhpcy5pbmRleCx0KTticmVhaztjYXNlInVpbnQ4YXJyYXkiOmU9dGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuaW5kZXgsdCk7YnJlYWs7Y2FzZSJhcnJheSI6Y2FzZSJub2RlYnVmZmVyIjplPXRoaXMuZGF0YS5zbGljZSh0aGlzLmluZGV4LHQpfXJldHVybiB0aGlzLmluZGV4PXQsdGhpcy5wdXNoKHtkYXRhOmUsbWV0YTp7cGVyY2VudDp0aGlzLm1heD90aGlzLmluZGV4L3RoaXMubWF4KjEwMDowfX0pfSx0LmV4cG9ydHM9c30seyIuLi91dGlscyI6MzIsIi4vR2VuZXJpY1dvcmtlciI6Mjh9XSwyODpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0IjtmdW5jdGlvbiBuKGUpe3RoaXMubmFtZT1lfHwiZGVmYXVsdCIsdGhpcy5zdHJlYW1JbmZvPXt9LHRoaXMuZ2VuZXJhdGVkRXJyb3I9bnVsbCx0aGlzLmV4dHJhU3RyZWFtSW5mbz17fSx0aGlzLmlzUGF1c2VkPSEwLHRoaXMuaXNGaW5pc2hlZD0hMSx0aGlzLmlzTG9ja2VkPSExLHRoaXMuX2xpc3RlbmVycz17ZGF0YTpbXSxlbmQ6W10sZXJyb3I6W119LHRoaXMucHJldmlvdXM9bnVsbH1uLnByb3RvdHlwZT17cHVzaDpmdW5jdGlvbihlKXt0aGlzLmVtaXQoImRhdGEiLGUpfSxlbmQ6ZnVuY3Rpb24oKXtpZih0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dGhpcy5mbHVzaCgpO3RyeXt0aGlzLmVtaXQoImVuZCIpLHRoaXMuY2xlYW5VcCgpLHRoaXMuaXNGaW5pc2hlZD0hMH1jYXRjaChlKXt0aGlzLmVtaXQoImVycm9yIixlKX1yZXR1cm4hMH0sZXJyb3I6ZnVuY3Rpb24oZSl7cmV0dXJuIXRoaXMuaXNGaW5pc2hlZCYmKHRoaXMuaXNQYXVzZWQ/dGhpcy5nZW5lcmF0ZWRFcnJvcj1lOih0aGlzLmlzRmluaXNoZWQ9ITAsdGhpcy5lbWl0KCJlcnJvciIsZSksdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5lcnJvcihlKSx0aGlzLmNsZWFuVXAoKSksITApfSxvbjpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLl9saXN0ZW5lcnNbZV0ucHVzaCh0KSx0aGlzfSxjbGVhblVwOmZ1bmN0aW9uKCl7dGhpcy5zdHJlYW1JbmZvPXRoaXMuZ2VuZXJhdGVkRXJyb3I9dGhpcy5leHRyYVN0cmVhbUluZm89bnVsbCx0aGlzLl9saXN0ZW5lcnM9W119LGVtaXQ6ZnVuY3Rpb24oZSx0KXtpZih0aGlzLl9saXN0ZW5lcnNbZV0pZm9yKHZhciByPTA7cjx0aGlzLl9saXN0ZW5lcnNbZV0ubGVuZ3RoO3IrKyl0aGlzLl9saXN0ZW5lcnNbZV1bcl0uY2FsbCh0aGlzLHQpfSxwaXBlOmZ1bmN0aW9uKGUpe3JldHVybiBlLnJlZ2lzdGVyUHJldmlvdXModGhpcyl9LHJlZ2lzdGVyUHJldmlvdXM6ZnVuY3Rpb24oZSl7aWYodGhpcy5pc0xvY2tlZCl0aHJvdyBuZXcgRXJyb3IoIlRoZSBzdHJlYW0gJyIrdGhpcysiJyBoYXMgYWxyZWFkeSBiZWVuIHVzZWQuIik7dGhpcy5zdHJlYW1JbmZvPWUuc3RyZWFtSW5mbyx0aGlzLm1lcmdlU3RyZWFtSW5mbygpLHRoaXMucHJldmlvdXM9ZTt2YXIgdD10aGlzO3JldHVybiBlLm9uKCJkYXRhIixmdW5jdGlvbihlKXt0LnByb2Nlc3NDaHVuayhlKX0pLGUub24oImVuZCIsZnVuY3Rpb24oKXt0LmVuZCgpfSksZS5vbigiZXJyb3IiLGZ1bmN0aW9uKGUpe3QuZXJyb3IoZSl9KSx0aGlzfSxwYXVzZTpmdW5jdGlvbigpe3JldHVybiF0aGlzLmlzUGF1c2VkJiYhdGhpcy5pc0ZpbmlzaGVkJiYodGhpcy5pc1BhdXNlZD0hMCx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLnBhdXNlKCksITApfSxyZXN1bWU6ZnVuY3Rpb24oKXtpZighdGhpcy5pc1BhdXNlZHx8dGhpcy5pc0ZpbmlzaGVkKXJldHVybiExO3ZhciBlPXRoaXMuaXNQYXVzZWQ9ITE7cmV0dXJuIHRoaXMuZ2VuZXJhdGVkRXJyb3ImJih0aGlzLmVycm9yKHRoaXMuZ2VuZXJhdGVkRXJyb3IpLGU9ITApLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMucmVzdW1lKCksIWV9LGZsdXNoOmZ1bmN0aW9uKCl7fSxwcm9jZXNzQ2h1bms6ZnVuY3Rpb24oZSl7dGhpcy5wdXNoKGUpfSx3aXRoU3RyZWFtSW5mbzpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLmV4dHJhU3RyZWFtSW5mb1tlXT10LHRoaXMubWVyZ2VTdHJlYW1JbmZvKCksdGhpc30sbWVyZ2VTdHJlYW1JbmZvOmZ1bmN0aW9uKCl7Zm9yKHZhciBlIGluIHRoaXMuZXh0cmFTdHJlYW1JbmZvKU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmV4dHJhU3RyZWFtSW5mbyxlKSYmKHRoaXMuc3RyZWFtSW5mb1tlXT10aGlzLmV4dHJhU3RyZWFtSW5mb1tlXSl9LGxvY2s6ZnVuY3Rpb24oKXtpZih0aGlzLmlzTG9ja2VkKXRocm93IG5ldyBFcnJvcigiVGhlIHN0cmVhbSAnIit0aGlzKyInIGhhcyBhbHJlYWR5IGJlZW4gdXNlZC4iKTt0aGlzLmlzTG9ja2VkPSEwLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMubG9jaygpfSx0b1N0cmluZzpmdW5jdGlvbigpe3ZhciBlPSJXb3JrZXIgIit0aGlzLm5hbWU7cmV0dXJuIHRoaXMucHJldmlvdXM/dGhpcy5wcmV2aW91cysiIC0+ICIrZTplfX0sdC5leHBvcnRzPW59LHt9XSwyOTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgaD1lKCIuLi91dGlscyIpLGk9ZSgiLi9Db252ZXJ0V29ya2VyIikscz1lKCIuL0dlbmVyaWNXb3JrZXIiKSx1PWUoIi4uL2Jhc2U2NCIpLG49ZSgiLi4vc3VwcG9ydCIpLGE9ZSgiLi4vZXh0ZXJuYWwiKSxvPW51bGw7aWYobi5ub2Rlc3RyZWFtKXRyeXtvPWUoIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyIil9Y2F0Y2goZSl7fWZ1bmN0aW9uIGwoZSxvKXtyZXR1cm4gbmV3IGEuUHJvbWlzZShmdW5jdGlvbih0LHIpe3ZhciBuPVtdLGk9ZS5faW50ZXJuYWxUeXBlLHM9ZS5fb3V0cHV0VHlwZSxhPWUuX21pbWVUeXBlO2Uub24oImRhdGEiLGZ1bmN0aW9uKGUsdCl7bi5wdXNoKGUpLG8mJm8odCl9KS5vbigiZXJyb3IiLGZ1bmN0aW9uKGUpe249W10scihlKX0pLm9uKCJlbmQiLGZ1bmN0aW9uKCl7dHJ5e3ZhciBlPWZ1bmN0aW9uKGUsdCxyKXtzd2l0Y2goZSl7Y2FzZSJibG9iIjpyZXR1cm4gaC5uZXdCbG9iKGgudHJhbnNmb3JtVG8oImFycmF5YnVmZmVyIix0KSxyKTtjYXNlImJhc2U2NCI6cmV0dXJuIHUuZW5jb2RlKHQpO2RlZmF1bHQ6cmV0dXJuIGgudHJhbnNmb3JtVG8oZSx0KX19KHMsZnVuY3Rpb24oZSx0KXt2YXIgcixuPTAsaT1udWxsLHM9MDtmb3Iocj0wO3I8dC5sZW5ndGg7cisrKXMrPXRbcl0ubGVuZ3RoO3N3aXRjaChlKXtjYXNlInN0cmluZyI6cmV0dXJuIHQuam9pbigiIik7Y2FzZSJhcnJheSI6cmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sdCk7Y2FzZSJ1aW50OGFycmF5Ijpmb3IoaT1uZXcgVWludDhBcnJheShzKSxyPTA7cjx0Lmxlbmd0aDtyKyspaS5zZXQodFtyXSxuKSxuKz10W3JdLmxlbmd0aDtyZXR1cm4gaTtjYXNlIm5vZGVidWZmZXIiOnJldHVybiBCdWZmZXIuY29uY2F0KHQpO2RlZmF1bHQ6dGhyb3cgbmV3IEVycm9yKCJjb25jYXQgOiB1bnN1cHBvcnRlZCB0eXBlICciK2UrIiciKX19KGksbiksYSk7dChlKX1jYXRjaChlKXtyKGUpfW49W119KS5yZXN1bWUoKX0pfWZ1bmN0aW9uIGYoZSx0LHIpe3ZhciBuPXQ7c3dpdGNoKHQpe2Nhc2UiYmxvYiI6Y2FzZSJhcnJheWJ1ZmZlciI6bj0idWludDhhcnJheSI7YnJlYWs7Y2FzZSJiYXNlNjQiOm49InN0cmluZyJ9dHJ5e3RoaXMuX2ludGVybmFsVHlwZT1uLHRoaXMuX291dHB1dFR5cGU9dCx0aGlzLl9taW1lVHlwZT1yLGguY2hlY2tTdXBwb3J0KG4pLHRoaXMuX3dvcmtlcj1lLnBpcGUobmV3IGkobikpLGUubG9jaygpfWNhdGNoKGUpe3RoaXMuX3dvcmtlcj1uZXcgcygiZXJyb3IiKSx0aGlzLl93b3JrZXIuZXJyb3IoZSl9fWYucHJvdG90eXBlPXthY2N1bXVsYXRlOmZ1bmN0aW9uKGUpe3JldHVybiBsKHRoaXMsZSl9LG9uOmZ1bmN0aW9uKGUsdCl7dmFyIHI9dGhpcztyZXR1cm4iZGF0YSI9PT1lP3RoaXMuX3dvcmtlci5vbihlLGZ1bmN0aW9uKGUpe3QuY2FsbChyLGUuZGF0YSxlLm1ldGEpfSk6dGhpcy5fd29ya2VyLm9uKGUsZnVuY3Rpb24oKXtoLmRlbGF5KHQsYXJndW1lbnRzLHIpfSksdGhpc30scmVzdW1lOmZ1bmN0aW9uKCl7cmV0dXJuIGguZGVsYXkodGhpcy5fd29ya2VyLnJlc3VtZSxbXSx0aGlzLl93b3JrZXIpLHRoaXN9LHBhdXNlOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dvcmtlci5wYXVzZSgpLHRoaXN9LHRvTm9kZWpzU3RyZWFtOmZ1bmN0aW9uKGUpe2lmKGguY2hlY2tTdXBwb3J0KCJub2Rlc3RyZWFtIiksIm5vZGVidWZmZXIiIT09dGhpcy5fb3V0cHV0VHlwZSl0aHJvdyBuZXcgRXJyb3IodGhpcy5fb3V0cHV0VHlwZSsiIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBtZXRob2QiKTtyZXR1cm4gbmV3IG8odGhpcyx7b2JqZWN0TW9kZToibm9kZWJ1ZmZlciIhPT10aGlzLl9vdXRwdXRUeXBlfSxlKX19LHQuZXhwb3J0cz1mfSx7Ii4uL2Jhc2U2NCI6MSwiLi4vZXh0ZXJuYWwiOjYsIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyIjoxMywiLi4vc3VwcG9ydCI6MzAsIi4uL3V0aWxzIjozMiwiLi9Db252ZXJ0V29ya2VyIjoyNCwiLi9HZW5lcmljV29ya2VyIjoyOH1dLDMwOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO2lmKHIuYmFzZTY0PSEwLHIuYXJyYXk9ITAsci5zdHJpbmc9ITAsci5hcnJheWJ1ZmZlcj0idW5kZWZpbmVkIiE9dHlwZW9mIEFycmF5QnVmZmVyJiYidW5kZWZpbmVkIiE9dHlwZW9mIFVpbnQ4QXJyYXksci5ub2RlYnVmZmVyPSJ1bmRlZmluZWQiIT10eXBlb2YgQnVmZmVyLHIudWludDhhcnJheT0idW5kZWZpbmVkIiE9dHlwZW9mIFVpbnQ4QXJyYXksInVuZGVmaW5lZCI9PXR5cGVvZiBBcnJheUJ1ZmZlcilyLmJsb2I9ITE7ZWxzZXt2YXIgbj1uZXcgQXJyYXlCdWZmZXIoMCk7dHJ5e3IuYmxvYj0wPT09bmV3IEJsb2IoW25dLHt0eXBlOiJhcHBsaWNhdGlvbi96aXAifSkuc2l6ZX1jYXRjaChlKXt0cnl7dmFyIGk9bmV3KHNlbGYuQmxvYkJ1aWxkZXJ8fHNlbGYuV2ViS2l0QmxvYkJ1aWxkZXJ8fHNlbGYuTW96QmxvYkJ1aWxkZXJ8fHNlbGYuTVNCbG9iQnVpbGRlcik7aS5hcHBlbmQobiksci5ibG9iPTA9PT1pLmdldEJsb2IoImFwcGxpY2F0aW9uL3ppcCIpLnNpemV9Y2F0Y2goZSl7ci5ibG9iPSExfX19dHJ5e3Iubm9kZXN0cmVhbT0hIWUoInJlYWRhYmxlLXN0cmVhbSIpLlJlYWRhYmxlfWNhdGNoKGUpe3Iubm9kZXN0cmVhbT0hMX19LHsicmVhZGFibGUtc3RyZWFtIjoxNn1dLDMxOltmdW5jdGlvbihlLHQscyl7InVzZSBzdHJpY3QiO2Zvcih2YXIgbz1lKCIuL3V0aWxzIiksaD1lKCIuL3N1cHBvcnQiKSxyPWUoIi4vbm9kZWpzVXRpbHMiKSxuPWUoIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXIiKSx1PW5ldyBBcnJheSgyNTYpLGk9MDtpPDI1NjtpKyspdVtpXT0yNTI8PWk/NjoyNDg8PWk/NToyNDA8PWk/NDoyMjQ8PWk/MzoxOTI8PWk/MjoxO3VbMjU0XT11WzI1NF09MTtmdW5jdGlvbiBhKCl7bi5jYWxsKHRoaXMsInV0Zi04IGRlY29kZSIpLHRoaXMubGVmdE92ZXI9bnVsbH1mdW5jdGlvbiBsKCl7bi5jYWxsKHRoaXMsInV0Zi04IGVuY29kZSIpfXMudXRmOGVuY29kZT1mdW5jdGlvbihlKXtyZXR1cm4gaC5ub2RlYnVmZmVyP3IubmV3QnVmZmVyRnJvbShlLCJ1dGYtOCIpOmZ1bmN0aW9uKGUpe3ZhciB0LHIsbixpLHMsYT1lLmxlbmd0aCxvPTA7Zm9yKGk9MDtpPGE7aSsrKTU1Mjk2PT0oNjQ1MTImKHI9ZS5jaGFyQ29kZUF0KGkpKSkmJmkrMTxhJiY1NjMyMD09KDY0NTEyJihuPWUuY2hhckNvZGVBdChpKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKG4tNTYzMjApLGkrKyksbys9cjwxMjg/MTpyPDIwNDg/MjpyPDY1NTM2PzM6NDtmb3IodD1oLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkobyk6bmV3IEFycmF5KG8pLGk9cz0wO3M8bztpKyspNTUyOTY9PSg2NDUxMiYocj1lLmNoYXJDb2RlQXQoaSkpKSYmaSsxPGEmJjU2MzIwPT0oNjQ1MTImKG49ZS5jaGFyQ29kZUF0KGkrMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsobi01NjMyMCksaSsrKSxyPDEyOD90W3MrK109cjoocjwyMDQ4P3RbcysrXT0xOTJ8cj4+PjY6KHI8NjU1MzY/dFtzKytdPTIyNHxyPj4+MTI6KHRbcysrXT0yNDB8cj4+PjE4LHRbcysrXT0xMjh8cj4+PjEyJjYzKSx0W3MrK109MTI4fHI+Pj42JjYzKSx0W3MrK109MTI4fDYzJnIpO3JldHVybiB0fShlKX0scy51dGY4ZGVjb2RlPWZ1bmN0aW9uKGUpe3JldHVybiBoLm5vZGVidWZmZXI/by50cmFuc2Zvcm1Ubygibm9kZWJ1ZmZlciIsZSkudG9TdHJpbmcoInV0Zi04Iik6ZnVuY3Rpb24oZSl7dmFyIHQscixuLGkscz1lLmxlbmd0aCxhPW5ldyBBcnJheSgyKnMpO2Zvcih0PXI9MDt0PHM7KWlmKChuPWVbdCsrXSk8MTI4KWFbcisrXT1uO2Vsc2UgaWYoNDwoaT11W25dKSlhW3IrK109NjU1MzMsdCs9aS0xO2Vsc2V7Zm9yKG4mPTI9PT1pPzMxOjM9PT1pPzE1Ojc7MTxpJiZ0PHM7KW49bjw8Nnw2MyZlW3QrK10saS0tOzE8aT9hW3IrK109NjU1MzM6bjw2NTUzNj9hW3IrK109bjoobi09NjU1MzYsYVtyKytdPTU1Mjk2fG4+PjEwJjEwMjMsYVtyKytdPTU2MzIwfDEwMjMmbil9cmV0dXJuIGEubGVuZ3RoIT09ciYmKGEuc3ViYXJyYXk/YT1hLnN1YmFycmF5KDAscik6YS5sZW5ndGg9ciksby5hcHBseUZyb21DaGFyQ29kZShhKX0oZT1vLnRyYW5zZm9ybVRvKGgudWludDhhcnJheT8idWludDhhcnJheSI6ImFycmF5IixlKSl9LG8uaW5oZXJpdHMoYSxuKSxhLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7dmFyIHQ9by50cmFuc2Zvcm1UbyhoLnVpbnQ4YXJyYXk/InVpbnQ4YXJyYXkiOiJhcnJheSIsZS5kYXRhKTtpZih0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCl7aWYoaC51aW50OGFycmF5KXt2YXIgcj10Oyh0PW5ldyBVaW50OEFycmF5KHIubGVuZ3RoK3RoaXMubGVmdE92ZXIubGVuZ3RoKSkuc2V0KHRoaXMubGVmdE92ZXIsMCksdC5zZXQocix0aGlzLmxlZnRPdmVyLmxlbmd0aCl9ZWxzZSB0PXRoaXMubGVmdE92ZXIuY29uY2F0KHQpO3RoaXMubGVmdE92ZXI9bnVsbH12YXIgbj1mdW5jdGlvbihlLHQpe3ZhciByO2ZvcigodD10fHxlLmxlbmd0aCk+ZS5sZW5ndGgmJih0PWUubGVuZ3RoKSxyPXQtMTswPD1yJiYxMjg9PSgxOTImZVtyXSk7KXItLTtyZXR1cm4gcjwwP3Q6MD09PXI/dDpyK3VbZVtyXV0+dD9yOnR9KHQpLGk9dDtuIT09dC5sZW5ndGgmJihoLnVpbnQ4YXJyYXk/KGk9dC5zdWJhcnJheSgwLG4pLHRoaXMubGVmdE92ZXI9dC5zdWJhcnJheShuLHQubGVuZ3RoKSk6KGk9dC5zbGljZSgwLG4pLHRoaXMubGVmdE92ZXI9dC5zbGljZShuLHQubGVuZ3RoKSkpLHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUoaSksbWV0YTplLm1ldGF9KX0sYS5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXt0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCYmKHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUodGhpcy5sZWZ0T3ZlciksbWV0YTp7fX0pLHRoaXMubGVmdE92ZXI9bnVsbCl9LHMuVXRmOERlY29kZVdvcmtlcj1hLG8uaW5oZXJpdHMobCxuKSxsLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7dGhpcy5wdXNoKHtkYXRhOnMudXRmOGVuY29kZShlLmRhdGEpLG1ldGE6ZS5tZXRhfSl9LHMuVXRmOEVuY29kZVdvcmtlcj1sfSx7Ii4vbm9kZWpzVXRpbHMiOjE0LCIuL3N0cmVhbS9HZW5lcmljV29ya2VyIjoyOCwiLi9zdXBwb3J0IjozMCwiLi91dGlscyI6MzJ9XSwzMjpbZnVuY3Rpb24oZSx0LGEpeyJ1c2Ugc3RyaWN0Ijt2YXIgbz1lKCIuL3N1cHBvcnQiKSxoPWUoIi4vYmFzZTY0Iikscj1lKCIuL25vZGVqc1V0aWxzIiksdT1lKCIuL2V4dGVybmFsIik7ZnVuY3Rpb24gbihlKXtyZXR1cm4gZX1mdW5jdGlvbiBsKGUsdCl7Zm9yKHZhciByPTA7cjxlLmxlbmd0aDsrK3IpdFtyXT0yNTUmZS5jaGFyQ29kZUF0KHIpO3JldHVybiB0fWUoInNldGltbWVkaWF0ZSIpLGEubmV3QmxvYj1mdW5jdGlvbih0LHIpe2EuY2hlY2tTdXBwb3J0KCJibG9iIik7dHJ5e3JldHVybiBuZXcgQmxvYihbdF0se3R5cGU6cn0pfWNhdGNoKGUpe3RyeXt2YXIgbj1uZXcoc2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyKTtyZXR1cm4gbi5hcHBlbmQodCksbi5nZXRCbG9iKHIpfWNhdGNoKGUpe3Rocm93IG5ldyBFcnJvcigiQnVnIDogY2FuJ3QgY29uc3RydWN0IHRoZSBCbG9iLiIpfX19O3ZhciBpPXtzdHJpbmdpZnlCeUNodW5rOmZ1bmN0aW9uKGUsdCxyKXt2YXIgbj1bXSxpPTAscz1lLmxlbmd0aDtpZihzPD1yKXJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsZSk7Zm9yKDtpPHM7KSJhcnJheSI9PT10fHwibm9kZWJ1ZmZlciI9PT10P24ucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsZS5zbGljZShpLE1hdGgubWluKGkrcixzKSkpKTpuLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGUuc3ViYXJyYXkoaSxNYXRoLm1pbihpK3IscykpKSksaSs9cjtyZXR1cm4gbi5qb2luKCIiKX0sc3RyaW5naWZ5QnlDaGFyOmZ1bmN0aW9uKGUpe2Zvcih2YXIgdD0iIixyPTA7cjxlLmxlbmd0aDtyKyspdCs9U3RyaW5nLmZyb21DaGFyQ29kZShlW3JdKTtyZXR1cm4gdH0sYXBwbHlDYW5CZVVzZWQ6e3VpbnQ4YXJyYXk6ZnVuY3Rpb24oKXt0cnl7cmV0dXJuIG8udWludDhhcnJheSYmMT09PVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxuZXcgVWludDhBcnJheSgxKSkubGVuZ3RofWNhdGNoKGUpe3JldHVybiExfX0oKSxub2RlYnVmZmVyOmZ1bmN0aW9uKCl7dHJ5e3JldHVybiBvLm5vZGVidWZmZXImJjE9PT1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsci5hbGxvY0J1ZmZlcigxKSkubGVuZ3RofWNhdGNoKGUpe3JldHVybiExfX0oKX19O2Z1bmN0aW9uIHMoZSl7dmFyIHQ9NjU1MzYscj1hLmdldFR5cGVPZihlKSxuPSEwO2lmKCJ1aW50OGFycmF5Ij09PXI/bj1pLmFwcGx5Q2FuQmVVc2VkLnVpbnQ4YXJyYXk6Im5vZGVidWZmZXIiPT09ciYmKG49aS5hcHBseUNhbkJlVXNlZC5ub2RlYnVmZmVyKSxuKWZvcig7MTx0Oyl0cnl7cmV0dXJuIGkuc3RyaW5naWZ5QnlDaHVuayhlLHIsdCl9Y2F0Y2goZSl7dD1NYXRoLmZsb29yKHQvMil9cmV0dXJuIGkuc3RyaW5naWZ5QnlDaGFyKGUpfWZ1bmN0aW9uIGYoZSx0KXtmb3IodmFyIHI9MDtyPGUubGVuZ3RoO3IrKyl0W3JdPWVbcl07cmV0dXJuIHR9YS5hcHBseUZyb21DaGFyQ29kZT1zO3ZhciBjPXt9O2Muc3RyaW5nPXtzdHJpbmc6bixhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gbChlLG5ldyBBcnJheShlLmxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gYy5zdHJpbmcudWludDhhcnJheShlKS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGwoZSxuZXcgVWludDhBcnJheShlLmxlbmd0aCkpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiBsKGUsci5hbGxvY0J1ZmZlcihlLmxlbmd0aCkpfX0sYy5hcnJheT17c3RyaW5nOnMsYXJyYXk6bixhcnJheWJ1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoZSkuYnVmZmVyfSx1aW50OGFycmF5OmZ1bmN0aW9uKGUpe3JldHVybiBuZXcgVWludDhBcnJheShlKX0sbm9kZWJ1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gci5uZXdCdWZmZXJGcm9tKGUpfX0sYy5hcnJheWJ1ZmZlcj17c3RyaW5nOmZ1bmN0aW9uKGUpe3JldHVybiBzKG5ldyBVaW50OEFycmF5KGUpKX0sYXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGYobmV3IFVpbnQ4QXJyYXkoZSksbmV3IEFycmF5KGUuYnl0ZUxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpuLHVpbnQ4YXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIG5ldyBVaW50OEFycmF5KGUpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiByLm5ld0J1ZmZlckZyb20obmV3IFVpbnQ4QXJyYXkoZSkpfX0sYy51aW50OGFycmF5PXtzdHJpbmc6cyxhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gZihlLG5ldyBBcnJheShlLmxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gZS5idWZmZXJ9LHVpbnQ4YXJyYXk6bixub2RlYnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiByLm5ld0J1ZmZlckZyb20oZSl9fSxjLm5vZGVidWZmZXI9e3N0cmluZzpzLGFycmF5OmZ1bmN0aW9uKGUpe3JldHVybiBmKGUsbmV3IEFycmF5KGUubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiBjLm5vZGVidWZmZXIudWludDhhcnJheShlKS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGYoZSxuZXcgVWludDhBcnJheShlLmxlbmd0aCkpfSxub2RlYnVmZmVyOm59LGEudHJhbnNmb3JtVG89ZnVuY3Rpb24oZSx0KXtpZih0PXR8fCIiLCFlKXJldHVybiB0O2EuY2hlY2tTdXBwb3J0KGUpO3ZhciByPWEuZ2V0VHlwZU9mKHQpO3JldHVybiBjW3JdW2VdKHQpfSxhLnJlc29sdmU9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PWUuc3BsaXQoIi8iKSxyPVtdLG49MDtuPHQubGVuZ3RoO24rKyl7dmFyIGk9dFtuXTsiLiI9PT1pfHwiIj09PWkmJjAhPT1uJiZuIT09dC5sZW5ndGgtMXx8KCIuLiI9PT1pP3IucG9wKCk6ci5wdXNoKGkpKX1yZXR1cm4gci5qb2luKCIvIil9LGEuZ2V0VHlwZU9mPWZ1bmN0aW9uKGUpe3JldHVybiJzdHJpbmciPT10eXBlb2YgZT8ic3RyaW5nIjoiW29iamVjdCBBcnJheV0iPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGUpPyJhcnJheSI6by5ub2RlYnVmZmVyJiZyLmlzQnVmZmVyKGUpPyJub2RlYnVmZmVyIjpvLnVpbnQ4YXJyYXkmJmUgaW5zdGFuY2VvZiBVaW50OEFycmF5PyJ1aW50OGFycmF5IjpvLmFycmF5YnVmZmVyJiZlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI/ImFycmF5YnVmZmVyIjp2b2lkIDB9LGEuY2hlY2tTdXBwb3J0PWZ1bmN0aW9uKGUpe2lmKCFvW2UudG9Mb3dlckNhc2UoKV0pdGhyb3cgbmV3IEVycm9yKGUrIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgcGxhdGZvcm0iKX0sYS5NQVhfVkFMVUVfMTZCSVRTPTY1NTM1LGEuTUFYX1ZBTFVFXzMyQklUUz0tMSxhLnByZXR0eT1mdW5jdGlvbihlKXt2YXIgdCxyLG49IiI7Zm9yKHI9MDtyPChlfHwiIikubGVuZ3RoO3IrKyluKz0iXFx4IisoKHQ9ZS5jaGFyQ29kZUF0KHIpKTwxNj8iMCI6IiIpK3QudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7cmV0dXJuIG59LGEuZGVsYXk9ZnVuY3Rpb24oZSx0LHIpe3NldEltbWVkaWF0ZShmdW5jdGlvbigpe2UuYXBwbHkocnx8bnVsbCx0fHxbXSl9KX0sYS5pbmhlcml0cz1mdW5jdGlvbihlLHQpe2Z1bmN0aW9uIHIoKXt9ci5wcm90b3R5cGU9dC5wcm90b3R5cGUsZS5wcm90b3R5cGU9bmV3IHJ9LGEuZXh0ZW5kPWZ1bmN0aW9uKCl7dmFyIGUsdCxyPXt9O2ZvcihlPTA7ZTxhcmd1bWVudHMubGVuZ3RoO2UrKylmb3IodCBpbiBhcmd1bWVudHNbZV0pT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFyZ3VtZW50c1tlXSx0KSYmdm9pZCAwPT09clt0XSYmKHJbdF09YXJndW1lbnRzW2VdW3RdKTtyZXR1cm4gcn0sYS5wcmVwYXJlQ29udGVudD1mdW5jdGlvbihyLGUsbixpLHMpe3JldHVybiB1LlByb21pc2UucmVzb2x2ZShlKS50aGVuKGZ1bmN0aW9uKG4pe3JldHVybiBvLmJsb2ImJihuIGluc3RhbmNlb2YgQmxvYnx8LTEhPT1bIltvYmplY3QgRmlsZV0iLCJbb2JqZWN0IEJsb2JdIl0uaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobikpKSYmInVuZGVmaW5lZCIhPXR5cGVvZiBGaWxlUmVhZGVyP25ldyB1LlByb21pc2UoZnVuY3Rpb24odCxyKXt2YXIgZT1uZXcgRmlsZVJlYWRlcjtlLm9ubG9hZD1mdW5jdGlvbihlKXt0KGUudGFyZ2V0LnJlc3VsdCl9LGUub25lcnJvcj1mdW5jdGlvbihlKXtyKGUudGFyZ2V0LmVycm9yKX0sZS5yZWFkQXNBcnJheUJ1ZmZlcihuKX0pOm59KS50aGVuKGZ1bmN0aW9uKGUpe3ZhciB0PWEuZ2V0VHlwZU9mKGUpO3JldHVybiB0PygiYXJyYXlidWZmZXIiPT09dD9lPWEudHJhbnNmb3JtVG8oInVpbnQ4YXJyYXkiLGUpOiJzdHJpbmciPT09dCYmKHM/ZT1oLmRlY29kZShlKTpuJiYhMCE9PWkmJihlPWZ1bmN0aW9uKGUpe3JldHVybiBsKGUsby51aW50OGFycmF5P25ldyBVaW50OEFycmF5KGUubGVuZ3RoKTpuZXcgQXJyYXkoZS5sZW5ndGgpKX0oZSkpKSxlKTp1LlByb21pc2UucmVqZWN0KG5ldyBFcnJvcigiQ2FuJ3QgcmVhZCB0aGUgZGF0YSBvZiAnIityKyInLiBJcyBpdCBpbiBhIHN1cHBvcnRlZCBKYXZhU2NyaXB0IHR5cGUgKFN0cmluZywgQmxvYiwgQXJyYXlCdWZmZXIsIGV0YykgPyIpKX0pfX0seyIuL2Jhc2U2NCI6MSwiLi9leHRlcm5hbCI6NiwiLi9ub2RlanNVdGlscyI6MTQsIi4vc3VwcG9ydCI6MzAsc2V0aW1tZWRpYXRlOjU0fV0sMzM6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dmFyIG49ZSgiLi9yZWFkZXIvcmVhZGVyRm9yIiksaT1lKCIuL3V0aWxzIikscz1lKCIuL3NpZ25hdHVyZSIpLGE9ZSgiLi96aXBFbnRyeSIpLG89ZSgiLi9zdXBwb3J0Iik7ZnVuY3Rpb24gaChlKXt0aGlzLmZpbGVzPVtdLHRoaXMubG9hZE9wdGlvbnM9ZX1oLnByb3RvdHlwZT17Y2hlY2tTaWduYXR1cmU6ZnVuY3Rpb24oZSl7aWYoIXRoaXMucmVhZGVyLnJlYWRBbmRDaGVja1NpZ25hdHVyZShlKSl7dGhpcy5yZWFkZXIuaW5kZXgtPTQ7dmFyIHQ9dGhpcy5yZWFkZXIucmVhZFN0cmluZyg0KTt0aHJvdyBuZXcgRXJyb3IoIkNvcnJ1cHRlZCB6aXAgb3IgYnVnOiB1bmV4cGVjdGVkIHNpZ25hdHVyZSAoIitpLnByZXR0eSh0KSsiLCBleHBlY3RlZCAiK2kucHJldHR5KGUpKyIpIil9fSxpc1NpZ25hdHVyZTpmdW5jdGlvbihlLHQpe3ZhciByPXRoaXMucmVhZGVyLmluZGV4O3RoaXMucmVhZGVyLnNldEluZGV4KGUpO3ZhciBuPXRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk9PT10O3JldHVybiB0aGlzLnJlYWRlci5zZXRJbmRleChyKSxufSxyZWFkQmxvY2tFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt0aGlzLmRpc2tOdW1iZXI9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0PXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyUmVjb3Jkc09uVGhpc0Rpc2s9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyU2l6ZT10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuY2VudHJhbERpck9mZnNldD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuemlwQ29tbWVudExlbmd0aD10aGlzLnJlYWRlci5yZWFkSW50KDIpO3ZhciBlPXRoaXMucmVhZGVyLnJlYWREYXRhKHRoaXMuemlwQ29tbWVudExlbmd0aCksdD1vLnVpbnQ4YXJyYXk/InVpbnQ4YXJyYXkiOiJhcnJheSIscj1pLnRyYW5zZm9ybVRvKHQsZSk7dGhpcy56aXBDb21tZW50PXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUocil9LHJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemU9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLnJlYWRlci5za2lwKDQpLHRoaXMuZGlza051bWJlcj10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpclJlY29yZHM9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyT2Zmc2V0PXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy56aXA2NEV4dGVuc2libGVEYXRhPXt9O2Zvcih2YXIgZSx0LHIsbj10aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZS00NDswPG47KWU9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCkscj10aGlzLnJlYWRlci5yZWFkRGF0YSh0KSx0aGlzLnppcDY0RXh0ZW5zaWJsZURhdGFbZV09e2lkOmUsbGVuZ3RoOnQsdmFsdWU6cn19LHJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsTG9jYXRvcjpmdW5jdGlvbigpe2lmKHRoaXMuZGlza1dpdGhaaXA2NENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcj10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuZGlza3NDb3VudD10aGlzLnJlYWRlci5yZWFkSW50KDQpLDE8dGhpcy5kaXNrc0NvdW50KXRocm93IG5ldyBFcnJvcigiTXVsdGktdm9sdW1lcyB6aXAgYXJlIG5vdCBzdXBwb3J0ZWQiKX0scmVhZExvY2FsRmlsZXM6ZnVuY3Rpb24oKXt2YXIgZSx0O2ZvcihlPTA7ZTx0aGlzLmZpbGVzLmxlbmd0aDtlKyspdD10aGlzLmZpbGVzW2VdLHRoaXMucmVhZGVyLnNldEluZGV4KHQubG9jYWxIZWFkZXJPZmZzZXQpLHRoaXMuY2hlY2tTaWduYXR1cmUocy5MT0NBTF9GSUxFX0hFQURFUiksdC5yZWFkTG9jYWxQYXJ0KHRoaXMucmVhZGVyKSx0LmhhbmRsZVVURjgoKSx0LnByb2Nlc3NBdHRyaWJ1dGVzKCl9LHJlYWRDZW50cmFsRGlyOmZ1bmN0aW9uKCl7dmFyIGU7Zm9yKHRoaXMucmVhZGVyLnNldEluZGV4KHRoaXMuY2VudHJhbERpck9mZnNldCk7dGhpcy5yZWFkZXIucmVhZEFuZENoZWNrU2lnbmF0dXJlKHMuQ0VOVFJBTF9GSUxFX0hFQURFUik7KShlPW5ldyBhKHt6aXA2NDp0aGlzLnppcDY0fSx0aGlzLmxvYWRPcHRpb25zKSkucmVhZENlbnRyYWxQYXJ0KHRoaXMucmVhZGVyKSx0aGlzLmZpbGVzLnB1c2goZSk7aWYodGhpcy5jZW50cmFsRGlyUmVjb3JkcyE9PXRoaXMuZmlsZXMubGVuZ3RoJiYwIT09dGhpcy5jZW50cmFsRGlyUmVjb3JkcyYmMD09PXRoaXMuZmlsZXMubGVuZ3RoKXRocm93IG5ldyBFcnJvcigiQ29ycnVwdGVkIHppcCBvciBidWc6IGV4cGVjdGVkICIrdGhpcy5jZW50cmFsRGlyUmVjb3JkcysiIHJlY29yZHMgaW4gY2VudHJhbCBkaXIsIGdvdCAiK3RoaXMuZmlsZXMubGVuZ3RoKX0scmVhZEVuZE9mQ2VudHJhbDpmdW5jdGlvbigpe3ZhciBlPXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHMuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKTtpZihlPDApdGhyb3chdGhpcy5pc1NpZ25hdHVyZSgwLHMuTE9DQUxfRklMRV9IRUFERVIpP25ldyBFcnJvcigiQ2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgOiBpcyB0aGlzIGEgemlwIGZpbGUgPyBJZiBpdCBpcywgc2VlIGh0dHBzOi8vc3R1ay5naXRodWIuaW8vanN6aXAvZG9jdW1lbnRhdGlvbi9ob3d0by9yZWFkX3ppcC5odG1sIik6bmV3IEVycm9yKCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSIpO3RoaXMucmVhZGVyLnNldEluZGV4KGUpO3ZhciB0PWU7aWYodGhpcy5jaGVja1NpZ25hdHVyZShzLkNFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2tFbmRPZkNlbnRyYWwoKSx0aGlzLmRpc2tOdW1iZXI9PT1pLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9PT1pLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPT09aS5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPT09aS5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJTaXplPT09aS5NQVhfVkFMVUVfMzJCSVRTfHx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9PT1pLk1BWF9WQUxVRV8zMkJJVFMpe2lmKHRoaXMuemlwNjQ9ITAsKGU9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SKSk8MCl0aHJvdyBuZXcgRXJyb3IoIkNvcnJ1cHRlZCB6aXA6IGNhbid0IGZpbmQgdGhlIFpJUDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSBsb2NhdG9yIik7aWYodGhpcy5yZWFkZXIuc2V0SW5kZXgoZSksdGhpcy5jaGVja1NpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1IpLHRoaXMucmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yKCksIXRoaXMuaXNTaWduYXR1cmUodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyLHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSYmKHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcj10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPDApKXRocm93IG5ldyBFcnJvcigiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5Iik7dGhpcy5yZWFkZXIuc2V0SW5kZXgodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyKSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsKCl9dmFyIHI9dGhpcy5jZW50cmFsRGlyT2Zmc2V0K3RoaXMuY2VudHJhbERpclNpemU7dGhpcy56aXA2NCYmKHIrPTIwLHIrPTEyK3RoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplKTt2YXIgbj10LXI7aWYoMDxuKXRoaXMuaXNTaWduYXR1cmUodCxzLkNFTlRSQUxfRklMRV9IRUFERVIpfHwodGhpcy5yZWFkZXIuemVybz1uKTtlbHNlIGlmKG48MCl0aHJvdyBuZXcgRXJyb3IoIkNvcnJ1cHRlZCB6aXA6IG1pc3NpbmcgIitNYXRoLmFicyhuKSsiIGJ5dGVzLiIpfSxwcmVwYXJlUmVhZGVyOmZ1bmN0aW9uKGUpe3RoaXMucmVhZGVyPW4oZSl9LGxvYWQ6ZnVuY3Rpb24oZSl7dGhpcy5wcmVwYXJlUmVhZGVyKGUpLHRoaXMucmVhZEVuZE9mQ2VudHJhbCgpLHRoaXMucmVhZENlbnRyYWxEaXIoKSx0aGlzLnJlYWRMb2NhbEZpbGVzKCl9fSx0LmV4cG9ydHM9aH0seyIuL3JlYWRlci9yZWFkZXJGb3IiOjIyLCIuL3NpZ25hdHVyZSI6MjMsIi4vc3VwcG9ydCI6MzAsIi4vdXRpbHMiOjMyLCIuL3ppcEVudHJ5IjozNH1dLDM0OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPWUoIi4vcmVhZGVyL3JlYWRlckZvciIpLHM9ZSgiLi91dGlscyIpLGk9ZSgiLi9jb21wcmVzc2VkT2JqZWN0IiksYT1lKCIuL2NyYzMyIiksbz1lKCIuL3V0ZjgiKSxoPWUoIi4vY29tcHJlc3Npb25zIiksdT1lKCIuL3N1cHBvcnQiKTtmdW5jdGlvbiBsKGUsdCl7dGhpcy5vcHRpb25zPWUsdGhpcy5sb2FkT3B0aW9ucz10fWwucHJvdG90eXBlPXtpc0VuY3J5cHRlZDpmdW5jdGlvbigpe3JldHVybiAxPT0oMSZ0aGlzLmJpdEZsYWcpfSx1c2VVVEY4OmZ1bmN0aW9uKCl7cmV0dXJuIDIwNDg9PSgyMDQ4JnRoaXMuYml0RmxhZyl9LHJlYWRMb2NhbFBhcnQ6ZnVuY3Rpb24oZSl7dmFyIHQscjtpZihlLnNraXAoMjIpLHRoaXMuZmlsZU5hbWVMZW5ndGg9ZS5yZWFkSW50KDIpLHI9ZS5yZWFkSW50KDIpLHRoaXMuZmlsZU5hbWU9ZS5yZWFkRGF0YSh0aGlzLmZpbGVOYW1lTGVuZ3RoKSxlLnNraXAociksLTE9PT10aGlzLmNvbXByZXNzZWRTaXplfHwtMT09PXRoaXMudW5jb21wcmVzc2VkU2l6ZSl0aHJvdyBuZXcgRXJyb3IoIkJ1ZyBvciBjb3JydXB0ZWQgemlwIDogZGlkbid0IGdldCBlbm91Z2ggaW5mb3JtYXRpb24gZnJvbSB0aGUgY2VudHJhbCBkaXJlY3RvcnkgKGNvbXByZXNzZWRTaXplID09PSAtMSB8fCB1bmNvbXByZXNzZWRTaXplID09PSAtMSkiKTtpZihudWxsPT09KHQ9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0IGluIGgpaWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGgsdCkmJmhbdF0ubWFnaWM9PT1lKXJldHVybiBoW3RdO3JldHVybiBudWxsfSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKSkpdGhyb3cgbmV3IEVycm9yKCJDb3JydXB0ZWQgemlwIDogY29tcHJlc3Npb24gIitzLnByZXR0eSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKSsiIHVua25vd24gKGlubmVyIGZpbGUgOiAiK3MudHJhbnNmb3JtVG8oInN0cmluZyIsdGhpcy5maWxlTmFtZSkrIikiKTt0aGlzLmRlY29tcHJlc3NlZD1uZXcgaSh0aGlzLmNvbXByZXNzZWRTaXplLHRoaXMudW5jb21wcmVzc2VkU2l6ZSx0aGlzLmNyYzMyLHQsZS5yZWFkRGF0YSh0aGlzLmNvbXByZXNzZWRTaXplKSl9LHJlYWRDZW50cmFsUGFydDpmdW5jdGlvbihlKXt0aGlzLnZlcnNpb25NYWRlQnk9ZS5yZWFkSW50KDIpLGUuc2tpcCgyKSx0aGlzLmJpdEZsYWc9ZS5yZWFkSW50KDIpLHRoaXMuY29tcHJlc3Npb25NZXRob2Q9ZS5yZWFkU3RyaW5nKDIpLHRoaXMuZGF0ZT1lLnJlYWREYXRlKCksdGhpcy5jcmMzMj1lLnJlYWRJbnQoNCksdGhpcy5jb21wcmVzc2VkU2l6ZT1lLnJlYWRJbnQoNCksdGhpcy51bmNvbXByZXNzZWRTaXplPWUucmVhZEludCg0KTt2YXIgdD1lLnJlYWRJbnQoMik7aWYodGhpcy5leHRyYUZpZWxkc0xlbmd0aD1lLnJlYWRJbnQoMiksdGhpcy5maWxlQ29tbWVudExlbmd0aD1lLnJlYWRJbnQoMiksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9ZS5yZWFkSW50KDIpLHRoaXMuaW50ZXJuYWxGaWxlQXR0cmlidXRlcz1lLnJlYWRJbnQoMiksdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPWUucmVhZEludCg0KSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PWUucmVhZEludCg0KSx0aGlzLmlzRW5jcnlwdGVkKCkpdGhyb3cgbmV3IEVycm9yKCJFbmNyeXB0ZWQgemlwIGFyZSBub3Qgc3VwcG9ydGVkIik7ZS5za2lwKHQpLHRoaXMucmVhZEV4dHJhRmllbGRzKGUpLHRoaXMucGFyc2VaSVA2NEV4dHJhRmllbGQoZSksdGhpcy5maWxlQ29tbWVudD1lLnJlYWREYXRhKHRoaXMuZmlsZUNvbW1lbnRMZW5ndGgpfSxwcm9jZXNzQXR0cmlidXRlczpmdW5jdGlvbigpe3RoaXMudW5peFBlcm1pc3Npb25zPW51bGwsdGhpcy5kb3NQZXJtaXNzaW9ucz1udWxsO3ZhciBlPXRoaXMudmVyc2lvbk1hZGVCeT4+ODt0aGlzLmRpcj0hISgxNiZ0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMpLDA9PWUmJih0aGlzLmRvc1Blcm1pc3Npb25zPTYzJnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksMz09ZSYmKHRoaXMudW5peFBlcm1pc3Npb25zPXRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcz4+MTYmNjU1MzUpLHRoaXMuZGlyfHwiLyIhPT10aGlzLmZpbGVOYW1lU3RyLnNsaWNlKC0xKXx8KHRoaXMuZGlyPSEwKX0scGFyc2VaSVA2NEV4dHJhRmllbGQ6ZnVuY3Rpb24oKXtpZih0aGlzLmV4dHJhRmllbGRzWzFdKXt2YXIgZT1uKHRoaXMuZXh0cmFGaWVsZHNbMV0udmFsdWUpO3RoaXMudW5jb21wcmVzc2VkU2l6ZT09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMudW5jb21wcmVzc2VkU2l6ZT1lLnJlYWRJbnQoOCkpLHRoaXMuY29tcHJlc3NlZFNpemU9PT1zLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmNvbXByZXNzZWRTaXplPWUucmVhZEludCg4KSksdGhpcy5sb2NhbEhlYWRlck9mZnNldD09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMubG9jYWxIZWFkZXJPZmZzZXQ9ZS5yZWFkSW50KDgpKSx0aGlzLmRpc2tOdW1iZXJTdGFydD09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMuZGlza051bWJlclN0YXJ0PWUucmVhZEludCg0KSl9fSxyZWFkRXh0cmFGaWVsZHM6ZnVuY3Rpb24oZSl7dmFyIHQscixuLGk9ZS5pbmRleCt0aGlzLmV4dHJhRmllbGRzTGVuZ3RoO2Zvcih0aGlzLmV4dHJhRmllbGRzfHwodGhpcy5leHRyYUZpZWxkcz17fSk7ZS5pbmRleCs0PGk7KXQ9ZS5yZWFkSW50KDIpLHI9ZS5yZWFkSW50KDIpLG49ZS5yZWFkRGF0YShyKSx0aGlzLmV4dHJhRmllbGRzW3RdPXtpZDp0LGxlbmd0aDpyLHZhbHVlOm59O2Uuc2V0SW5kZXgoaSl9LGhhbmRsZVVURjg6ZnVuY3Rpb24oKXt2YXIgZT11LnVpbnQ4YXJyYXk/InVpbnQ4YXJyYXkiOiJhcnJheSI7aWYodGhpcy51c2VVVEY4KCkpdGhpcy5maWxlTmFtZVN0cj1vLnV0ZjhkZWNvZGUodGhpcy5maWxlTmFtZSksdGhpcy5maWxlQ29tbWVudFN0cj1vLnV0ZjhkZWNvZGUodGhpcy5maWxlQ29tbWVudCk7ZWxzZXt2YXIgdD10aGlzLmZpbmRFeHRyYUZpZWxkVW5pY29kZVBhdGgoKTtpZihudWxsIT09dCl0aGlzLmZpbGVOYW1lU3RyPXQ7ZWxzZXt2YXIgcj1zLnRyYW5zZm9ybVRvKGUsdGhpcy5maWxlTmFtZSk7dGhpcy5maWxlTmFtZVN0cj10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKHIpfXZhciBuPXRoaXMuZmluZEV4dHJhRmllbGRVbmljb2RlQ29tbWVudCgpO2lmKG51bGwhPT1uKXRoaXMuZmlsZUNvbW1lbnRTdHI9bjtlbHNle3ZhciBpPXMudHJhbnNmb3JtVG8oZSx0aGlzLmZpbGVDb21tZW50KTt0aGlzLmZpbGVDb21tZW50U3RyPXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUoaSl9fX0sZmluZEV4dHJhRmllbGRVbmljb2RlUGF0aDpmdW5jdGlvbigpe3ZhciBlPXRoaXMuZXh0cmFGaWVsZHNbMjg3ODldO2lmKGUpe3ZhciB0PW4oZS52YWx1ZSk7cmV0dXJuIDEhPT10LnJlYWRJbnQoMSk/bnVsbDphKHRoaXMuZmlsZU5hbWUpIT09dC5yZWFkSW50KDQpP251bGw6by51dGY4ZGVjb2RlKHQucmVhZERhdGEoZS5sZW5ndGgtNSkpfXJldHVybiBudWxsfSxmaW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50OmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5leHRyYUZpZWxkc1syNTQ2MV07aWYoZSl7dmFyIHQ9bihlLnZhbHVlKTtyZXR1cm4gMSE9PXQucmVhZEludCgxKT9udWxsOmEodGhpcy5maWxlQ29tbWVudCkhPT10LnJlYWRJbnQoNCk/bnVsbDpvLnV0ZjhkZWNvZGUodC5yZWFkRGF0YShlLmxlbmd0aC01KSl9cmV0dXJuIG51bGx9fSx0LmV4cG9ydHM9bH0seyIuL2NvbXByZXNzZWRPYmplY3QiOjIsIi4vY29tcHJlc3Npb25zIjozLCIuL2NyYzMyIjo0LCIuL3JlYWRlci9yZWFkZXJGb3IiOjIyLCIuL3N1cHBvcnQiOjMwLCIuL3V0ZjgiOjMxLCIuL3V0aWxzIjozMn1dLDM1OltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO2Z1bmN0aW9uIG4oZSx0LHIpe3RoaXMubmFtZT1lLHRoaXMuZGlyPXIuZGlyLHRoaXMuZGF0ZT1yLmRhdGUsdGhpcy5jb21tZW50PXIuY29tbWVudCx0aGlzLnVuaXhQZXJtaXNzaW9ucz1yLnVuaXhQZXJtaXNzaW9ucyx0aGlzLmRvc1Blcm1pc3Npb25zPXIuZG9zUGVybWlzc2lvbnMsdGhpcy5fZGF0YT10LHRoaXMuX2RhdGFCaW5hcnk9ci5iaW5hcnksdGhpcy5vcHRpb25zPXtjb21wcmVzc2lvbjpyLmNvbXByZXNzaW9uLGNvbXByZXNzaW9uT3B0aW9uczpyLmNvbXByZXNzaW9uT3B0aW9uc319dmFyIHM9ZSgiLi9zdHJlYW0vU3RyZWFtSGVscGVyIiksaT1lKCIuL3N0cmVhbS9EYXRhV29ya2VyIiksYT1lKCIuL3V0ZjgiKSxvPWUoIi4vY29tcHJlc3NlZE9iamVjdCIpLGg9ZSgiLi9zdHJlYW0vR2VuZXJpY1dvcmtlciIpO24ucHJvdG90eXBlPXtpbnRlcm5hbFN0cmVhbTpmdW5jdGlvbihlKXt2YXIgdD1udWxsLHI9InN0cmluZyI7dHJ5e2lmKCFlKXRocm93IG5ldyBFcnJvcigiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLiIpO3ZhciBuPSJzdHJpbmciPT09KHI9ZS50b0xvd2VyQ2FzZSgpKXx8InRleHQiPT09cjsiYmluYXJ5c3RyaW5nIiE9PXImJiJ0ZXh0IiE9PXJ8fChyPSJzdHJpbmciKSx0PXRoaXMuX2RlY29tcHJlc3NXb3JrZXIoKTt2YXIgaT0hdGhpcy5fZGF0YUJpbmFyeTtpJiYhbiYmKHQ9dC5waXBlKG5ldyBhLlV0ZjhFbmNvZGVXb3JrZXIpKSwhaSYmbiYmKHQ9dC5waXBlKG5ldyBhLlV0ZjhEZWNvZGVXb3JrZXIpKX1jYXRjaChlKXsodD1uZXcgaCgiZXJyb3IiKSkuZXJyb3IoZSl9cmV0dXJuIG5ldyBzKHQsciwiIil9LGFzeW5jOmZ1bmN0aW9uKGUsdCl7cmV0dXJuIHRoaXMuaW50ZXJuYWxTdHJlYW0oZSkuYWNjdW11bGF0ZSh0KX0sbm9kZVN0cmVhbTpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLmludGVybmFsU3RyZWFtKGV8fCJub2RlYnVmZmVyIikudG9Ob2RlanNTdHJlYW0odCl9LF9jb21wcmVzc1dvcmtlcjpmdW5jdGlvbihlLHQpe2lmKHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBvJiZ0aGlzLl9kYXRhLmNvbXByZXNzaW9uLm1hZ2ljPT09ZS5tYWdpYylyZXR1cm4gdGhpcy5fZGF0YS5nZXRDb21wcmVzc2VkV29ya2VyKCk7dmFyIHI9dGhpcy5fZGVjb21wcmVzc1dvcmtlcigpO3JldHVybiB0aGlzLl9kYXRhQmluYXJ5fHwocj1yLnBpcGUobmV3IGEuVXRmOEVuY29kZVdvcmtlcikpLG8uY3JlYXRlV29ya2VyRnJvbShyLGUsdCl9LF9kZWNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBvP3RoaXMuX2RhdGEuZ2V0Q29udGVudFdvcmtlcigpOnRoaXMuX2RhdGEgaW5zdGFuY2VvZiBoP3RoaXMuX2RhdGE6bmV3IGkodGhpcy5fZGF0YSl9fTtmb3IodmFyIHU9WyJhc1RleHQiLCJhc0JpbmFyeSIsImFzTm9kZUJ1ZmZlciIsImFzVWludDhBcnJheSIsImFzQXJyYXlCdWZmZXIiXSxsPWZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLiIpfSxmPTA7Zjx1Lmxlbmd0aDtmKyspbi5wcm90b3R5cGVbdVtmXV09bDt0LmV4cG9ydHM9bn0seyIuL2NvbXByZXNzZWRPYmplY3QiOjIsIi4vc3RyZWFtL0RhdGFXb3JrZXIiOjI3LCIuL3N0cmVhbS9HZW5lcmljV29ya2VyIjoyOCwiLi9zdHJlYW0vU3RyZWFtSGVscGVyIjoyOSwiLi91dGY4IjozMX1dLDM2OltmdW5jdGlvbihlLGwsdCl7KGZ1bmN0aW9uKHQpeyJ1c2Ugc3RyaWN0Ijt2YXIgcixuLGU9dC5NdXRhdGlvbk9ic2VydmVyfHx0LldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7aWYoZSl7dmFyIGk9MCxzPW5ldyBlKHUpLGE9dC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgiIik7cy5vYnNlcnZlKGEse2NoYXJhY3RlckRhdGE6ITB9KSxyPWZ1bmN0aW9uKCl7YS5kYXRhPWk9KytpJTJ9fWVsc2UgaWYodC5zZXRJbW1lZGlhdGV8fHZvaWQgMD09PXQuTWVzc2FnZUNoYW5uZWwpcj0iZG9jdW1lbnQiaW4gdCYmIm9ucmVhZHlzdGF0ZWNoYW5nZSJpbiB0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoInNjcmlwdCIpP2Z1bmN0aW9uKCl7dmFyIGU9dC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJzY3JpcHQiKTtlLm9ucmVhZHlzdGF0ZWNoYW5nZT1mdW5jdGlvbigpe3UoKSxlLm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlKSxlPW51bGx9LHQuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKGUpfTpmdW5jdGlvbigpe3NldFRpbWVvdXQodSwwKX07ZWxzZXt2YXIgbz1uZXcgdC5NZXNzYWdlQ2hhbm5lbDtvLnBvcnQxLm9ubWVzc2FnZT11LHI9ZnVuY3Rpb24oKXtvLnBvcnQyLnBvc3RNZXNzYWdlKDApfX12YXIgaD1bXTtmdW5jdGlvbiB1KCl7dmFyIGUsdDtuPSEwO2Zvcih2YXIgcj1oLmxlbmd0aDtyOyl7Zm9yKHQ9aCxoPVtdLGU9LTE7KytlPHI7KXRbZV0oKTtyPWgubGVuZ3RofW49ITF9bC5leHBvcnRzPWZ1bmN0aW9uKGUpezEhPT1oLnB1c2goZSl8fG58fHIoKX19KS5jYWxsKHRoaXMsInVuZGVmaW5lZCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOiJ1bmRlZmluZWQiIT10eXBlb2Ygc2VsZj9zZWxmOiJ1bmRlZmluZWQiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XSwzNzpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgaT1lKCJpbW1lZGlhdGUiKTtmdW5jdGlvbiB1KCl7fXZhciBsPXt9LHM9WyJSRUpFQ1RFRCJdLGE9WyJGVUxGSUxMRUQiXSxuPVsiUEVORElORyJdO2Z1bmN0aW9uIG8oZSl7aWYoImZ1bmN0aW9uIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcigicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIik7dGhpcy5zdGF0ZT1uLHRoaXMucXVldWU9W10sdGhpcy5vdXRjb21lPXZvaWQgMCxlIT09dSYmZCh0aGlzLGUpfWZ1bmN0aW9uIGgoZSx0LHIpe3RoaXMucHJvbWlzZT1lLCJmdW5jdGlvbiI9PXR5cGVvZiB0JiYodGhpcy5vbkZ1bGZpbGxlZD10LHRoaXMuY2FsbEZ1bGZpbGxlZD10aGlzLm90aGVyQ2FsbEZ1bGZpbGxlZCksImZ1bmN0aW9uIj09dHlwZW9mIHImJih0aGlzLm9uUmVqZWN0ZWQ9cix0aGlzLmNhbGxSZWplY3RlZD10aGlzLm90aGVyQ2FsbFJlamVjdGVkKX1mdW5jdGlvbiBmKHQscixuKXtpKGZ1bmN0aW9uKCl7dmFyIGU7dHJ5e2U9cihuKX1jYXRjaChlKXtyZXR1cm4gbC5yZWplY3QodCxlKX1lPT09dD9sLnJlamVjdCh0LG5ldyBUeXBlRXJyb3IoIkNhbm5vdCByZXNvbHZlIHByb21pc2Ugd2l0aCBpdHNlbGYiKSk6bC5yZXNvbHZlKHQsZSl9KX1mdW5jdGlvbiBjKGUpe3ZhciB0PWUmJmUudGhlbjtpZihlJiYoIm9iamVjdCI9PXR5cGVvZiBlfHwiZnVuY3Rpb24iPT10eXBlb2YgZSkmJiJmdW5jdGlvbiI9PXR5cGVvZiB0KXJldHVybiBmdW5jdGlvbigpe3QuYXBwbHkoZSxhcmd1bWVudHMpfX1mdW5jdGlvbiBkKHQsZSl7dmFyIHI9ITE7ZnVuY3Rpb24gbihlKXtyfHwocj0hMCxsLnJlamVjdCh0LGUpKX1mdW5jdGlvbiBpKGUpe3J8fChyPSEwLGwucmVzb2x2ZSh0LGUpKX12YXIgcz1wKGZ1bmN0aW9uKCl7ZShpLG4pfSk7ImVycm9yIj09PXMuc3RhdHVzJiZuKHMudmFsdWUpfWZ1bmN0aW9uIHAoZSx0KXt2YXIgcj17fTt0cnl7ci52YWx1ZT1lKHQpLHIuc3RhdHVzPSJzdWNjZXNzIn1jYXRjaChlKXtyLnN0YXR1cz0iZXJyb3IiLHIudmFsdWU9ZX1yZXR1cm4gcn0odC5leHBvcnRzPW8pLnByb3RvdHlwZS5maW5hbGx5PWZ1bmN0aW9uKHQpe2lmKCJmdW5jdGlvbiIhPXR5cGVvZiB0KXJldHVybiB0aGlzO3ZhciByPXRoaXMuY29uc3RydWN0b3I7cmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbihlKXtyZXR1cm4gci5yZXNvbHZlKHQoKSkudGhlbihmdW5jdGlvbigpe3JldHVybiBlfSl9LGZ1bmN0aW9uKGUpe3JldHVybiByLnJlc29sdmUodCgpKS50aGVuKGZ1bmN0aW9uKCl7dGhyb3cgZX0pfSl9LG8ucHJvdG90eXBlLmNhdGNoPWZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLnRoZW4obnVsbCxlKX0sby5wcm90b3R5cGUudGhlbj1mdW5jdGlvbihlLHQpe2lmKCJmdW5jdGlvbiIhPXR5cGVvZiBlJiZ0aGlzLnN0YXRlPT09YXx8ImZ1bmN0aW9uIiE9dHlwZW9mIHQmJnRoaXMuc3RhdGU9PT1zKXJldHVybiB0aGlzO3ZhciByPW5ldyB0aGlzLmNvbnN0cnVjdG9yKHUpO3RoaXMuc3RhdGUhPT1uP2Yocix0aGlzLnN0YXRlPT09YT9lOnQsdGhpcy5vdXRjb21lKTp0aGlzLnF1ZXVlLnB1c2gobmV3IGgocixlLHQpKTtyZXR1cm4gcn0saC5wcm90b3R5cGUuY2FsbEZ1bGZpbGxlZD1mdW5jdGlvbihlKXtsLnJlc29sdmUodGhpcy5wcm9taXNlLGUpfSxoLnByb3RvdHlwZS5vdGhlckNhbGxGdWxmaWxsZWQ9ZnVuY3Rpb24oZSl7Zih0aGlzLnByb21pc2UsdGhpcy5vbkZ1bGZpbGxlZCxlKX0saC5wcm90b3R5cGUuY2FsbFJlamVjdGVkPWZ1bmN0aW9uKGUpe2wucmVqZWN0KHRoaXMucHJvbWlzZSxlKX0saC5wcm90b3R5cGUub3RoZXJDYWxsUmVqZWN0ZWQ9ZnVuY3Rpb24oZSl7Zih0aGlzLnByb21pc2UsdGhpcy5vblJlamVjdGVkLGUpfSxsLnJlc29sdmU9ZnVuY3Rpb24oZSx0KXt2YXIgcj1wKGMsdCk7aWYoImVycm9yIj09PXIuc3RhdHVzKXJldHVybiBsLnJlamVjdChlLHIudmFsdWUpO3ZhciBuPXIudmFsdWU7aWYobilkKGUsbik7ZWxzZXtlLnN0YXRlPWEsZS5vdXRjb21lPXQ7Zm9yKHZhciBpPS0xLHM9ZS5xdWV1ZS5sZW5ndGg7KytpPHM7KWUucXVldWVbaV0uY2FsbEZ1bGZpbGxlZCh0KX1yZXR1cm4gZX0sbC5yZWplY3Q9ZnVuY3Rpb24oZSx0KXtlLnN0YXRlPXMsZS5vdXRjb21lPXQ7Zm9yKHZhciByPS0xLG49ZS5xdWV1ZS5sZW5ndGg7KytyPG47KWUucXVldWVbcl0uY2FsbFJlamVjdGVkKHQpO3JldHVybiBlfSxvLnJlc29sdmU9ZnVuY3Rpb24oZSl7aWYoZSBpbnN0YW5jZW9mIHRoaXMpcmV0dXJuIGU7cmV0dXJuIGwucmVzb2x2ZShuZXcgdGhpcyh1KSxlKX0sby5yZWplY3Q9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IHRoaXModSk7cmV0dXJuIGwucmVqZWN0KHQsZSl9LG8uYWxsPWZ1bmN0aW9uKGUpe3ZhciByPXRoaXM7aWYoIltvYmplY3QgQXJyYXldIiE9PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChlKSlyZXR1cm4gdGhpcy5yZWplY3QobmV3IFR5cGVFcnJvcigibXVzdCBiZSBhbiBhcnJheSIpKTt2YXIgbj1lLmxlbmd0aCxpPSExO2lmKCFuKXJldHVybiB0aGlzLnJlc29sdmUoW10pO3ZhciBzPW5ldyBBcnJheShuKSxhPTAsdD0tMSxvPW5ldyB0aGlzKHUpO2Zvcig7Kyt0PG47KWgoZVt0XSx0KTtyZXR1cm4gbztmdW5jdGlvbiBoKGUsdCl7ci5yZXNvbHZlKGUpLnRoZW4oZnVuY3Rpb24oZSl7c1t0XT1lLCsrYSE9PW58fGl8fChpPSEwLGwucmVzb2x2ZShvLHMpKX0sZnVuY3Rpb24oZSl7aXx8KGk9ITAsbC5yZWplY3QobyxlKSl9KX19LG8ucmFjZT1mdW5jdGlvbihlKXt2YXIgdD10aGlzO2lmKCJbb2JqZWN0IEFycmF5XSIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoIm11c3QgYmUgYW4gYXJyYXkiKSk7dmFyIHI9ZS5sZW5ndGgsbj0hMTtpZighcilyZXR1cm4gdGhpcy5yZXNvbHZlKFtdKTt2YXIgaT0tMSxzPW5ldyB0aGlzKHUpO2Zvcig7KytpPHI7KWE9ZVtpXSx0LnJlc29sdmUoYSkudGhlbihmdW5jdGlvbihlKXtufHwobj0hMCxsLnJlc29sdmUocyxlKSl9LGZ1bmN0aW9uKGUpe258fChuPSEwLGwucmVqZWN0KHMsZSkpfSk7dmFyIGE7cmV0dXJuIHN9fSx7aW1tZWRpYXRlOjM2fV0sMzg6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dmFyIG49e307KDAsZSgiLi9saWIvdXRpbHMvY29tbW9uIikuYXNzaWduKShuLGUoIi4vbGliL2RlZmxhdGUiKSxlKCIuL2xpYi9pbmZsYXRlIiksZSgiLi9saWIvemxpYi9jb25zdGFudHMiKSksdC5leHBvcnRzPW59LHsiLi9saWIvZGVmbGF0ZSI6MzksIi4vbGliL2luZmxhdGUiOjQwLCIuL2xpYi91dGlscy9jb21tb24iOjQxLCIuL2xpYi96bGliL2NvbnN0YW50cyI6NDR9XSwzOTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgYT1lKCIuL3psaWIvZGVmbGF0ZSIpLG89ZSgiLi91dGlscy9jb21tb24iKSxoPWUoIi4vdXRpbHMvc3RyaW5ncyIpLGk9ZSgiLi96bGliL21lc3NhZ2VzIikscz1lKCIuL3psaWIvenN0cmVhbSIpLHU9T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxsPTAsZj0tMSxjPTAsZD04O2Z1bmN0aW9uIHAoZSl7aWYoISh0aGlzIGluc3RhbmNlb2YgcCkpcmV0dXJuIG5ldyBwKGUpO3RoaXMub3B0aW9ucz1vLmFzc2lnbih7bGV2ZWw6ZixtZXRob2Q6ZCxjaHVua1NpemU6MTYzODQsd2luZG93Qml0czoxNSxtZW1MZXZlbDo4LHN0cmF0ZWd5OmMsdG86IiJ9LGV8fHt9KTt2YXIgdD10aGlzLm9wdGlvbnM7dC5yYXcmJjA8dC53aW5kb3dCaXRzP3Qud2luZG93Qml0cz0tdC53aW5kb3dCaXRzOnQuZ3ppcCYmMDx0LndpbmRvd0JpdHMmJnQud2luZG93Qml0czwxNiYmKHQud2luZG93Qml0cys9MTYpLHRoaXMuZXJyPTAsdGhpcy5tc2c9IiIsdGhpcy5lbmRlZD0hMSx0aGlzLmNodW5rcz1bXSx0aGlzLnN0cm09bmV3IHMsdGhpcy5zdHJtLmF2YWlsX291dD0wO3ZhciByPWEuZGVmbGF0ZUluaXQyKHRoaXMuc3RybSx0LmxldmVsLHQubWV0aG9kLHQud2luZG93Qml0cyx0Lm1lbUxldmVsLHQuc3RyYXRlZ3kpO2lmKHIhPT1sKXRocm93IG5ldyBFcnJvcihpW3JdKTtpZih0LmhlYWRlciYmYS5kZWZsYXRlU2V0SGVhZGVyKHRoaXMuc3RybSx0LmhlYWRlciksdC5kaWN0aW9uYXJ5KXt2YXIgbjtpZihuPSJzdHJpbmciPT10eXBlb2YgdC5kaWN0aW9uYXJ5P2guc3RyaW5nMmJ1Zih0LmRpY3Rpb25hcnkpOiJbb2JqZWN0IEFycmF5QnVmZmVyXSI9PT11LmNhbGwodC5kaWN0aW9uYXJ5KT9uZXcgVWludDhBcnJheSh0LmRpY3Rpb25hcnkpOnQuZGljdGlvbmFyeSwocj1hLmRlZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSxuKSkhPT1sKXRocm93IG5ldyBFcnJvcihpW3JdKTt0aGlzLl9kaWN0X3NldD0hMH19ZnVuY3Rpb24gbihlLHQpe3ZhciByPW5ldyBwKHQpO2lmKHIucHVzaChlLCEwKSxyLmVycil0aHJvdyByLm1zZ3x8aVtyLmVycl07cmV0dXJuIHIucmVzdWx0fXAucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oZSx0KXt2YXIgcixuLGk9dGhpcy5zdHJtLHM9dGhpcy5vcHRpb25zLmNodW5rU2l6ZTtpZih0aGlzLmVuZGVkKXJldHVybiExO249dD09PX5+dD90OiEwPT09dD80OjAsInN0cmluZyI9PXR5cGVvZiBlP2kuaW5wdXQ9aC5zdHJpbmcyYnVmKGUpOiJbb2JqZWN0IEFycmF5QnVmZmVyXSI9PT11LmNhbGwoZSk/aS5pbnB1dD1uZXcgVWludDhBcnJheShlKTppLmlucHV0PWUsaS5uZXh0X2luPTAsaS5hdmFpbF9pbj1pLmlucHV0Lmxlbmd0aDtkb3tpZigwPT09aS5hdmFpbF9vdXQmJihpLm91dHB1dD1uZXcgby5CdWY4KHMpLGkubmV4dF9vdXQ9MCxpLmF2YWlsX291dD1zKSwxIT09KHI9YS5kZWZsYXRlKGksbikpJiZyIT09bClyZXR1cm4gdGhpcy5vbkVuZChyKSwhKHRoaXMuZW5kZWQ9ITApOzAhPT1pLmF2YWlsX291dCYmKDAhPT1pLmF2YWlsX2lufHw0IT09biYmMiE9PW4pfHwoInN0cmluZyI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5vbkRhdGEoaC5idWYyYmluc3RyaW5nKG8uc2hyaW5rQnVmKGkub3V0cHV0LGkubmV4dF9vdXQpKSk6dGhpcy5vbkRhdGEoby5zaHJpbmtCdWYoaS5vdXRwdXQsaS5uZXh0X291dCkpKX13aGlsZSgoMDxpLmF2YWlsX2lufHwwPT09aS5hdmFpbF9vdXQpJiYxIT09cik7cmV0dXJuIDQ9PT1uPyhyPWEuZGVmbGF0ZUVuZCh0aGlzLnN0cm0pLHRoaXMub25FbmQociksdGhpcy5lbmRlZD0hMCxyPT09bCk6MiE9PW58fCh0aGlzLm9uRW5kKGwpLCEoaS5hdmFpbF9vdXQ9MCkpfSxwLnByb3RvdHlwZS5vbkRhdGE9ZnVuY3Rpb24oZSl7dGhpcy5jaHVua3MucHVzaChlKX0scC5wcm90b3R5cGUub25FbmQ9ZnVuY3Rpb24oZSl7ZT09PWwmJigic3RyaW5nIj09PXRoaXMub3B0aW9ucy50bz90aGlzLnJlc3VsdD10aGlzLmNodW5rcy5qb2luKCIiKTp0aGlzLnJlc3VsdD1vLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpKSx0aGlzLmNodW5rcz1bXSx0aGlzLmVycj1lLHRoaXMubXNnPXRoaXMuc3RybS5tc2d9LHIuRGVmbGF0ZT1wLHIuZGVmbGF0ZT1uLHIuZGVmbGF0ZVJhdz1mdW5jdGlvbihlLHQpe3JldHVybih0PXR8fHt9KS5yYXc9ITAsbihlLHQpfSxyLmd6aXA9ZnVuY3Rpb24oZSx0KXtyZXR1cm4odD10fHx7fSkuZ3ppcD0hMCxuKGUsdCl9fSx7Ii4vdXRpbHMvY29tbW9uIjo0MSwiLi91dGlscy9zdHJpbmdzIjo0MiwiLi96bGliL2RlZmxhdGUiOjQ2LCIuL3psaWIvbWVzc2FnZXMiOjUxLCIuL3psaWIvenN0cmVhbSI6NTN9XSw0MDpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgYz1lKCIuL3psaWIvaW5mbGF0ZSIpLGQ9ZSgiLi91dGlscy9jb21tb24iKSxwPWUoIi4vdXRpbHMvc3RyaW5ncyIpLG09ZSgiLi96bGliL2NvbnN0YW50cyIpLG49ZSgiLi96bGliL21lc3NhZ2VzIiksaT1lKCIuL3psaWIvenN0cmVhbSIpLHM9ZSgiLi96bGliL2d6aGVhZGVyIiksXz1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO2Z1bmN0aW9uIGEoZSl7aWYoISh0aGlzIGluc3RhbmNlb2YgYSkpcmV0dXJuIG5ldyBhKGUpO3RoaXMub3B0aW9ucz1kLmFzc2lnbih7Y2h1bmtTaXplOjE2Mzg0LHdpbmRvd0JpdHM6MCx0bzoiIn0sZXx8e30pO3ZhciB0PXRoaXMub3B0aW9uczt0LnJhdyYmMDw9dC53aW5kb3dCaXRzJiZ0LndpbmRvd0JpdHM8MTYmJih0LndpbmRvd0JpdHM9LXQud2luZG93Qml0cywwPT09dC53aW5kb3dCaXRzJiYodC53aW5kb3dCaXRzPS0xNSkpLCEoMDw9dC53aW5kb3dCaXRzJiZ0LndpbmRvd0JpdHM8MTYpfHxlJiZlLndpbmRvd0JpdHN8fCh0LndpbmRvd0JpdHMrPTMyKSwxNTx0LndpbmRvd0JpdHMmJnQud2luZG93Qml0czw0OCYmMD09KDE1JnQud2luZG93Qml0cykmJih0LndpbmRvd0JpdHN8PTE1KSx0aGlzLmVycj0wLHRoaXMubXNnPSIiLHRoaXMuZW5kZWQ9ITEsdGhpcy5jaHVua3M9W10sdGhpcy5zdHJtPW5ldyBpLHRoaXMuc3RybS5hdmFpbF9vdXQ9MDt2YXIgcj1jLmluZmxhdGVJbml0Mih0aGlzLnN0cm0sdC53aW5kb3dCaXRzKTtpZihyIT09bS5aX09LKXRocm93IG5ldyBFcnJvcihuW3JdKTt0aGlzLmhlYWRlcj1uZXcgcyxjLmluZmxhdGVHZXRIZWFkZXIodGhpcy5zdHJtLHRoaXMuaGVhZGVyKX1mdW5jdGlvbiBvKGUsdCl7dmFyIHI9bmV3IGEodCk7aWYoci5wdXNoKGUsITApLHIuZXJyKXRocm93IHIubXNnfHxuW3IuZXJyXTtyZXR1cm4gci5yZXN1bHR9YS5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlLHQpe3ZhciByLG4saSxzLGEsbyxoPXRoaXMuc3RybSx1PXRoaXMub3B0aW9ucy5jaHVua1NpemUsbD10aGlzLm9wdGlvbnMuZGljdGlvbmFyeSxmPSExO2lmKHRoaXMuZW5kZWQpcmV0dXJuITE7bj10PT09fn50P3Q6ITA9PT10P20uWl9GSU5JU0g6bS5aX05PX0ZMVVNILCJzdHJpbmciPT10eXBlb2YgZT9oLmlucHV0PXAuYmluc3RyaW5nMmJ1ZihlKToiW29iamVjdCBBcnJheUJ1ZmZlcl0iPT09Xy5jYWxsKGUpP2guaW5wdXQ9bmV3IFVpbnQ4QXJyYXkoZSk6aC5pbnB1dD1lLGgubmV4dF9pbj0wLGguYXZhaWxfaW49aC5pbnB1dC5sZW5ndGg7ZG97aWYoMD09PWguYXZhaWxfb3V0JiYoaC5vdXRwdXQ9bmV3IGQuQnVmOCh1KSxoLm5leHRfb3V0PTAsaC5hdmFpbF9vdXQ9dSksKHI9Yy5pbmZsYXRlKGgsbS5aX05PX0ZMVVNIKSk9PT1tLlpfTkVFRF9ESUNUJiZsJiYobz0ic3RyaW5nIj09dHlwZW9mIGw/cC5zdHJpbmcyYnVmKGwpOiJbb2JqZWN0IEFycmF5QnVmZmVyXSI9PT1fLmNhbGwobCk/bmV3IFVpbnQ4QXJyYXkobCk6bCxyPWMuaW5mbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLG8pKSxyPT09bS5aX0JVRl9FUlJPUiYmITA9PT1mJiYocj1tLlpfT0ssZj0hMSksciE9PW0uWl9TVFJFQU1fRU5EJiZyIT09bS5aX09LKXJldHVybiB0aGlzLm9uRW5kKHIpLCEodGhpcy5lbmRlZD0hMCk7aC5uZXh0X291dCYmKDAhPT1oLmF2YWlsX291dCYmciE9PW0uWl9TVFJFQU1fRU5EJiYoMCE9PWguYXZhaWxfaW58fG4hPT1tLlpfRklOSVNIJiZuIT09bS5aX1NZTkNfRkxVU0gpfHwoInN0cmluZyI9PT10aGlzLm9wdGlvbnMudG8/KGk9cC51dGY4Ym9yZGVyKGgub3V0cHV0LGgubmV4dF9vdXQpLHM9aC5uZXh0X291dC1pLGE9cC5idWYyc3RyaW5nKGgub3V0cHV0LGkpLGgubmV4dF9vdXQ9cyxoLmF2YWlsX291dD11LXMscyYmZC5hcnJheVNldChoLm91dHB1dCxoLm91dHB1dCxpLHMsMCksdGhpcy5vbkRhdGEoYSkpOnRoaXMub25EYXRhKGQuc2hyaW5rQnVmKGgub3V0cHV0LGgubmV4dF9vdXQpKSkpLDA9PT1oLmF2YWlsX2luJiYwPT09aC5hdmFpbF9vdXQmJihmPSEwKX13aGlsZSgoMDxoLmF2YWlsX2lufHwwPT09aC5hdmFpbF9vdXQpJiZyIT09bS5aX1NUUkVBTV9FTkQpO3JldHVybiByPT09bS5aX1NUUkVBTV9FTkQmJihuPW0uWl9GSU5JU0gpLG49PT1tLlpfRklOSVNIPyhyPWMuaW5mbGF0ZUVuZCh0aGlzLnN0cm0pLHRoaXMub25FbmQociksdGhpcy5lbmRlZD0hMCxyPT09bS5aX09LKTpuIT09bS5aX1NZTkNfRkxVU0h8fCh0aGlzLm9uRW5kKG0uWl9PSyksIShoLmF2YWlsX291dD0wKSl9LGEucHJvdG90eXBlLm9uRGF0YT1mdW5jdGlvbihlKXt0aGlzLmNodW5rcy5wdXNoKGUpfSxhLnByb3RvdHlwZS5vbkVuZD1mdW5jdGlvbihlKXtlPT09bS5aX09LJiYoInN0cmluZyI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5yZXN1bHQ9dGhpcy5jaHVua3Muam9pbigiIik6dGhpcy5yZXN1bHQ9ZC5mbGF0dGVuQ2h1bmtzKHRoaXMuY2h1bmtzKSksdGhpcy5jaHVua3M9W10sdGhpcy5lcnI9ZSx0aGlzLm1zZz10aGlzLnN0cm0ubXNnfSxyLkluZmxhdGU9YSxyLmluZmxhdGU9byxyLmluZmxhdGVSYXc9ZnVuY3Rpb24oZSx0KXtyZXR1cm4odD10fHx7fSkucmF3PSEwLG8oZSx0KX0sci51bmd6aXA9b30seyIuL3V0aWxzL2NvbW1vbiI6NDEsIi4vdXRpbHMvc3RyaW5ncyI6NDIsIi4vemxpYi9jb25zdGFudHMiOjQ0LCIuL3psaWIvZ3poZWFkZXIiOjQ3LCIuL3psaWIvaW5mbGF0ZSI6NDksIi4vemxpYi9tZXNzYWdlcyI6NTEsIi4vemxpYi96c3RyZWFtIjo1M31dLDQxOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBuPSJ1bmRlZmluZWQiIT10eXBlb2YgVWludDhBcnJheSYmInVuZGVmaW5lZCIhPXR5cGVvZiBVaW50MTZBcnJheSYmInVuZGVmaW5lZCIhPXR5cGVvZiBJbnQzMkFycmF5O3IuYXNzaWduPWZ1bmN0aW9uKGUpe2Zvcih2YXIgdD1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSk7dC5sZW5ndGg7KXt2YXIgcj10LnNoaWZ0KCk7aWYocil7aWYoIm9iamVjdCIhPXR5cGVvZiByKXRocm93IG5ldyBUeXBlRXJyb3IocisibXVzdCBiZSBub24tb2JqZWN0Iik7Zm9yKHZhciBuIGluIHIpci5oYXNPd25Qcm9wZXJ0eShuKSYmKGVbbl09cltuXSl9fXJldHVybiBlfSxyLnNocmlua0J1Zj1mdW5jdGlvbihlLHQpe3JldHVybiBlLmxlbmd0aD09PXQ/ZTplLnN1YmFycmF5P2Uuc3ViYXJyYXkoMCx0KTooZS5sZW5ndGg9dCxlKX07dmFyIGk9e2FycmF5U2V0OmZ1bmN0aW9uKGUsdCxyLG4saSl7aWYodC5zdWJhcnJheSYmZS5zdWJhcnJheSllLnNldCh0LnN1YmFycmF5KHIscituKSxpKTtlbHNlIGZvcih2YXIgcz0wO3M8bjtzKyspZVtpK3NdPXRbcitzXX0sZmxhdHRlbkNodW5rczpmdW5jdGlvbihlKXt2YXIgdCxyLG4saSxzLGE7Zm9yKHQ9bj0wLHI9ZS5sZW5ndGg7dDxyO3QrKyluKz1lW3RdLmxlbmd0aDtmb3IoYT1uZXcgVWludDhBcnJheShuKSx0PWk9MCxyPWUubGVuZ3RoO3Q8cjt0Kyspcz1lW3RdLGEuc2V0KHMsaSksaSs9cy5sZW5ndGg7cmV0dXJuIGF9fSxzPXthcnJheVNldDpmdW5jdGlvbihlLHQscixuLGkpe2Zvcih2YXIgcz0wO3M8bjtzKyspZVtpK3NdPXRbcitzXX0sZmxhdHRlbkNodW5rczpmdW5jdGlvbihlKXtyZXR1cm5bXS5jb25jYXQuYXBwbHkoW10sZSl9fTtyLnNldFR5cGVkPWZ1bmN0aW9uKGUpe2U/KHIuQnVmOD1VaW50OEFycmF5LHIuQnVmMTY9VWludDE2QXJyYXksci5CdWYzMj1JbnQzMkFycmF5LHIuYXNzaWduKHIsaSkpOihyLkJ1Zjg9QXJyYXksci5CdWYxNj1BcnJheSxyLkJ1ZjMyPUFycmF5LHIuYXNzaWduKHIscykpfSxyLnNldFR5cGVkKG4pfSx7fV0sNDI6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dmFyIGg9ZSgiLi9jb21tb24iKSxpPSEwLHM9ITA7dHJ5e1N0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxbMF0pfWNhdGNoKGUpe2k9ITF9dHJ5e1N0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxuZXcgVWludDhBcnJheSgxKSl9Y2F0Y2goZSl7cz0hMX1mb3IodmFyIHU9bmV3IGguQnVmOCgyNTYpLG49MDtuPDI1NjtuKyspdVtuXT0yNTI8PW4/NjoyNDg8PW4/NToyNDA8PW4/NDoyMjQ8PW4/MzoxOTI8PW4/MjoxO2Z1bmN0aW9uIGwoZSx0KXtpZih0PDY1NTM3JiYoZS5zdWJhcnJheSYmc3x8IWUuc3ViYXJyYXkmJmkpKXJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsaC5zaHJpbmtCdWYoZSx0KSk7Zm9yKHZhciByPSIiLG49MDtuPHQ7bisrKXIrPVN0cmluZy5mcm9tQ2hhckNvZGUoZVtuXSk7cmV0dXJuIHJ9dVsyNTRdPXVbMjU0XT0xLHIuc3RyaW5nMmJ1Zj1mdW5jdGlvbihlKXt2YXIgdCxyLG4saSxzLGE9ZS5sZW5ndGgsbz0wO2ZvcihpPTA7aTxhO2krKyk1NTI5Nj09KDY0NTEyJihyPWUuY2hhckNvZGVBdChpKSkpJiZpKzE8YSYmNTYzMjA9PSg2NDUxMiYobj1lLmNoYXJDb2RlQXQoaSsxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhuLTU2MzIwKSxpKyspLG8rPXI8MTI4PzE6cjwyMDQ4PzI6cjw2NTUzNj8zOjQ7Zm9yKHQ9bmV3IGguQnVmOChvKSxpPXM9MDtzPG87aSsrKTU1Mjk2PT0oNjQ1MTImKHI9ZS5jaGFyQ29kZUF0KGkpKSkmJmkrMTxhJiY1NjMyMD09KDY0NTEyJihuPWUuY2hhckNvZGVBdChpKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKG4tNTYzMjApLGkrKykscjwxMjg/dFtzKytdPXI6KHI8MjA0OD90W3MrK109MTkyfHI+Pj42OihyPDY1NTM2P3RbcysrXT0yMjR8cj4+PjEyOih0W3MrK109MjQwfHI+Pj4xOCx0W3MrK109MTI4fHI+Pj4xMiY2MyksdFtzKytdPTEyOHxyPj4+NiY2MyksdFtzKytdPTEyOHw2MyZyKTtyZXR1cm4gdH0sci5idWYyYmluc3RyaW5nPWZ1bmN0aW9uKGUpe3JldHVybiBsKGUsZS5sZW5ndGgpfSxyLmJpbnN0cmluZzJidWY9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PW5ldyBoLkJ1ZjgoZS5sZW5ndGgpLHI9MCxuPXQubGVuZ3RoO3I8bjtyKyspdFtyXT1lLmNoYXJDb2RlQXQocik7cmV0dXJuIHR9LHIuYnVmMnN0cmluZz1mdW5jdGlvbihlLHQpe3ZhciByLG4saSxzLGE9dHx8ZS5sZW5ndGgsbz1uZXcgQXJyYXkoMiphKTtmb3Iocj1uPTA7cjxhOylpZigoaT1lW3IrK10pPDEyOClvW24rK109aTtlbHNlIGlmKDQ8KHM9dVtpXSkpb1tuKytdPTY1NTMzLHIrPXMtMTtlbHNle2ZvcihpJj0yPT09cz8zMTozPT09cz8xNTo3OzE8cyYmcjxhOylpPWk8PDZ8NjMmZVtyKytdLHMtLTsxPHM/b1tuKytdPTY1NTMzOmk8NjU1MzY/b1tuKytdPWk6KGktPTY1NTM2LG9bbisrXT01NTI5NnxpPj4xMCYxMDIzLG9bbisrXT01NjMyMHwxMDIzJmkpfXJldHVybiBsKG8sbil9LHIudXRmOGJvcmRlcj1mdW5jdGlvbihlLHQpe3ZhciByO2ZvcigodD10fHxlLmxlbmd0aCk+ZS5sZW5ndGgmJih0PWUubGVuZ3RoKSxyPXQtMTswPD1yJiYxMjg9PSgxOTImZVtyXSk7KXItLTtyZXR1cm4gcjwwP3Q6MD09PXI/dDpyK3VbZVtyXV0+dD9yOnR9fSx7Ii4vY29tbW9uIjo0MX1dLDQzOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQscixuKXtmb3IodmFyIGk9NjU1MzUmZXwwLHM9ZT4+PjE2JjY1NTM1fDAsYT0wOzAhPT1yOyl7Zm9yKHItPWE9MmUzPHI/MmUzOnI7cz1zKyhpPWkrdFtuKytdfDApfDAsLS1hOyk7aSU9NjU1MjEscyU9NjU1MjF9cmV0dXJuIGl8czw8MTZ8MH19LHt9XSw0NDpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt0LmV4cG9ydHM9e1pfTk9fRkxVU0g6MCxaX1BBUlRJQUxfRkxVU0g6MSxaX1NZTkNfRkxVU0g6MixaX0ZVTExfRkxVU0g6MyxaX0ZJTklTSDo0LFpfQkxPQ0s6NSxaX1RSRUVTOjYsWl9PSzowLFpfU1RSRUFNX0VORDoxLFpfTkVFRF9ESUNUOjIsWl9FUlJOTzotMSxaX1NUUkVBTV9FUlJPUjotMixaX0RBVEFfRVJST1I6LTMsWl9CVUZfRVJST1I6LTUsWl9OT19DT01QUkVTU0lPTjowLFpfQkVTVF9TUEVFRDoxLFpfQkVTVF9DT01QUkVTU0lPTjo5LFpfREVGQVVMVF9DT01QUkVTU0lPTjotMSxaX0ZJTFRFUkVEOjEsWl9IVUZGTUFOX09OTFk6MixaX1JMRTozLFpfRklYRUQ6NCxaX0RFRkFVTFRfU1RSQVRFR1k6MCxaX0JJTkFSWTowLFpfVEVYVDoxLFpfVU5LTk9XTjoyLFpfREVGTEFURUQ6OH19LHt9XSw0NTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgbz1mdW5jdGlvbigpe2Zvcih2YXIgZSx0PVtdLHI9MDtyPDI1NjtyKyspe2U9cjtmb3IodmFyIG49MDtuPDg7bisrKWU9MSZlPzM5ODgyOTIzODReZT4+PjE6ZT4+PjE7dFtyXT1lfXJldHVybiB0fSgpO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQscixuKXt2YXIgaT1vLHM9bityO2VePS0xO2Zvcih2YXIgYT1uO2E8czthKyspZT1lPj4+OF5pWzI1NSYoZV50W2FdKV07cmV0dXJuLTFeZX19LHt9XSw0NjpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgaCxjPWUoIi4uL3V0aWxzL2NvbW1vbiIpLHU9ZSgiLi90cmVlcyIpLGQ9ZSgiLi9hZGxlcjMyIikscD1lKCIuL2NyYzMyIiksbj1lKCIuL21lc3NhZ2VzIiksbD0wLGY9NCxtPTAsXz0tMixnPS0xLGI9NCxpPTIsdj04LHk9OSxzPTI4NixhPTMwLG89MTksdz0yKnMrMSxrPTE1LHg9MyxTPTI1OCx6PVMreCsxLEM9NDIsRT0xMTMsQT0xLEk9MixPPTMsQj00O2Z1bmN0aW9uIFIoZSx0KXtyZXR1cm4gZS5tc2c9blt0XSx0fWZ1bmN0aW9uIFQoZSl7cmV0dXJuKGU8PDEpLSg0PGU/OTowKX1mdW5jdGlvbiBEKGUpe2Zvcih2YXIgdD1lLmxlbmd0aDswPD0tLXQ7KWVbdF09MH1mdW5jdGlvbiBGKGUpe3ZhciB0PWUuc3RhdGUscj10LnBlbmRpbmc7cj5lLmF2YWlsX291dCYmKHI9ZS5hdmFpbF9vdXQpLDAhPT1yJiYoYy5hcnJheVNldChlLm91dHB1dCx0LnBlbmRpbmdfYnVmLHQucGVuZGluZ19vdXQscixlLm5leHRfb3V0KSxlLm5leHRfb3V0Kz1yLHQucGVuZGluZ19vdXQrPXIsZS50b3RhbF9vdXQrPXIsZS5hdmFpbF9vdXQtPXIsdC5wZW5kaW5nLT1yLDA9PT10LnBlbmRpbmcmJih0LnBlbmRpbmdfb3V0PTApKX1mdW5jdGlvbiBOKGUsdCl7dS5fdHJfZmx1c2hfYmxvY2soZSwwPD1lLmJsb2NrX3N0YXJ0P2UuYmxvY2tfc3RhcnQ6LTEsZS5zdHJzdGFydC1lLmJsb2NrX3N0YXJ0LHQpLGUuYmxvY2tfc3RhcnQ9ZS5zdHJzdGFydCxGKGUuc3RybSl9ZnVuY3Rpb24gVShlLHQpe2UucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPXR9ZnVuY3Rpb24gUChlLHQpe2UucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPXQ+Pj44JjI1NSxlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT0yNTUmdH1mdW5jdGlvbiBMKGUsdCl7dmFyIHIsbixpPWUubWF4X2NoYWluX2xlbmd0aCxzPWUuc3Ryc3RhcnQsYT1lLnByZXZfbGVuZ3RoLG89ZS5uaWNlX21hdGNoLGg9ZS5zdHJzdGFydD5lLndfc2l6ZS16P2Uuc3Ryc3RhcnQtKGUud19zaXplLXopOjAsdT1lLndpbmRvdyxsPWUud19tYXNrLGY9ZS5wcmV2LGM9ZS5zdHJzdGFydCtTLGQ9dVtzK2EtMV0scD11W3MrYV07ZS5wcmV2X2xlbmd0aD49ZS5nb29kX21hdGNoJiYoaT4+PTIpLG8+ZS5sb29rYWhlYWQmJihvPWUubG9va2FoZWFkKTtkb3tpZih1WyhyPXQpK2FdPT09cCYmdVtyK2EtMV09PT1kJiZ1W3JdPT09dVtzXSYmdVsrK3JdPT09dVtzKzFdKXtzKz0yLHIrKztkb3t9d2hpbGUodVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnM8Yyk7aWYobj1TLShjLXMpLHM9Yy1TLGE8bil7aWYoZS5tYXRjaF9zdGFydD10LG88PShhPW4pKWJyZWFrO2Q9dVtzK2EtMV0scD11W3MrYV19fX13aGlsZSgodD1mW3QmbF0pPmgmJjAhPS0taSk7cmV0dXJuIGE8PWUubG9va2FoZWFkP2E6ZS5sb29rYWhlYWR9ZnVuY3Rpb24gaihlKXt2YXIgdCxyLG4saSxzLGEsbyxoLHUsbCxmPWUud19zaXplO2Rve2lmKGk9ZS53aW5kb3dfc2l6ZS1lLmxvb2thaGVhZC1lLnN0cnN0YXJ0LGUuc3Ryc3RhcnQ+PWYrKGYteikpe2ZvcihjLmFycmF5U2V0KGUud2luZG93LGUud2luZG93LGYsZiwwKSxlLm1hdGNoX3N0YXJ0LT1mLGUuc3Ryc3RhcnQtPWYsZS5ibG9ja19zdGFydC09Zix0PXI9ZS5oYXNoX3NpemU7bj1lLmhlYWRbLS10XSxlLmhlYWRbdF09Zjw9bj9uLWY6MCwtLXI7KTtmb3IodD1yPWY7bj1lLnByZXZbLS10XSxlLnByZXZbdF09Zjw9bj9uLWY6MCwtLXI7KTtpKz1mfWlmKDA9PT1lLnN0cm0uYXZhaWxfaW4pYnJlYWs7aWYoYT1lLnN0cm0sbz1lLndpbmRvdyxoPWUuc3Ryc3RhcnQrZS5sb29rYWhlYWQsdT1pLGw9dm9pZCAwLGw9YS5hdmFpbF9pbix1PGwmJihsPXUpLHI9MD09PWw/MDooYS5hdmFpbF9pbi09bCxjLmFycmF5U2V0KG8sYS5pbnB1dCxhLm5leHRfaW4sbCxoKSwxPT09YS5zdGF0ZS53cmFwP2EuYWRsZXI9ZChhLmFkbGVyLG8sbCxoKToyPT09YS5zdGF0ZS53cmFwJiYoYS5hZGxlcj1wKGEuYWRsZXIsbyxsLGgpKSxhLm5leHRfaW4rPWwsYS50b3RhbF9pbis9bCxsKSxlLmxvb2thaGVhZCs9cixlLmxvb2thaGVhZCtlLmluc2VydD49eClmb3Iocz1lLnN0cnN0YXJ0LWUuaW5zZXJ0LGUuaW5zX2g9ZS53aW5kb3dbc10sZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W3MrMV0pJmUuaGFzaF9tYXNrO2UuaW5zZXJ0JiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W3MreC0xXSkmZS5oYXNoX21hc2ssZS5wcmV2W3MmZS53X21hc2tdPWUuaGVhZFtlLmluc19oXSxlLmhlYWRbZS5pbnNfaF09cyxzKyssZS5pbnNlcnQtLSwhKGUubG9va2FoZWFkK2UuaW5zZXJ0PHgpKTspO313aGlsZShlLmxvb2thaGVhZDx6JiYwIT09ZS5zdHJtLmF2YWlsX2luKX1mdW5jdGlvbiBaKGUsdCl7Zm9yKHZhciByLG47Oyl7aWYoZS5sb29rYWhlYWQ8eil7aWYoaihlKSxlLmxvb2thaGVhZDx6JiZ0PT09bClyZXR1cm4gQTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9aWYocj0wLGUubG9va2FoZWFkPj14JiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W2Uuc3Ryc3RhcnQreC0xXSkmZS5oYXNoX21hc2sscj1lLnByZXZbZS5zdHJzdGFydCZlLndfbWFza109ZS5oZWFkW2UuaW5zX2hdLGUuaGVhZFtlLmluc19oXT1lLnN0cnN0YXJ0KSwwIT09ciYmZS5zdHJzdGFydC1yPD1lLndfc2l6ZS16JiYoZS5tYXRjaF9sZW5ndGg9TChlLHIpKSxlLm1hdGNoX2xlbmd0aD49eClpZihuPXUuX3RyX3RhbGx5KGUsZS5zdHJzdGFydC1lLm1hdGNoX3N0YXJ0LGUubWF0Y2hfbGVuZ3RoLXgpLGUubG9va2FoZWFkLT1lLm1hdGNoX2xlbmd0aCxlLm1hdGNoX2xlbmd0aDw9ZS5tYXhfbGF6eV9tYXRjaCYmZS5sb29rYWhlYWQ+PXgpe2ZvcihlLm1hdGNoX2xlbmd0aC0tO2Uuc3Ryc3RhcnQrKyxlLmluc19oPShlLmluc19oPDxlLmhhc2hfc2hpZnReZS53aW5kb3dbZS5zdHJzdGFydCt4LTFdKSZlLmhhc2hfbWFzayxyPWUucHJldltlLnN0cnN0YXJ0JmUud19tYXNrXT1lLmhlYWRbZS5pbnNfaF0sZS5oZWFkW2UuaW5zX2hdPWUuc3Ryc3RhcnQsMCE9LS1lLm1hdGNoX2xlbmd0aDspO2Uuc3Ryc3RhcnQrK31lbHNlIGUuc3Ryc3RhcnQrPWUubWF0Y2hfbGVuZ3RoLGUubWF0Y2hfbGVuZ3RoPTAsZS5pbnNfaD1lLndpbmRvd1tlLnN0cnN0YXJ0XSxlLmluc19oPShlLmluc19oPDxlLmhhc2hfc2hpZnReZS53aW5kb3dbZS5zdHJzdGFydCsxXSkmZS5oYXNoX21hc2s7ZWxzZSBuPXUuX3RyX3RhbGx5KGUsMCxlLndpbmRvd1tlLnN0cnN0YXJ0XSksZS5sb29rYWhlYWQtLSxlLnN0cnN0YXJ0Kys7aWYobiYmKE4oZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiBlLmluc2VydD1lLnN0cnN0YXJ0PHgtMT9lLnN0cnN0YXJ0OngtMSx0PT09Zj8oTihlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD9POkIpOmUubGFzdF9saXQmJihOKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KT9BOkl9ZnVuY3Rpb24gVyhlLHQpe2Zvcih2YXIgcixuLGk7Oyl7aWYoZS5sb29rYWhlYWQ8eil7aWYoaihlKSxlLmxvb2thaGVhZDx6JiZ0PT09bClyZXR1cm4gQTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9aWYocj0wLGUubG9va2FoZWFkPj14JiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W2Uuc3Ryc3RhcnQreC0xXSkmZS5oYXNoX21hc2sscj1lLnByZXZbZS5zdHJzdGFydCZlLndfbWFza109ZS5oZWFkW2UuaW5zX2hdLGUuaGVhZFtlLmluc19oXT1lLnN0cnN0YXJ0KSxlLnByZXZfbGVuZ3RoPWUubWF0Y2hfbGVuZ3RoLGUucHJldl9tYXRjaD1lLm1hdGNoX3N0YXJ0LGUubWF0Y2hfbGVuZ3RoPXgtMSwwIT09ciYmZS5wcmV2X2xlbmd0aDxlLm1heF9sYXp5X21hdGNoJiZlLnN0cnN0YXJ0LXI8PWUud19zaXplLXomJihlLm1hdGNoX2xlbmd0aD1MKGUsciksZS5tYXRjaF9sZW5ndGg8PTUmJigxPT09ZS5zdHJhdGVneXx8ZS5tYXRjaF9sZW5ndGg9PT14JiY0MDk2PGUuc3Ryc3RhcnQtZS5tYXRjaF9zdGFydCkmJihlLm1hdGNoX2xlbmd0aD14LTEpKSxlLnByZXZfbGVuZ3RoPj14JiZlLm1hdGNoX2xlbmd0aDw9ZS5wcmV2X2xlbmd0aCl7Zm9yKGk9ZS5zdHJzdGFydCtlLmxvb2thaGVhZC14LG49dS5fdHJfdGFsbHkoZSxlLnN0cnN0YXJ0LTEtZS5wcmV2X21hdGNoLGUucHJldl9sZW5ndGgteCksZS5sb29rYWhlYWQtPWUucHJldl9sZW5ndGgtMSxlLnByZXZfbGVuZ3RoLT0yOysrZS5zdHJzdGFydDw9aSYmKGUuaW5zX2g9KGUuaW5zX2g8PGUuaGFzaF9zaGlmdF5lLndpbmRvd1tlLnN0cnN0YXJ0K3gtMV0pJmUuaGFzaF9tYXNrLHI9ZS5wcmV2W2Uuc3Ryc3RhcnQmZS53X21hc2tdPWUuaGVhZFtlLmluc19oXSxlLmhlYWRbZS5pbnNfaF09ZS5zdHJzdGFydCksMCE9LS1lLnByZXZfbGVuZ3RoOyk7aWYoZS5tYXRjaF9hdmFpbGFibGU9MCxlLm1hdGNoX2xlbmd0aD14LTEsZS5zdHJzdGFydCsrLG4mJihOKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1lbHNlIGlmKGUubWF0Y2hfYXZhaWxhYmxlKXtpZigobj11Ll90cl90YWxseShlLDAsZS53aW5kb3dbZS5zdHJzdGFydC0xXSkpJiZOKGUsITEpLGUuc3Ryc3RhcnQrKyxlLmxvb2thaGVhZC0tLDA9PT1lLnN0cm0uYXZhaWxfb3V0KXJldHVybiBBfWVsc2UgZS5tYXRjaF9hdmFpbGFibGU9MSxlLnN0cnN0YXJ0KyssZS5sb29rYWhlYWQtLX1yZXR1cm4gZS5tYXRjaF9hdmFpbGFibGUmJihuPXUuX3RyX3RhbGx5KGUsMCxlLndpbmRvd1tlLnN0cnN0YXJ0LTFdKSxlLm1hdGNoX2F2YWlsYWJsZT0wKSxlLmluc2VydD1lLnN0cnN0YXJ0PHgtMT9lLnN0cnN0YXJ0OngtMSx0PT09Zj8oTihlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD9POkIpOmUubGFzdF9saXQmJihOKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KT9BOkl9ZnVuY3Rpb24gTShlLHQscixuLGkpe3RoaXMuZ29vZF9sZW5ndGg9ZSx0aGlzLm1heF9sYXp5PXQsdGhpcy5uaWNlX2xlbmd0aD1yLHRoaXMubWF4X2NoYWluPW4sdGhpcy5mdW5jPWl9ZnVuY3Rpb24gSCgpe3RoaXMuc3RybT1udWxsLHRoaXMuc3RhdHVzPTAsdGhpcy5wZW5kaW5nX2J1Zj1udWxsLHRoaXMucGVuZGluZ19idWZfc2l6ZT0wLHRoaXMucGVuZGluZ19vdXQ9MCx0aGlzLnBlbmRpbmc9MCx0aGlzLndyYXA9MCx0aGlzLmd6aGVhZD1udWxsLHRoaXMuZ3ppbmRleD0wLHRoaXMubWV0aG9kPXYsdGhpcy5sYXN0X2ZsdXNoPS0xLHRoaXMud19zaXplPTAsdGhpcy53X2JpdHM9MCx0aGlzLndfbWFzaz0wLHRoaXMud2luZG93PW51bGwsdGhpcy53aW5kb3dfc2l6ZT0wLHRoaXMucHJldj1udWxsLHRoaXMuaGVhZD1udWxsLHRoaXMuaW5zX2g9MCx0aGlzLmhhc2hfc2l6ZT0wLHRoaXMuaGFzaF9iaXRzPTAsdGhpcy5oYXNoX21hc2s9MCx0aGlzLmhhc2hfc2hpZnQ9MCx0aGlzLmJsb2NrX3N0YXJ0PTAsdGhpcy5tYXRjaF9sZW5ndGg9MCx0aGlzLnByZXZfbWF0Y2g9MCx0aGlzLm1hdGNoX2F2YWlsYWJsZT0wLHRoaXMuc3Ryc3RhcnQ9MCx0aGlzLm1hdGNoX3N0YXJ0PTAsdGhpcy5sb29rYWhlYWQ9MCx0aGlzLnByZXZfbGVuZ3RoPTAsdGhpcy5tYXhfY2hhaW5fbGVuZ3RoPTAsdGhpcy5tYXhfbGF6eV9tYXRjaD0wLHRoaXMubGV2ZWw9MCx0aGlzLnN0cmF0ZWd5PTAsdGhpcy5nb29kX21hdGNoPTAsdGhpcy5uaWNlX21hdGNoPTAsdGhpcy5keW5fbHRyZWU9bmV3IGMuQnVmMTYoMip3KSx0aGlzLmR5bl9kdHJlZT1uZXcgYy5CdWYxNigyKigyKmErMSkpLHRoaXMuYmxfdHJlZT1uZXcgYy5CdWYxNigyKigyKm8rMSkpLEQodGhpcy5keW5fbHRyZWUpLEQodGhpcy5keW5fZHRyZWUpLEQodGhpcy5ibF90cmVlKSx0aGlzLmxfZGVzYz1udWxsLHRoaXMuZF9kZXNjPW51bGwsdGhpcy5ibF9kZXNjPW51bGwsdGhpcy5ibF9jb3VudD1uZXcgYy5CdWYxNihrKzEpLHRoaXMuaGVhcD1uZXcgYy5CdWYxNigyKnMrMSksRCh0aGlzLmhlYXApLHRoaXMuaGVhcF9sZW49MCx0aGlzLmhlYXBfbWF4PTAsdGhpcy5kZXB0aD1uZXcgYy5CdWYxNigyKnMrMSksRCh0aGlzLmRlcHRoKSx0aGlzLmxfYnVmPTAsdGhpcy5saXRfYnVmc2l6ZT0wLHRoaXMubGFzdF9saXQ9MCx0aGlzLmRfYnVmPTAsdGhpcy5vcHRfbGVuPTAsdGhpcy5zdGF0aWNfbGVuPTAsdGhpcy5tYXRjaGVzPTAsdGhpcy5pbnNlcnQ9MCx0aGlzLmJpX2J1Zj0wLHRoaXMuYmlfdmFsaWQ9MH1mdW5jdGlvbiBHKGUpe3ZhciB0O3JldHVybiBlJiZlLnN0YXRlPyhlLnRvdGFsX2luPWUudG90YWxfb3V0PTAsZS5kYXRhX3R5cGU9aSwodD1lLnN0YXRlKS5wZW5kaW5nPTAsdC5wZW5kaW5nX291dD0wLHQud3JhcDwwJiYodC53cmFwPS10LndyYXApLHQuc3RhdHVzPXQud3JhcD9DOkUsZS5hZGxlcj0yPT09dC53cmFwPzA6MSx0Lmxhc3RfZmx1c2g9bCx1Ll90cl9pbml0KHQpLG0pOlIoZSxfKX1mdW5jdGlvbiBLKGUpe3ZhciB0PUcoZSk7cmV0dXJuIHQ9PT1tJiZmdW5jdGlvbihlKXtlLndpbmRvd19zaXplPTIqZS53X3NpemUsRChlLmhlYWQpLGUubWF4X2xhenlfbWF0Y2g9aFtlLmxldmVsXS5tYXhfbGF6eSxlLmdvb2RfbWF0Y2g9aFtlLmxldmVsXS5nb29kX2xlbmd0aCxlLm5pY2VfbWF0Y2g9aFtlLmxldmVsXS5uaWNlX2xlbmd0aCxlLm1heF9jaGFpbl9sZW5ndGg9aFtlLmxldmVsXS5tYXhfY2hhaW4sZS5zdHJzdGFydD0wLGUuYmxvY2tfc3RhcnQ9MCxlLmxvb2thaGVhZD0wLGUuaW5zZXJ0PTAsZS5tYXRjaF9sZW5ndGg9ZS5wcmV2X2xlbmd0aD14LTEsZS5tYXRjaF9hdmFpbGFibGU9MCxlLmluc19oPTB9KGUuc3RhdGUpLHR9ZnVuY3Rpb24gWShlLHQscixuLGkscyl7aWYoIWUpcmV0dXJuIF87dmFyIGE9MTtpZih0PT09ZyYmKHQ9NiksbjwwPyhhPTAsbj0tbik6MTU8biYmKGE9MixuLT0xNiksaTwxfHx5PGl8fHIhPT12fHxuPDh8fDE1PG58fHQ8MHx8OTx0fHxzPDB8fGI8cylyZXR1cm4gUihlLF8pOzg9PT1uJiYobj05KTt2YXIgbz1uZXcgSDtyZXR1cm4oZS5zdGF0ZT1vKS5zdHJtPWUsby53cmFwPWEsby5nemhlYWQ9bnVsbCxvLndfYml0cz1uLG8ud19zaXplPTE8PG8ud19iaXRzLG8ud19tYXNrPW8ud19zaXplLTEsby5oYXNoX2JpdHM9aSs3LG8uaGFzaF9zaXplPTE8PG8uaGFzaF9iaXRzLG8uaGFzaF9tYXNrPW8uaGFzaF9zaXplLTEsby5oYXNoX3NoaWZ0PX5+KChvLmhhc2hfYml0cyt4LTEpL3gpLG8ud2luZG93PW5ldyBjLkJ1ZjgoMipvLndfc2l6ZSksby5oZWFkPW5ldyBjLkJ1ZjE2KG8uaGFzaF9zaXplKSxvLnByZXY9bmV3IGMuQnVmMTYoby53X3NpemUpLG8ubGl0X2J1ZnNpemU9MTw8aSs2LG8ucGVuZGluZ19idWZfc2l6ZT00Km8ubGl0X2J1ZnNpemUsby5wZW5kaW5nX2J1Zj1uZXcgYy5CdWY4KG8ucGVuZGluZ19idWZfc2l6ZSksby5kX2J1Zj0xKm8ubGl0X2J1ZnNpemUsby5sX2J1Zj0zKm8ubGl0X2J1ZnNpemUsby5sZXZlbD10LG8uc3RyYXRlZ3k9cyxvLm1ldGhvZD1yLEsoZSl9aD1bbmV3IE0oMCwwLDAsMCxmdW5jdGlvbihlLHQpe3ZhciByPTY1NTM1O2ZvcihyPmUucGVuZGluZ19idWZfc2l6ZS01JiYocj1lLnBlbmRpbmdfYnVmX3NpemUtNSk7Oyl7aWYoZS5sb29rYWhlYWQ8PTEpe2lmKGooZSksMD09PWUubG9va2FoZWFkJiZ0PT09bClyZXR1cm4gQTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9ZS5zdHJzdGFydCs9ZS5sb29rYWhlYWQsZS5sb29rYWhlYWQ9MDt2YXIgbj1lLmJsb2NrX3N0YXJ0K3I7aWYoKDA9PT1lLnN0cnN0YXJ0fHxlLnN0cnN0YXJ0Pj1uKSYmKGUubG9va2FoZWFkPWUuc3Ryc3RhcnQtbixlLnN0cnN0YXJ0PW4sTihlLCExKSwwPT09ZS5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEE7aWYoZS5zdHJzdGFydC1lLmJsb2NrX3N0YXJ0Pj1lLndfc2l6ZS16JiYoTihlLCExKSwwPT09ZS5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9cmV0dXJuIGUuaW5zZXJ0PTAsdD09PWY/KE4oZSwhMCksMD09PWUuc3RybS5hdmFpbF9vdXQ/TzpCKTooZS5zdHJzdGFydD5lLmJsb2NrX3N0YXJ0JiYoTihlLCExKSxlLnN0cm0uYXZhaWxfb3V0KSxBKX0pLG5ldyBNKDQsNCw4LDQsWiksbmV3IE0oNCw1LDE2LDgsWiksbmV3IE0oNCw2LDMyLDMyLFopLG5ldyBNKDQsNCwxNiwxNixXKSxuZXcgTSg4LDE2LDMyLDMyLFcpLG5ldyBNKDgsMTYsMTI4LDEyOCxXKSxuZXcgTSg4LDMyLDEyOCwyNTYsVyksbmV3IE0oMzIsMTI4LDI1OCwxMDI0LFcpLG5ldyBNKDMyLDI1OCwyNTgsNDA5NixXKV0sci5kZWZsYXRlSW5pdD1mdW5jdGlvbihlLHQpe3JldHVybiBZKGUsdCx2LDE1LDgsMCl9LHIuZGVmbGF0ZUluaXQyPVksci5kZWZsYXRlUmVzZXQ9SyxyLmRlZmxhdGVSZXNldEtlZXA9RyxyLmRlZmxhdGVTZXRIZWFkZXI9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZSYmZS5zdGF0ZT8yIT09ZS5zdGF0ZS53cmFwP186KGUuc3RhdGUuZ3poZWFkPXQsbSk6X30sci5kZWZsYXRlPWZ1bmN0aW9uKGUsdCl7dmFyIHIsbixpLHM7aWYoIWV8fCFlLnN0YXRlfHw1PHR8fHQ8MClyZXR1cm4gZT9SKGUsXyk6XztpZihuPWUuc3RhdGUsIWUub3V0cHV0fHwhZS5pbnB1dCYmMCE9PWUuYXZhaWxfaW58fDY2Nj09PW4uc3RhdHVzJiZ0IT09ZilyZXR1cm4gUihlLDA9PT1lLmF2YWlsX291dD8tNTpfKTtpZihuLnN0cm09ZSxyPW4ubGFzdF9mbHVzaCxuLmxhc3RfZmx1c2g9dCxuLnN0YXR1cz09PUMpaWYoMj09PW4ud3JhcCllLmFkbGVyPTAsVShuLDMxKSxVKG4sMTM5KSxVKG4sOCksbi5nemhlYWQ/KFUobiwobi5nemhlYWQudGV4dD8xOjApKyhuLmd6aGVhZC5oY3JjPzI6MCkrKG4uZ3poZWFkLmV4dHJhPzQ6MCkrKG4uZ3poZWFkLm5hbWU/ODowKSsobi5nemhlYWQuY29tbWVudD8xNjowKSksVShuLDI1NSZuLmd6aGVhZC50aW1lKSxVKG4sbi5nemhlYWQudGltZT4+OCYyNTUpLFUobixuLmd6aGVhZC50aW1lPj4xNiYyNTUpLFUobixuLmd6aGVhZC50aW1lPj4yNCYyNTUpLFUobiw5PT09bi5sZXZlbD8yOjI8PW4uc3RyYXRlZ3l8fG4ubGV2ZWw8Mj80OjApLFUobiwyNTUmbi5nemhlYWQub3MpLG4uZ3poZWFkLmV4dHJhJiZuLmd6aGVhZC5leHRyYS5sZW5ndGgmJihVKG4sMjU1Jm4uZ3poZWFkLmV4dHJhLmxlbmd0aCksVShuLG4uZ3poZWFkLmV4dHJhLmxlbmd0aD4+OCYyNTUpKSxuLmd6aGVhZC5oY3JjJiYoZS5hZGxlcj1wKGUuYWRsZXIsbi5wZW5kaW5nX2J1ZixuLnBlbmRpbmcsMCkpLG4uZ3ppbmRleD0wLG4uc3RhdHVzPTY5KTooVShuLDApLFUobiwwKSxVKG4sMCksVShuLDApLFUobiwwKSxVKG4sOT09PW4ubGV2ZWw/MjoyPD1uLnN0cmF0ZWd5fHxuLmxldmVsPDI/NDowKSxVKG4sMyksbi5zdGF0dXM9RSk7ZWxzZXt2YXIgYT12KyhuLndfYml0cy04PDw0KTw8ODthfD0oMjw9bi5zdHJhdGVneXx8bi5sZXZlbDwyPzA6bi5sZXZlbDw2PzE6Nj09PW4ubGV2ZWw/MjozKTw8NiwwIT09bi5zdHJzdGFydCYmKGF8PTMyKSxhKz0zMS1hJTMxLG4uc3RhdHVzPUUsUChuLGEpLDAhPT1uLnN0cnN0YXJ0JiYoUChuLGUuYWRsZXI+Pj4xNiksUChuLDY1NTM1JmUuYWRsZXIpKSxlLmFkbGVyPTF9aWYoNjk9PT1uLnN0YXR1cylpZihuLmd6aGVhZC5leHRyYSl7Zm9yKGk9bi5wZW5kaW5nO24uZ3ppbmRleDwoNjU1MzUmbi5nemhlYWQuZXh0cmEubGVuZ3RoKSYmKG4ucGVuZGluZyE9PW4ucGVuZGluZ19idWZfc2l6ZXx8KG4uZ3poZWFkLmhjcmMmJm4ucGVuZGluZz5pJiYoZS5hZGxlcj1wKGUuYWRsZXIsbi5wZW5kaW5nX2J1ZixuLnBlbmRpbmctaSxpKSksRihlKSxpPW4ucGVuZGluZyxuLnBlbmRpbmchPT1uLnBlbmRpbmdfYnVmX3NpemUpKTspVShuLDI1NSZuLmd6aGVhZC5leHRyYVtuLmd6aW5kZXhdKSxuLmd6aW5kZXgrKztuLmd6aGVhZC5oY3JjJiZuLnBlbmRpbmc+aSYmKGUuYWRsZXI9cChlLmFkbGVyLG4ucGVuZGluZ19idWYsbi5wZW5kaW5nLWksaSkpLG4uZ3ppbmRleD09PW4uZ3poZWFkLmV4dHJhLmxlbmd0aCYmKG4uZ3ppbmRleD0wLG4uc3RhdHVzPTczKX1lbHNlIG4uc3RhdHVzPTczO2lmKDczPT09bi5zdGF0dXMpaWYobi5nemhlYWQubmFtZSl7aT1uLnBlbmRpbmc7ZG97aWYobi5wZW5kaW5nPT09bi5wZW5kaW5nX2J1Zl9zaXplJiYobi5nemhlYWQuaGNyYyYmbi5wZW5kaW5nPmkmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZy1pLGkpKSxGKGUpLGk9bi5wZW5kaW5nLG4ucGVuZGluZz09PW4ucGVuZGluZ19idWZfc2l6ZSkpe3M9MTticmVha31zPW4uZ3ppbmRleDxuLmd6aGVhZC5uYW1lLmxlbmd0aD8yNTUmbi5nemhlYWQubmFtZS5jaGFyQ29kZUF0KG4uZ3ppbmRleCsrKTowLFUobixzKX13aGlsZSgwIT09cyk7bi5nemhlYWQuaGNyYyYmbi5wZW5kaW5nPmkmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZy1pLGkpKSwwPT09cyYmKG4uZ3ppbmRleD0wLG4uc3RhdHVzPTkxKX1lbHNlIG4uc3RhdHVzPTkxO2lmKDkxPT09bi5zdGF0dXMpaWYobi5nemhlYWQuY29tbWVudCl7aT1uLnBlbmRpbmc7ZG97aWYobi5wZW5kaW5nPT09bi5wZW5kaW5nX2J1Zl9zaXplJiYobi5nemhlYWQuaGNyYyYmbi5wZW5kaW5nPmkmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZy1pLGkpKSxGKGUpLGk9bi5wZW5kaW5nLG4ucGVuZGluZz09PW4ucGVuZGluZ19idWZfc2l6ZSkpe3M9MTticmVha31zPW4uZ3ppbmRleDxuLmd6aGVhZC5jb21tZW50Lmxlbmd0aD8yNTUmbi5nemhlYWQuY29tbWVudC5jaGFyQ29kZUF0KG4uZ3ppbmRleCsrKTowLFUobixzKX13aGlsZSgwIT09cyk7bi5nemhlYWQuaGNyYyYmbi5wZW5kaW5nPmkmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZy1pLGkpKSwwPT09cyYmKG4uc3RhdHVzPTEwMyl9ZWxzZSBuLnN0YXR1cz0xMDM7aWYoMTAzPT09bi5zdGF0dXMmJihuLmd6aGVhZC5oY3JjPyhuLnBlbmRpbmcrMj5uLnBlbmRpbmdfYnVmX3NpemUmJkYoZSksbi5wZW5kaW5nKzI8PW4ucGVuZGluZ19idWZfc2l6ZSYmKFUobiwyNTUmZS5hZGxlciksVShuLGUuYWRsZXI+PjgmMjU1KSxlLmFkbGVyPTAsbi5zdGF0dXM9RSkpOm4uc3RhdHVzPUUpLDAhPT1uLnBlbmRpbmcpe2lmKEYoZSksMD09PWUuYXZhaWxfb3V0KXJldHVybiBuLmxhc3RfZmx1c2g9LTEsbX1lbHNlIGlmKDA9PT1lLmF2YWlsX2luJiZUKHQpPD1UKHIpJiZ0IT09ZilyZXR1cm4gUihlLC01KTtpZig2NjY9PT1uLnN0YXR1cyYmMCE9PWUuYXZhaWxfaW4pcmV0dXJuIFIoZSwtNSk7aWYoMCE9PWUuYXZhaWxfaW58fDAhPT1uLmxvb2thaGVhZHx8dCE9PWwmJjY2NiE9PW4uc3RhdHVzKXt2YXIgbz0yPT09bi5zdHJhdGVneT9mdW5jdGlvbihlLHQpe2Zvcih2YXIgcjs7KXtpZigwPT09ZS5sb29rYWhlYWQmJihqKGUpLDA9PT1lLmxvb2thaGVhZCkpe2lmKHQ9PT1sKXJldHVybiBBO2JyZWFrfWlmKGUubWF0Y2hfbGVuZ3RoPTAscj11Ll90cl90YWxseShlLDAsZS53aW5kb3dbZS5zdHJzdGFydF0pLGUubG9va2FoZWFkLS0sZS5zdHJzdGFydCsrLHImJihOKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1yZXR1cm4gZS5pbnNlcnQ9MCx0PT09Zj8oTihlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD9POkIpOmUubGFzdF9saXQmJihOKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KT9BOkl9KG4sdCk6Mz09PW4uc3RyYXRlZ3k/ZnVuY3Rpb24oZSx0KXtmb3IodmFyIHIsbixpLHMsYT1lLndpbmRvdzs7KXtpZihlLmxvb2thaGVhZDw9Uyl7aWYoaihlKSxlLmxvb2thaGVhZDw9UyYmdD09PWwpcmV0dXJuIEE7aWYoMD09PWUubG9va2FoZWFkKWJyZWFrfWlmKGUubWF0Y2hfbGVuZ3RoPTAsZS5sb29rYWhlYWQ+PXgmJjA8ZS5zdHJzdGFydCYmKG49YVtpPWUuc3Ryc3RhcnQtMV0pPT09YVsrK2ldJiZuPT09YVsrK2ldJiZuPT09YVsrK2ldKXtzPWUuc3Ryc3RhcnQrUztkb3t9d2hpbGUobj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmbj09PWFbKytpXSYmaTxzKTtlLm1hdGNoX2xlbmd0aD1TLShzLWkpLGUubWF0Y2hfbGVuZ3RoPmUubG9va2FoZWFkJiYoZS5tYXRjaF9sZW5ndGg9ZS5sb29rYWhlYWQpfWlmKGUubWF0Y2hfbGVuZ3RoPj14PyhyPXUuX3RyX3RhbGx5KGUsMSxlLm1hdGNoX2xlbmd0aC14KSxlLmxvb2thaGVhZC09ZS5tYXRjaF9sZW5ndGgsZS5zdHJzdGFydCs9ZS5tYXRjaF9sZW5ndGgsZS5tYXRjaF9sZW5ndGg9MCk6KHI9dS5fdHJfdGFsbHkoZSwwLGUud2luZG93W2Uuc3Ryc3RhcnRdKSxlLmxvb2thaGVhZC0tLGUuc3Ryc3RhcnQrKyksciYmKE4oZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiBlLmluc2VydD0wLHQ9PT1mPyhOKGUsITApLDA9PT1lLnN0cm0uYXZhaWxfb3V0P086Qik6ZS5sYXN0X2xpdCYmKE4oZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpP0E6SX0obix0KTpoW24ubGV2ZWxdLmZ1bmMobix0KTtpZihvIT09TyYmbyE9PUJ8fChuLnN0YXR1cz02NjYpLG89PT1BfHxvPT09TylyZXR1cm4gMD09PWUuYXZhaWxfb3V0JiYobi5sYXN0X2ZsdXNoPS0xKSxtO2lmKG89PT1JJiYoMT09PXQ/dS5fdHJfYWxpZ24obik6NSE9PXQmJih1Ll90cl9zdG9yZWRfYmxvY2sobiwwLDAsITEpLDM9PT10JiYoRChuLmhlYWQpLDA9PT1uLmxvb2thaGVhZCYmKG4uc3Ryc3RhcnQ9MCxuLmJsb2NrX3N0YXJ0PTAsbi5pbnNlcnQ9MCkpKSxGKGUpLDA9PT1lLmF2YWlsX291dCkpcmV0dXJuIG4ubGFzdF9mbHVzaD0tMSxtfXJldHVybiB0IT09Zj9tOm4ud3JhcDw9MD8xOigyPT09bi53cmFwPyhVKG4sMjU1JmUuYWRsZXIpLFUobixlLmFkbGVyPj44JjI1NSksVShuLGUuYWRsZXI+PjE2JjI1NSksVShuLGUuYWRsZXI+PjI0JjI1NSksVShuLDI1NSZlLnRvdGFsX2luKSxVKG4sZS50b3RhbF9pbj4+OCYyNTUpLFUobixlLnRvdGFsX2luPj4xNiYyNTUpLFUobixlLnRvdGFsX2luPj4yNCYyNTUpKTooUChuLGUuYWRsZXI+Pj4xNiksUChuLDY1NTM1JmUuYWRsZXIpKSxGKGUpLDA8bi53cmFwJiYobi53cmFwPS1uLndyYXApLDAhPT1uLnBlbmRpbmc/bToxKX0sci5kZWZsYXRlRW5kPWZ1bmN0aW9uKGUpe3ZhciB0O3JldHVybiBlJiZlLnN0YXRlPyh0PWUuc3RhdGUuc3RhdHVzKSE9PUMmJjY5IT09dCYmNzMhPT10JiY5MSE9PXQmJjEwMyE9PXQmJnQhPT1FJiY2NjYhPT10P1IoZSxfKTooZS5zdGF0ZT1udWxsLHQ9PT1FP1IoZSwtMyk6bSk6X30sci5kZWZsYXRlU2V0RGljdGlvbmFyeT1mdW5jdGlvbihlLHQpe3ZhciByLG4saSxzLGEsbyxoLHUsbD10Lmxlbmd0aDtpZighZXx8IWUuc3RhdGUpcmV0dXJuIF87aWYoMj09PShzPShyPWUuc3RhdGUpLndyYXApfHwxPT09cyYmci5zdGF0dXMhPT1DfHxyLmxvb2thaGVhZClyZXR1cm4gXztmb3IoMT09PXMmJihlLmFkbGVyPWQoZS5hZGxlcix0LGwsMCkpLHIud3JhcD0wLGw+PXIud19zaXplJiYoMD09PXMmJihEKHIuaGVhZCksci5zdHJzdGFydD0wLHIuYmxvY2tfc3RhcnQ9MCxyLmluc2VydD0wKSx1PW5ldyBjLkJ1Zjgoci53X3NpemUpLGMuYXJyYXlTZXQodSx0LGwtci53X3NpemUsci53X3NpemUsMCksdD11LGw9ci53X3NpemUpLGE9ZS5hdmFpbF9pbixvPWUubmV4dF9pbixoPWUuaW5wdXQsZS5hdmFpbF9pbj1sLGUubmV4dF9pbj0wLGUuaW5wdXQ9dCxqKHIpO3IubG9va2FoZWFkPj14Oyl7Zm9yKG49ci5zdHJzdGFydCxpPXIubG9va2FoZWFkLSh4LTEpO3IuaW5zX2g9KHIuaW5zX2g8PHIuaGFzaF9zaGlmdF5yLndpbmRvd1tuK3gtMV0pJnIuaGFzaF9tYXNrLHIucHJldltuJnIud19tYXNrXT1yLmhlYWRbci5pbnNfaF0sci5oZWFkW3IuaW5zX2hdPW4sbisrLC0taTspO3Iuc3Ryc3RhcnQ9bixyLmxvb2thaGVhZD14LTEsaihyKX1yZXR1cm4gci5zdHJzdGFydCs9ci5sb29rYWhlYWQsci5ibG9ja19zdGFydD1yLnN0cnN0YXJ0LHIuaW5zZXJ0PXIubG9va2FoZWFkLHIubG9va2FoZWFkPTAsci5tYXRjaF9sZW5ndGg9ci5wcmV2X2xlbmd0aD14LTEsci5tYXRjaF9hdmFpbGFibGU9MCxlLm5leHRfaW49byxlLmlucHV0PWgsZS5hdmFpbF9pbj1hLHIud3JhcD1zLG19LHIuZGVmbGF0ZUluZm89InBha28gZGVmbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdCkifSx7Ii4uL3V0aWxzL2NvbW1vbiI6NDEsIi4vYWRsZXIzMiI6NDMsIi4vY3JjMzIiOjQ1LCIuL21lc3NhZ2VzIjo1MSwiLi90cmVlcyI6NTJ9XSw0NzpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt0LmV4cG9ydHM9ZnVuY3Rpb24oKXt0aGlzLnRleHQ9MCx0aGlzLnRpbWU9MCx0aGlzLnhmbGFncz0wLHRoaXMub3M9MCx0aGlzLmV4dHJhPW51bGwsdGhpcy5leHRyYV9sZW49MCx0aGlzLm5hbWU9IiIsdGhpcy5jb21tZW50PSIiLHRoaXMuaGNyYz0wLHRoaXMuZG9uZT0hMX19LHt9XSw0ODpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt0LmV4cG9ydHM9ZnVuY3Rpb24oZSx0KXt2YXIgcixuLGkscyxhLG8saCx1LGwsZixjLGQscCxtLF8sZyxiLHYseSx3LGsseCxTLHosQztyPWUuc3RhdGUsbj1lLm5leHRfaW4sej1lLmlucHV0LGk9bisoZS5hdmFpbF9pbi01KSxzPWUubmV4dF9vdXQsQz1lLm91dHB1dCxhPXMtKHQtZS5hdmFpbF9vdXQpLG89cysoZS5hdmFpbF9vdXQtMjU3KSxoPXIuZG1heCx1PXIud3NpemUsbD1yLndoYXZlLGY9ci53bmV4dCxjPXIud2luZG93LGQ9ci5ob2xkLHA9ci5iaXRzLG09ci5sZW5jb2RlLF89ci5kaXN0Y29kZSxnPSgxPDxyLmxlbmJpdHMpLTEsYj0oMTw8ci5kaXN0Yml0cyktMTtlOmRve3A8MTUmJihkKz16W24rK108PHAscCs9OCxkKz16W24rK108PHAscCs9OCksdj1tW2QmZ107dDpmb3IoOzspe2lmKGQ+Pj49eT12Pj4+MjQscC09eSwwPT09KHk9dj4+PjE2JjI1NSkpQ1tzKytdPTY1NTM1JnY7ZWxzZXtpZighKDE2JnkpKXtpZigwPT0oNjQmeSkpe3Y9bVsoNjU1MzUmdikrKGQmKDE8PHkpLTEpXTtjb250aW51ZSB0fWlmKDMyJnkpe3IubW9kZT0xMjticmVhayBlfWUubXNnPSJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGUiLHIubW9kZT0zMDticmVhayBlfXc9NjU1MzUmdiwoeSY9MTUpJiYocDx5JiYoZCs9eltuKytdPDxwLHArPTgpLHcrPWQmKDE8PHkpLTEsZD4+Pj15LHAtPXkpLHA8MTUmJihkKz16W24rK108PHAscCs9OCxkKz16W24rK108PHAscCs9OCksdj1fW2QmYl07cjpmb3IoOzspe2lmKGQ+Pj49eT12Pj4+MjQscC09eSwhKDE2Jih5PXY+Pj4xNiYyNTUpKSl7aWYoMD09KDY0JnkpKXt2PV9bKDY1NTM1JnYpKyhkJigxPDx5KS0xKV07Y29udGludWUgcn1lLm1zZz0iaW52YWxpZCBkaXN0YW5jZSBjb2RlIixyLm1vZGU9MzA7YnJlYWsgZX1pZihrPTY1NTM1JnYscDwoeSY9MTUpJiYoZCs9eltuKytdPDxwLChwKz04KTx5JiYoZCs9eltuKytdPDxwLHArPTgpKSxoPChrKz1kJigxPDx5KS0xKSl7ZS5tc2c9ImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrIixyLm1vZGU9MzA7YnJlYWsgZX1pZihkPj4+PXkscC09eSwoeT1zLWEpPGspe2lmKGw8KHk9ay15KSYmci5zYW5lKXtlLm1zZz0iaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2siLHIubW9kZT0zMDticmVhayBlfWlmKFM9YywoeD0wKT09PWYpe2lmKHgrPXUteSx5PHcpe2Zvcih3LT15O0NbcysrXT1jW3grK10sLS15Oyk7eD1zLWssUz1DfX1lbHNlIGlmKGY8eSl7aWYoeCs9dStmLXksKHktPWYpPHcpe2Zvcih3LT15O0NbcysrXT1jW3grK10sLS15Oyk7aWYoeD0wLGY8dyl7Zm9yKHctPXk9ZjtDW3MrK109Y1t4KytdLC0teTspO3g9cy1rLFM9Q319fWVsc2UgaWYoeCs9Zi15LHk8dyl7Zm9yKHctPXk7Q1tzKytdPWNbeCsrXSwtLXk7KTt4PXMtayxTPUN9Zm9yKDsyPHc7KUNbcysrXT1TW3grK10sQ1tzKytdPVNbeCsrXSxDW3MrK109U1t4KytdLHctPTM7dyYmKENbcysrXT1TW3grK10sMTx3JiYoQ1tzKytdPVNbeCsrXSkpfWVsc2V7Zm9yKHg9cy1rO0NbcysrXT1DW3grK10sQ1tzKytdPUNbeCsrXSxDW3MrK109Q1t4KytdLDI8KHctPTMpOyk7dyYmKENbcysrXT1DW3grK10sMTx3JiYoQ1tzKytdPUNbeCsrXSkpfWJyZWFrfX1icmVha319d2hpbGUobjxpJiZzPG8pO24tPXc9cD4+MyxkJj0oMTw8KHAtPXc8PDMpKS0xLGUubmV4dF9pbj1uLGUubmV4dF9vdXQ9cyxlLmF2YWlsX2luPW48aT9pLW4rNTo1LShuLWkpLGUuYXZhaWxfb3V0PXM8bz9vLXMrMjU3OjI1Ny0ocy1vKSxyLmhvbGQ9ZCxyLmJpdHM9cH19LHt9XSw0OTpbZnVuY3Rpb24oZSx0LHIpeyJ1c2Ugc3RyaWN0Ijt2YXIgST1lKCIuLi91dGlscy9jb21tb24iKSxPPWUoIi4vYWRsZXIzMiIpLEI9ZSgiLi9jcmMzMiIpLFI9ZSgiLi9pbmZmYXN0IiksVD1lKCIuL2luZnRyZWVzIiksRD0xLEY9MixOPTAsVT0tMixQPTEsbj04NTIsaT01OTI7ZnVuY3Rpb24gTChlKXtyZXR1cm4oZT4+PjI0JjI1NSkrKGU+Pj44JjY1MjgwKSsoKDY1MjgwJmUpPDw4KSsoKDI1NSZlKTw8MjQpfWZ1bmN0aW9uIHMoKXt0aGlzLm1vZGU9MCx0aGlzLmxhc3Q9ITEsdGhpcy53cmFwPTAsdGhpcy5oYXZlZGljdD0hMSx0aGlzLmZsYWdzPTAsdGhpcy5kbWF4PTAsdGhpcy5jaGVjaz0wLHRoaXMudG90YWw9MCx0aGlzLmhlYWQ9bnVsbCx0aGlzLndiaXRzPTAsdGhpcy53c2l6ZT0wLHRoaXMud2hhdmU9MCx0aGlzLnduZXh0PTAsdGhpcy53aW5kb3c9bnVsbCx0aGlzLmhvbGQ9MCx0aGlzLmJpdHM9MCx0aGlzLmxlbmd0aD0wLHRoaXMub2Zmc2V0PTAsdGhpcy5leHRyYT0wLHRoaXMubGVuY29kZT1udWxsLHRoaXMuZGlzdGNvZGU9bnVsbCx0aGlzLmxlbmJpdHM9MCx0aGlzLmRpc3RiaXRzPTAsdGhpcy5uY29kZT0wLHRoaXMubmxlbj0wLHRoaXMubmRpc3Q9MCx0aGlzLmhhdmU9MCx0aGlzLm5leHQ9bnVsbCx0aGlzLmxlbnM9bmV3IEkuQnVmMTYoMzIwKSx0aGlzLndvcms9bmV3IEkuQnVmMTYoMjg4KSx0aGlzLmxlbmR5bj1udWxsLHRoaXMuZGlzdGR5bj1udWxsLHRoaXMuc2FuZT0wLHRoaXMuYmFjaz0wLHRoaXMud2FzPTB9ZnVuY3Rpb24gYShlKXt2YXIgdDtyZXR1cm4gZSYmZS5zdGF0ZT8odD1lLnN0YXRlLGUudG90YWxfaW49ZS50b3RhbF9vdXQ9dC50b3RhbD0wLGUubXNnPSIiLHQud3JhcCYmKGUuYWRsZXI9MSZ0LndyYXApLHQubW9kZT1QLHQubGFzdD0wLHQuaGF2ZWRpY3Q9MCx0LmRtYXg9MzI3NjgsdC5oZWFkPW51bGwsdC5ob2xkPTAsdC5iaXRzPTAsdC5sZW5jb2RlPXQubGVuZHluPW5ldyBJLkJ1ZjMyKG4pLHQuZGlzdGNvZGU9dC5kaXN0ZHluPW5ldyBJLkJ1ZjMyKGkpLHQuc2FuZT0xLHQuYmFjaz0tMSxOKTpVfWZ1bmN0aW9uIG8oZSl7dmFyIHQ7cmV0dXJuIGUmJmUuc3RhdGU/KCh0PWUuc3RhdGUpLndzaXplPTAsdC53aGF2ZT0wLHQud25leHQ9MCxhKGUpKTpVfWZ1bmN0aW9uIGgoZSx0KXt2YXIgcixuO3JldHVybiBlJiZlLnN0YXRlPyhuPWUuc3RhdGUsdDwwPyhyPTAsdD0tdCk6KHI9MSsodD4+NCksdDw0OCYmKHQmPTE1KSksdCYmKHQ8OHx8MTU8dCk/VToobnVsbCE9PW4ud2luZG93JiZuLndiaXRzIT09dCYmKG4ud2luZG93PW51bGwpLG4ud3JhcD1yLG4ud2JpdHM9dCxvKGUpKSk6VX1mdW5jdGlvbiB1KGUsdCl7dmFyIHIsbjtyZXR1cm4gZT8obj1uZXcgcywoZS5zdGF0ZT1uKS53aW5kb3c9bnVsbCwocj1oKGUsdCkpIT09TiYmKGUuc3RhdGU9bnVsbCkscik6VX12YXIgbCxmLGM9ITA7ZnVuY3Rpb24gaihlKXtpZihjKXt2YXIgdDtmb3IobD1uZXcgSS5CdWYzMig1MTIpLGY9bmV3IEkuQnVmMzIoMzIpLHQ9MDt0PDE0NDspZS5sZW5zW3QrK109ODtmb3IoO3Q8MjU2OyllLmxlbnNbdCsrXT05O2Zvcig7dDwyODA7KWUubGVuc1t0KytdPTc7Zm9yKDt0PDI4ODspZS5sZW5zW3QrK109ODtmb3IoVChELGUubGVucywwLDI4OCxsLDAsZS53b3JrLHtiaXRzOjl9KSx0PTA7dDwzMjspZS5sZW5zW3QrK109NTtUKEYsZS5sZW5zLDAsMzIsZiwwLGUud29yayx7Yml0czo1fSksYz0hMX1lLmxlbmNvZGU9bCxlLmxlbmJpdHM9OSxlLmRpc3Rjb2RlPWYsZS5kaXN0Yml0cz01fWZ1bmN0aW9uIFooZSx0LHIsbil7dmFyIGkscz1lLnN0YXRlO3JldHVybiBudWxsPT09cy53aW5kb3cmJihzLndzaXplPTE8PHMud2JpdHMscy53bmV4dD0wLHMud2hhdmU9MCxzLndpbmRvdz1uZXcgSS5CdWY4KHMud3NpemUpKSxuPj1zLndzaXplPyhJLmFycmF5U2V0KHMud2luZG93LHQsci1zLndzaXplLHMud3NpemUsMCkscy53bmV4dD0wLHMud2hhdmU9cy53c2l6ZSk6KG48KGk9cy53c2l6ZS1zLnduZXh0KSYmKGk9biksSS5hcnJheVNldChzLndpbmRvdyx0LHItbixpLHMud25leHQpLChuLT1pKT8oSS5hcnJheVNldChzLndpbmRvdyx0LHItbixuLDApLHMud25leHQ9bixzLndoYXZlPXMud3NpemUpOihzLnduZXh0Kz1pLHMud25leHQ9PT1zLndzaXplJiYocy53bmV4dD0wKSxzLndoYXZlPHMud3NpemUmJihzLndoYXZlKz1pKSkpLDB9ci5pbmZsYXRlUmVzZXQ9byxyLmluZmxhdGVSZXNldDI9aCxyLmluZmxhdGVSZXNldEtlZXA9YSxyLmluZmxhdGVJbml0PWZ1bmN0aW9uKGUpe3JldHVybiB1KGUsMTUpfSxyLmluZmxhdGVJbml0Mj11LHIuaW5mbGF0ZT1mdW5jdGlvbihlLHQpe3ZhciByLG4saSxzLGEsbyxoLHUsbCxmLGMsZCxwLG0sXyxnLGIsdix5LHcsayx4LFMseixDPTAsRT1uZXcgSS5CdWY4KDQpLEE9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdO2lmKCFlfHwhZS5zdGF0ZXx8IWUub3V0cHV0fHwhZS5pbnB1dCYmMCE9PWUuYXZhaWxfaW4pcmV0dXJuIFU7MTI9PT0ocj1lLnN0YXRlKS5tb2RlJiYoci5tb2RlPTEzKSxhPWUubmV4dF9vdXQsaT1lLm91dHB1dCxoPWUuYXZhaWxfb3V0LHM9ZS5uZXh0X2luLG49ZS5pbnB1dCxvPWUuYXZhaWxfaW4sdT1yLmhvbGQsbD1yLmJpdHMsZj1vLGM9aCx4PU47ZTpmb3IoOzspc3dpdGNoKHIubW9kZSl7Y2FzZSBQOmlmKDA9PT1yLndyYXApe3IubW9kZT0xMzticmVha31mb3IoO2w8MTY7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1pZigyJnIud3JhcCYmMzU2MTU9PT11KXtFW3IuY2hlY2s9MF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApLGw9dT0wLHIubW9kZT0yO2JyZWFrfWlmKHIuZmxhZ3M9MCxyLmhlYWQmJihyLmhlYWQuZG9uZT0hMSksISgxJnIud3JhcCl8fCgoKDI1NSZ1KTw8OCkrKHU+PjgpKSUzMSl7ZS5tc2c9ImluY29ycmVjdCBoZWFkZXIgY2hlY2siLHIubW9kZT0zMDticmVha31pZig4IT0oMTUmdSkpe2UubXNnPSJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZCIsci5tb2RlPTMwO2JyZWFrfWlmKGwtPTQsaz04KygxNSYodT4+Pj00KSksMD09PXIud2JpdHMpci53Yml0cz1rO2Vsc2UgaWYoaz5yLndiaXRzKXtlLm1zZz0iaW52YWxpZCB3aW5kb3cgc2l6ZSIsci5tb2RlPTMwO2JyZWFrfXIuZG1heD0xPDxrLGUuYWRsZXI9ci5jaGVjaz0xLHIubW9kZT01MTImdT8xMDoxMixsPXU9MDticmVhaztjYXNlIDI6Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoci5mbGFncz11LDghPSgyNTUmci5mbGFncykpe2UubXNnPSJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZCIsci5tb2RlPTMwO2JyZWFrfWlmKDU3MzQ0JnIuZmxhZ3Mpe2UubXNnPSJ1bmtub3duIGhlYWRlciBmbGFncyBzZXQiLHIubW9kZT0zMDticmVha31yLmhlYWQmJihyLmhlYWQudGV4dD11Pj44JjEpLDUxMiZyLmZsYWdzJiYoRVswXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDIsMCkpLGw9dT0wLHIubW9kZT0zO2Nhc2UgMzpmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1yLmhlYWQmJihyLmhlYWQudGltZT11KSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsRVsyXT11Pj4+MTYmMjU1LEVbM109dT4+PjI0JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDQsMCkpLGw9dT0wLHIubW9kZT00O2Nhc2UgNDpmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1yLmhlYWQmJihyLmhlYWQueGZsYWdzPTI1NSZ1LHIuaGVhZC5vcz11Pj44KSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApKSxsPXU9MCxyLm1vZGU9NTtjYXNlIDU6aWYoMTAyNCZyLmZsYWdzKXtmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1yLmxlbmd0aD11LHIuaGVhZCYmKHIuaGVhZC5leHRyYV9sZW49dSksNTEyJnIuZmxhZ3MmJihFWzBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsMiwwKSksbD11PTB9ZWxzZSByLmhlYWQmJihyLmhlYWQuZXh0cmE9bnVsbCk7ci5tb2RlPTY7Y2FzZSA2OmlmKDEwMjQmci5mbGFncyYmKG88KGQ9ci5sZW5ndGgpJiYoZD1vKSxkJiYoci5oZWFkJiYoaz1yLmhlYWQuZXh0cmFfbGVuLXIubGVuZ3RoLHIuaGVhZC5leHRyYXx8KHIuaGVhZC5leHRyYT1uZXcgQXJyYXkoci5oZWFkLmV4dHJhX2xlbikpLEkuYXJyYXlTZXQoci5oZWFkLmV4dHJhLG4scyxkLGspKSw1MTImci5mbGFncyYmKHIuY2hlY2s9QihyLmNoZWNrLG4sZCxzKSksby09ZCxzKz1kLHIubGVuZ3RoLT1kKSxyLmxlbmd0aCkpYnJlYWsgZTtyLmxlbmd0aD0wLHIubW9kZT03O2Nhc2UgNzppZigyMDQ4JnIuZmxhZ3Mpe2lmKDA9PT1vKWJyZWFrIGU7Zm9yKGQ9MDtrPW5bcytkKytdLHIuaGVhZCYmayYmci5sZW5ndGg8NjU1MzYmJihyLmhlYWQubmFtZSs9U3RyaW5nLmZyb21DaGFyQ29kZShrKSksayYmZDxvOyk7aWYoNTEyJnIuZmxhZ3MmJihyLmNoZWNrPUIoci5jaGVjayxuLGQscykpLG8tPWQscys9ZCxrKWJyZWFrIGV9ZWxzZSByLmhlYWQmJihyLmhlYWQubmFtZT1udWxsKTtyLmxlbmd0aD0wLHIubW9kZT04O2Nhc2UgODppZig0MDk2JnIuZmxhZ3Mpe2lmKDA9PT1vKWJyZWFrIGU7Zm9yKGQ9MDtrPW5bcytkKytdLHIuaGVhZCYmayYmci5sZW5ndGg8NjU1MzYmJihyLmhlYWQuY29tbWVudCs9U3RyaW5nLmZyb21DaGFyQ29kZShrKSksayYmZDxvOyk7aWYoNTEyJnIuZmxhZ3MmJihyLmNoZWNrPUIoci5jaGVjayxuLGQscykpLG8tPWQscys9ZCxrKWJyZWFrIGV9ZWxzZSByLmhlYWQmJihyLmhlYWQuY29tbWVudD1udWxsKTtyLm1vZGU9OTtjYXNlIDk6aWYoNTEyJnIuZmxhZ3Mpe2Zvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIGU7by0tLHUrPW5bcysrXTw8bCxsKz04fWlmKHUhPT0oNjU1MzUmci5jaGVjaykpe2UubXNnPSJoZWFkZXIgY3JjIG1pc21hdGNoIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5oZWFkJiYoci5oZWFkLmhjcmM9ci5mbGFncz4+OSYxLHIuaGVhZC5kb25lPSEwKSxlLmFkbGVyPXIuY2hlY2s9MCxyLm1vZGU9MTI7YnJlYWs7Y2FzZSAxMDpmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1lLmFkbGVyPXIuY2hlY2s9TCh1KSxsPXU9MCxyLm1vZGU9MTE7Y2FzZSAxMTppZigwPT09ci5oYXZlZGljdClyZXR1cm4gZS5uZXh0X291dD1hLGUuYXZhaWxfb3V0PWgsZS5uZXh0X2luPXMsZS5hdmFpbF9pbj1vLHIuaG9sZD11LHIuYml0cz1sLDI7ZS5hZGxlcj1yLmNoZWNrPTEsci5tb2RlPTEyO2Nhc2UgMTI6aWYoNT09PXR8fDY9PT10KWJyZWFrIGU7Y2FzZSAxMzppZihyLmxhc3Qpe3U+Pj49NyZsLGwtPTcmbCxyLm1vZGU9Mjc7YnJlYWt9Zm9yKDtsPDM7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1zd2l0Y2goci5sYXN0PTEmdSxsLT0xLDMmKHU+Pj49MSkpe2Nhc2UgMDpyLm1vZGU9MTQ7YnJlYWs7Y2FzZSAxOmlmKGoociksci5tb2RlPTIwLDYhPT10KWJyZWFrO3U+Pj49MixsLT0yO2JyZWFrIGU7Y2FzZSAyOnIubW9kZT0xNzticmVhaztjYXNlIDM6ZS5tc2c9ImludmFsaWQgYmxvY2sgdHlwZSIsci5tb2RlPTMwfXU+Pj49MixsLT0yO2JyZWFrO2Nhc2UgMTQ6Zm9yKHU+Pj49NyZsLGwtPTcmbDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoKDY1NTM1JnUpIT0odT4+PjE2XjY1NTM1KSl7ZS5tc2c9ImludmFsaWQgc3RvcmVkIGJsb2NrIGxlbmd0aHMiLHIubW9kZT0zMDticmVha31pZihyLmxlbmd0aD02NTUzNSZ1LGw9dT0wLHIubW9kZT0xNSw2PT09dClicmVhayBlO2Nhc2UgMTU6ci5tb2RlPTE2O2Nhc2UgMTY6aWYoZD1yLmxlbmd0aCl7aWYobzxkJiYoZD1vKSxoPGQmJihkPWgpLDA9PT1kKWJyZWFrIGU7SS5hcnJheVNldChpLG4scyxkLGEpLG8tPWQscys9ZCxoLT1kLGErPWQsci5sZW5ndGgtPWQ7YnJlYWt9ci5tb2RlPTEyO2JyZWFrO2Nhc2UgMTc6Zm9yKDtsPDE0Oyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoci5ubGVuPTI1NysoMzEmdSksdT4+Pj01LGwtPTUsci5uZGlzdD0xKygzMSZ1KSx1Pj4+PTUsbC09NSxyLm5jb2RlPTQrKDE1JnUpLHU+Pj49NCxsLT00LDI4NjxyLm5sZW58fDMwPHIubmRpc3Qpe2UubXNnPSJ0b28gbWFueSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9scyIsci5tb2RlPTMwO2JyZWFrfXIuaGF2ZT0wLHIubW9kZT0xODtjYXNlIDE4OmZvcig7ci5oYXZlPHIubmNvZGU7KXtmb3IoO2w8Mzspe2lmKDA9PT1vKWJyZWFrIGU7by0tLHUrPW5bcysrXTw8bCxsKz04fXIubGVuc1tBW3IuaGF2ZSsrXV09NyZ1LHU+Pj49MyxsLT0zfWZvcig7ci5oYXZlPDE5OylyLmxlbnNbQVtyLmhhdmUrK11dPTA7aWYoci5sZW5jb2RlPXIubGVuZHluLHIubGVuYml0cz03LFM9e2JpdHM6ci5sZW5iaXRzfSx4PVQoMCxyLmxlbnMsMCwxOSxyLmxlbmNvZGUsMCxyLndvcmssUyksci5sZW5iaXRzPVMuYml0cyx4KXtlLm1zZz0iaW52YWxpZCBjb2RlIGxlbmd0aHMgc2V0IixyLm1vZGU9MzA7YnJlYWt9ci5oYXZlPTAsci5tb2RlPTE5O2Nhc2UgMTk6Zm9yKDtyLmhhdmU8ci5ubGVuK3IubmRpc3Q7KXtmb3IoO2c9KEM9ci5sZW5jb2RlW3UmKDE8PHIubGVuYml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoYjwxNil1Pj4+PV8sbC09XyxyLmxlbnNbci5oYXZlKytdPWI7ZWxzZXtpZigxNj09PWIpe2Zvcih6PV8rMjtsPHo7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1pZih1Pj4+PV8sbC09XywwPT09ci5oYXZlKXtlLm1zZz0iaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdCIsci5tb2RlPTMwO2JyZWFrfWs9ci5sZW5zW3IuaGF2ZS0xXSxkPTMrKDMmdSksdT4+Pj0yLGwtPTJ9ZWxzZSBpZigxNz09PWIpe2Zvcih6PV8rMztsPHo7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1sLT1fLGs9MCxkPTMrKDcmKHU+Pj49XykpLHU+Pj49MyxsLT0zfWVsc2V7Zm9yKHo9Xys3O2w8ejspe2lmKDA9PT1vKWJyZWFrIGU7by0tLHUrPW5bcysrXTw8bCxsKz04fWwtPV8saz0wLGQ9MTErKDEyNyYodT4+Pj1fKSksdT4+Pj03LGwtPTd9aWYoci5oYXZlK2Q+ci5ubGVuK3IubmRpc3Qpe2UubXNnPSJpbnZhbGlkIGJpdCBsZW5ndGggcmVwZWF0IixyLm1vZGU9MzA7YnJlYWt9Zm9yKDtkLS07KXIubGVuc1tyLmhhdmUrK109a319aWYoMzA9PT1yLm1vZGUpYnJlYWs7aWYoMD09PXIubGVuc1syNTZdKXtlLm1zZz0iaW52YWxpZCBjb2RlIC0tIG1pc3NpbmcgZW5kLW9mLWJsb2NrIixyLm1vZGU9MzA7YnJlYWt9aWYoci5sZW5iaXRzPTksUz17Yml0czpyLmxlbmJpdHN9LHg9VChELHIubGVucywwLHIubmxlbixyLmxlbmNvZGUsMCxyLndvcmssUyksci5sZW5iaXRzPVMuYml0cyx4KXtlLm1zZz0iaW52YWxpZCBsaXRlcmFsL2xlbmd0aHMgc2V0IixyLm1vZGU9MzA7YnJlYWt9aWYoci5kaXN0Yml0cz02LHIuZGlzdGNvZGU9ci5kaXN0ZHluLFM9e2JpdHM6ci5kaXN0Yml0c30seD1UKEYsci5sZW5zLHIubmxlbixyLm5kaXN0LHIuZGlzdGNvZGUsMCxyLndvcmssUyksci5kaXN0Yml0cz1TLmJpdHMseCl7ZS5tc2c9ImludmFsaWQgZGlzdGFuY2VzIHNldCIsci5tb2RlPTMwO2JyZWFrfWlmKHIubW9kZT0yMCw2PT09dClicmVhayBlO2Nhc2UgMjA6ci5tb2RlPTIxO2Nhc2UgMjE6aWYoNjw9byYmMjU4PD1oKXtlLm5leHRfb3V0PWEsZS5hdmFpbF9vdXQ9aCxlLm5leHRfaW49cyxlLmF2YWlsX2luPW8sci5ob2xkPXUsci5iaXRzPWwsUihlLGMpLGE9ZS5uZXh0X291dCxpPWUub3V0cHV0LGg9ZS5hdmFpbF9vdXQscz1lLm5leHRfaW4sbj1lLmlucHV0LG89ZS5hdmFpbF9pbix1PXIuaG9sZCxsPXIuYml0cywxMj09PXIubW9kZSYmKHIuYmFjaz0tMSk7YnJlYWt9Zm9yKHIuYmFjaz0wO2c9KEM9ci5sZW5jb2RlW3UmKDE8PHIubGVuYml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoZyYmMD09KDI0MCZnKSl7Zm9yKHY9Xyx5PWcsdz1iO2c9KEM9ci5sZW5jb2RlW3crKCh1JigxPDx2K3kpLTEpPj52KV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKHYrKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH11Pj4+PXYsbC09dixyLmJhY2srPXZ9aWYodT4+Pj1fLGwtPV8sci5iYWNrKz1fLHIubGVuZ3RoPWIsMD09PWcpe3IubW9kZT0yNjticmVha31pZigzMiZnKXtyLmJhY2s9LTEsci5tb2RlPTEyO2JyZWFrfWlmKDY0Jmcpe2UubXNnPSJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGUiLHIubW9kZT0zMDticmVha31yLmV4dHJhPTE1Jmcsci5tb2RlPTIyO2Nhc2UgMjI6aWYoci5leHRyYSl7Zm9yKHo9ci5leHRyYTtsPHo7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1yLmxlbmd0aCs9dSYoMTw8ci5leHRyYSktMSx1Pj4+PXIuZXh0cmEsbC09ci5leHRyYSxyLmJhY2srPXIuZXh0cmF9ci53YXM9ci5sZW5ndGgsci5tb2RlPTIzO2Nhc2UgMjM6Zm9yKDtnPShDPXIuZGlzdGNvZGVbdSYoMTw8ci5kaXN0Yml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9aWYoMD09KDI0MCZnKSl7Zm9yKHY9Xyx5PWcsdz1iO2c9KEM9ci5kaXN0Y29kZVt3KygodSYoMTw8dit5KS0xKT4+dildKT4+PjE2JjI1NSxiPTY1NTM1JkMsISh2KyhfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgZTtvLS0sdSs9bltzKytdPDxsLGwrPTh9dT4+Pj12LGwtPXYsci5iYWNrKz12fWlmKHU+Pj49XyxsLT1fLHIuYmFjays9Xyw2NCZnKXtlLm1zZz0iaW52YWxpZCBkaXN0YW5jZSBjb2RlIixyLm1vZGU9MzA7YnJlYWt9ci5vZmZzZXQ9YixyLmV4dHJhPTE1Jmcsci5tb2RlPTI0O2Nhc2UgMjQ6aWYoci5leHRyYSl7Zm9yKHo9ci5leHRyYTtsPHo7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1yLm9mZnNldCs9dSYoMTw8ci5leHRyYSktMSx1Pj4+PXIuZXh0cmEsbC09ci5leHRyYSxyLmJhY2srPXIuZXh0cmF9aWYoci5vZmZzZXQ+ci5kbWF4KXtlLm1zZz0iaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2siLHIubW9kZT0zMDticmVha31yLm1vZGU9MjU7Y2FzZSAyNTppZigwPT09aClicmVhayBlO2lmKGQ9Yy1oLHIub2Zmc2V0PmQpe2lmKChkPXIub2Zmc2V0LWQpPnIud2hhdmUmJnIuc2FuZSl7ZS5tc2c9ImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrIixyLm1vZGU9MzA7YnJlYWt9cD1kPnIud25leHQ/KGQtPXIud25leHQsci53c2l6ZS1kKTpyLnduZXh0LWQsZD5yLmxlbmd0aCYmKGQ9ci5sZW5ndGgpLG09ci53aW5kb3d9ZWxzZSBtPWkscD1hLXIub2Zmc2V0LGQ9ci5sZW5ndGg7Zm9yKGg8ZCYmKGQ9aCksaC09ZCxyLmxlbmd0aC09ZDtpW2ErK109bVtwKytdLC0tZDspOzA9PT1yLmxlbmd0aCYmKHIubW9kZT0yMSk7YnJlYWs7Y2FzZSAyNjppZigwPT09aClicmVhayBlO2lbYSsrXT1yLmxlbmd0aCxoLS0sci5tb2RlPTIxO2JyZWFrO2Nhc2UgMjc6aWYoci53cmFwKXtmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayBlO28tLSx1fD1uW3MrK108PGwsbCs9OH1pZihjLT1oLGUudG90YWxfb3V0Kz1jLHIudG90YWwrPWMsYyYmKGUuYWRsZXI9ci5jaGVjaz1yLmZsYWdzP0Ioci5jaGVjayxpLGMsYS1jKTpPKHIuY2hlY2ssaSxjLGEtYykpLGM9aCwoci5mbGFncz91OkwodSkpIT09ci5jaGVjayl7ZS5tc2c9ImluY29ycmVjdCBkYXRhIGNoZWNrIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5tb2RlPTI4O2Nhc2UgMjg6aWYoci53cmFwJiZyLmZsYWdzKXtmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayBlO28tLSx1Kz1uW3MrK108PGwsbCs9OH1pZih1IT09KDQyOTQ5NjcyOTUmci50b3RhbCkpe2UubXNnPSJpbmNvcnJlY3QgbGVuZ3RoIGNoZWNrIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5tb2RlPTI5O2Nhc2UgMjk6eD0xO2JyZWFrIGU7Y2FzZSAzMDp4PS0zO2JyZWFrIGU7Y2FzZSAzMTpyZXR1cm4tNDtjYXNlIDMyOmRlZmF1bHQ6cmV0dXJuIFV9cmV0dXJuIGUubmV4dF9vdXQ9YSxlLmF2YWlsX291dD1oLGUubmV4dF9pbj1zLGUuYXZhaWxfaW49byxyLmhvbGQ9dSxyLmJpdHM9bCwoci53c2l6ZXx8YyE9PWUuYXZhaWxfb3V0JiZyLm1vZGU8MzAmJihyLm1vZGU8Mjd8fDQhPT10KSkmJlooZSxlLm91dHB1dCxlLm5leHRfb3V0LGMtZS5hdmFpbF9vdXQpPyhyLm1vZGU9MzEsLTQpOihmLT1lLmF2YWlsX2luLGMtPWUuYXZhaWxfb3V0LGUudG90YWxfaW4rPWYsZS50b3RhbF9vdXQrPWMsci50b3RhbCs9YyxyLndyYXAmJmMmJihlLmFkbGVyPXIuY2hlY2s9ci5mbGFncz9CKHIuY2hlY2ssaSxjLGUubmV4dF9vdXQtYyk6TyhyLmNoZWNrLGksYyxlLm5leHRfb3V0LWMpKSxlLmRhdGFfdHlwZT1yLmJpdHMrKHIubGFzdD82NDowKSsoMTI9PT1yLm1vZGU/MTI4OjApKygyMD09PXIubW9kZXx8MTU9PT1yLm1vZGU/MjU2OjApLCgwPT1mJiYwPT09Y3x8ND09PXQpJiZ4PT09TiYmKHg9LTUpLHgpfSxyLmluZmxhdGVFbmQ9ZnVuY3Rpb24oZSl7aWYoIWV8fCFlLnN0YXRlKXJldHVybiBVO3ZhciB0PWUuc3RhdGU7cmV0dXJuIHQud2luZG93JiYodC53aW5kb3c9bnVsbCksZS5zdGF0ZT1udWxsLE59LHIuaW5mbGF0ZUdldEhlYWRlcj1mdW5jdGlvbihlLHQpe3ZhciByO3JldHVybiBlJiZlLnN0YXRlPzA9PSgyJihyPWUuc3RhdGUpLndyYXApP1U6KChyLmhlYWQ9dCkuZG9uZT0hMSxOKTpVfSxyLmluZmxhdGVTZXREaWN0aW9uYXJ5PWZ1bmN0aW9uKGUsdCl7dmFyIHIsbj10Lmxlbmd0aDtyZXR1cm4gZSYmZS5zdGF0ZT8wIT09KHI9ZS5zdGF0ZSkud3JhcCYmMTEhPT1yLm1vZGU/VToxMT09PXIubW9kZSYmTygxLHQsbiwwKSE9PXIuY2hlY2s/LTM6WihlLHQsbixuKT8oci5tb2RlPTMxLC00KTooci5oYXZlZGljdD0xLE4pOlV9LHIuaW5mbGF0ZUluZm89InBha28gaW5mbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdCkifSx7Ii4uL3V0aWxzL2NvbW1vbiI6NDEsIi4vYWRsZXIzMiI6NDMsIi4vY3JjMzIiOjQ1LCIuL2luZmZhc3QiOjQ4LCIuL2luZnRyZWVzIjo1MH1dLDUwOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3ZhciBEPWUoIi4uL3V0aWxzL2NvbW1vbiIpLEY9WzMsNCw1LDYsNyw4LDksMTAsMTEsMTMsMTUsMTcsMTksMjMsMjcsMzEsMzUsNDMsNTEsNTksNjcsODMsOTksMTE1LDEzMSwxNjMsMTk1LDIyNywyNTgsMCwwXSxOPVsxNiwxNiwxNiwxNiwxNiwxNiwxNiwxNiwxNywxNywxNywxNywxOCwxOCwxOCwxOCwxOSwxOSwxOSwxOSwyMCwyMCwyMCwyMCwyMSwyMSwyMSwyMSwxNiw3Miw3OF0sVT1bMSwyLDMsNCw1LDcsOSwxMywxNywyNSwzMyw0OSw2NSw5NywxMjksMTkzLDI1NywzODUsNTEzLDc2OSwxMDI1LDE1MzcsMjA0OSwzMDczLDQwOTcsNjE0NSw4MTkzLDEyMjg5LDE2Mzg1LDI0NTc3LDAsMF0sUD1bMTYsMTYsMTYsMTYsMTcsMTcsMTgsMTgsMTksMTksMjAsMjAsMjEsMjEsMjIsMjIsMjMsMjMsMjQsMjQsMjUsMjUsMjYsMjYsMjcsMjcsMjgsMjgsMjksMjksNjQsNjRdO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQscixuLGkscyxhLG8pe3ZhciBoLHUsbCxmLGMsZCxwLG0sXyxnPW8uYml0cyxiPTAsdj0wLHk9MCx3PTAsaz0wLHg9MCxTPTAsej0wLEM9MCxFPTAsQT1udWxsLEk9MCxPPW5ldyBELkJ1ZjE2KDE2KSxCPW5ldyBELkJ1ZjE2KDE2KSxSPW51bGwsVD0wO2ZvcihiPTA7Yjw9MTU7YisrKU9bYl09MDtmb3Iodj0wO3Y8bjt2KyspT1t0W3Irdl1dKys7Zm9yKGs9Zyx3PTE1OzE8PXcmJjA9PT1PW3ddO3ctLSk7aWYodzxrJiYoaz13KSwwPT09dylyZXR1cm4gaVtzKytdPTIwOTcxNTIwLGlbcysrXT0yMDk3MTUyMCxvLmJpdHM9MSwwO2Zvcih5PTE7eTx3JiYwPT09T1t5XTt5KyspO2ZvcihrPHkmJihrPXkpLGI9ej0xO2I8PTE1O2IrKylpZih6PDw9MSwoei09T1tiXSk8MClyZXR1cm4tMTtpZigwPHomJigwPT09ZXx8MSE9PXcpKXJldHVybi0xO2ZvcihCWzFdPTAsYj0xO2I8MTU7YisrKUJbYisxXT1CW2JdK09bYl07Zm9yKHY9MDt2PG47disrKTAhPT10W3Irdl0mJihhW0JbdFtyK3ZdXSsrXT12KTtpZihkPTA9PT1lPyhBPVI9YSwxOSk6MT09PWU/KEE9RixJLT0yNTcsUj1OLFQtPTI1NywyNTYpOihBPVUsUj1QLC0xKSxiPXksYz1zLFM9dj1FPTAsbD0tMSxmPShDPTE8PCh4PWspKS0xLDE9PT1lJiY4NTI8Q3x8Mj09PWUmJjU5MjxDKXJldHVybiAxO2Zvcig7Oyl7Zm9yKHA9Yi1TLF89YVt2XTxkPyhtPTAsYVt2XSk6YVt2XT5kPyhtPVJbVCthW3ZdXSxBW0krYVt2XV0pOihtPTk2LDApLGg9MTw8Yi1TLHk9dT0xPDx4O2lbYysoRT4+UykrKHUtPWgpXT1wPDwyNHxtPDwxNnxffDAsMCE9PXU7KTtmb3IoaD0xPDxiLTE7RSZoOyloPj49MTtpZigwIT09aD8oRSY9aC0xLEUrPWgpOkU9MCx2KyssMD09LS1PW2JdKXtpZihiPT09dylicmVhaztiPXRbcithW3ZdXX1pZihrPGImJihFJmYpIT09bCl7Zm9yKDA9PT1TJiYoUz1rKSxjKz15LHo9MTw8KHg9Yi1TKTt4K1M8dyYmISgoei09T1t4K1NdKTw9MCk7KXgrKyx6PDw9MTtpZihDKz0xPDx4LDE9PT1lJiY4NTI8Q3x8Mj09PWUmJjU5MjxDKXJldHVybiAxO2lbbD1FJmZdPWs8PDI0fHg8PDE2fGMtc3wwfX1yZXR1cm4gMCE9PUUmJihpW2MrRV09Yi1TPDwyNHw2NDw8MTZ8MCksby5iaXRzPWssMH19LHsiLi4vdXRpbHMvY29tbW9uIjo0MX1dLDUxOltmdW5jdGlvbihlLHQscil7InVzZSBzdHJpY3QiO3QuZXhwb3J0cz17MjoibmVlZCBkaWN0aW9uYXJ5IiwxOiJzdHJlYW0gZW5kIiwwOiIiLCItMSI6ImZpbGUgZXJyb3IiLCItMiI6InN0cmVhbSBlcnJvciIsIi0zIjoiZGF0YSBlcnJvciIsIi00IjoiaW5zdWZmaWNpZW50IG1lbW9yeSIsIi01IjoiYnVmZmVyIGVycm9yIiwiLTYiOiJpbmNvbXBhdGlibGUgdmVyc2lvbiJ9fSx7fV0sNTI6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dmFyIGk9ZSgiLi4vdXRpbHMvY29tbW9uIiksbz0wLGg9MTtmdW5jdGlvbiBuKGUpe2Zvcih2YXIgdD1lLmxlbmd0aDswPD0tLXQ7KWVbdF09MH12YXIgcz0wLGE9MjksdT0yNTYsbD11KzErYSxmPTMwLGM9MTksXz0yKmwrMSxnPTE1LGQ9MTYscD03LG09MjU2LGI9MTYsdj0xNyx5PTE4LHc9WzAsMCwwLDAsMCwwLDAsMCwxLDEsMSwxLDIsMiwyLDIsMywzLDMsMyw0LDQsNCw0LDUsNSw1LDUsMF0saz1bMCwwLDAsMCwxLDEsMiwyLDMsMyw0LDQsNSw1LDYsNiw3LDcsOCw4LDksOSwxMCwxMCwxMSwxMSwxMiwxMiwxMywxM10seD1bMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDMsN10sUz1bMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV0sej1uZXcgQXJyYXkoMioobCsyKSk7bih6KTt2YXIgQz1uZXcgQXJyYXkoMipmKTtuKEMpO3ZhciBFPW5ldyBBcnJheSg1MTIpO24oRSk7dmFyIEE9bmV3IEFycmF5KDI1Nik7bihBKTt2YXIgST1uZXcgQXJyYXkoYSk7bihJKTt2YXIgTyxCLFIsVD1uZXcgQXJyYXkoZik7ZnVuY3Rpb24gRChlLHQscixuLGkpe3RoaXMuc3RhdGljX3RyZWU9ZSx0aGlzLmV4dHJhX2JpdHM9dCx0aGlzLmV4dHJhX2Jhc2U9cix0aGlzLmVsZW1zPW4sdGhpcy5tYXhfbGVuZ3RoPWksdGhpcy5oYXNfc3RyZWU9ZSYmZS5sZW5ndGh9ZnVuY3Rpb24gRihlLHQpe3RoaXMuZHluX3RyZWU9ZSx0aGlzLm1heF9jb2RlPTAsdGhpcy5zdGF0X2Rlc2M9dH1mdW5jdGlvbiBOKGUpe3JldHVybiBlPDI1Nj9FW2VdOkVbMjU2KyhlPj4+NyldfWZ1bmN0aW9uIFUoZSx0KXtlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT0yNTUmdCxlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT10Pj4+OCYyNTV9ZnVuY3Rpb24gUChlLHQscil7ZS5iaV92YWxpZD5kLXI/KGUuYmlfYnVmfD10PDxlLmJpX3ZhbGlkJjY1NTM1LFUoZSxlLmJpX2J1ZiksZS5iaV9idWY9dD4+ZC1lLmJpX3ZhbGlkLGUuYmlfdmFsaWQrPXItZCk6KGUuYmlfYnVmfD10PDxlLmJpX3ZhbGlkJjY1NTM1LGUuYmlfdmFsaWQrPXIpfWZ1bmN0aW9uIEwoZSx0LHIpe1AoZSxyWzIqdF0sclsyKnQrMV0pfWZ1bmN0aW9uIGooZSx0KXtmb3IodmFyIHI9MDtyfD0xJmUsZT4+Pj0xLHI8PD0xLDA8LS10Oyk7cmV0dXJuIHI+Pj4xfWZ1bmN0aW9uIFooZSx0LHIpe3ZhciBuLGkscz1uZXcgQXJyYXkoZysxKSxhPTA7Zm9yKG49MTtuPD1nO24rKylzW25dPWE9YStyW24tMV08PDE7Zm9yKGk9MDtpPD10O2krKyl7dmFyIG89ZVsyKmkrMV07MCE9PW8mJihlWzIqaV09aihzW29dKyssbykpfX1mdW5jdGlvbiBXKGUpe3ZhciB0O2Zvcih0PTA7dDxsO3QrKyllLmR5bl9sdHJlZVsyKnRdPTA7Zm9yKHQ9MDt0PGY7dCsrKWUuZHluX2R0cmVlWzIqdF09MDtmb3IodD0wO3Q8Yzt0KyspZS5ibF90cmVlWzIqdF09MDtlLmR5bl9sdHJlZVsyKm1dPTEsZS5vcHRfbGVuPWUuc3RhdGljX2xlbj0wLGUubGFzdF9saXQ9ZS5tYXRjaGVzPTB9ZnVuY3Rpb24gTShlKXs4PGUuYmlfdmFsaWQ/VShlLGUuYmlfYnVmKTowPGUuYmlfdmFsaWQmJihlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT1lLmJpX2J1ZiksZS5iaV9idWY9MCxlLmJpX3ZhbGlkPTB9ZnVuY3Rpb24gSChlLHQscixuKXt2YXIgaT0yKnQscz0yKnI7cmV0dXJuIGVbaV08ZVtzXXx8ZVtpXT09PWVbc10mJm5bdF08PW5bcl19ZnVuY3Rpb24gRyhlLHQscil7Zm9yKHZhciBuPWUuaGVhcFtyXSxpPXI8PDE7aTw9ZS5oZWFwX2xlbiYmKGk8ZS5oZWFwX2xlbiYmSCh0LGUuaGVhcFtpKzFdLGUuaGVhcFtpXSxlLmRlcHRoKSYmaSsrLCFIKHQsbixlLmhlYXBbaV0sZS5kZXB0aCkpOyllLmhlYXBbcl09ZS5oZWFwW2ldLHI9aSxpPDw9MTtlLmhlYXBbcl09bn1mdW5jdGlvbiBLKGUsdCxyKXt2YXIgbixpLHMsYSxvPTA7aWYoMCE9PWUubGFzdF9saXQpZm9yKDtuPWUucGVuZGluZ19idWZbZS5kX2J1ZisyKm9dPDw4fGUucGVuZGluZ19idWZbZS5kX2J1ZisyKm8rMV0saT1lLnBlbmRpbmdfYnVmW2UubF9idWYrb10sbysrLDA9PT1uP0woZSxpLHQpOihMKGUsKHM9QVtpXSkrdSsxLHQpLDAhPT0oYT13W3NdKSYmUChlLGktPUlbc10sYSksTChlLHM9TigtLW4pLHIpLDAhPT0oYT1rW3NdKSYmUChlLG4tPVRbc10sYSkpLG88ZS5sYXN0X2xpdDspO0woZSxtLHQpfWZ1bmN0aW9uIFkoZSx0KXt2YXIgcixuLGkscz10LmR5bl90cmVlLGE9dC5zdGF0X2Rlc2Muc3RhdGljX3RyZWUsbz10LnN0YXRfZGVzYy5oYXNfc3RyZWUsaD10LnN0YXRfZGVzYy5lbGVtcyx1PS0xO2ZvcihlLmhlYXBfbGVuPTAsZS5oZWFwX21heD1fLHI9MDtyPGg7cisrKTAhPT1zWzIqcl0/KGUuaGVhcFsrK2UuaGVhcF9sZW5dPXU9cixlLmRlcHRoW3JdPTApOnNbMipyKzFdPTA7Zm9yKDtlLmhlYXBfbGVuPDI7KXNbMiooaT1lLmhlYXBbKytlLmhlYXBfbGVuXT11PDI/Kyt1OjApXT0xLGUuZGVwdGhbaV09MCxlLm9wdF9sZW4tLSxvJiYoZS5zdGF0aWNfbGVuLT1hWzIqaSsxXSk7Zm9yKHQubWF4X2NvZGU9dSxyPWUuaGVhcF9sZW4+PjE7MTw9cjtyLS0pRyhlLHMscik7Zm9yKGk9aDtyPWUuaGVhcFsxXSxlLmhlYXBbMV09ZS5oZWFwW2UuaGVhcF9sZW4tLV0sRyhlLHMsMSksbj1lLmhlYXBbMV0sZS5oZWFwWy0tZS5oZWFwX21heF09cixlLmhlYXBbLS1lLmhlYXBfbWF4XT1uLHNbMippXT1zWzIqcl0rc1syKm5dLGUuZGVwdGhbaV09KGUuZGVwdGhbcl0+PWUuZGVwdGhbbl0/ZS5kZXB0aFtyXTplLmRlcHRoW25dKSsxLHNbMipyKzFdPXNbMipuKzFdPWksZS5oZWFwWzFdPWkrKyxHKGUscywxKSwyPD1lLmhlYXBfbGVuOyk7ZS5oZWFwWy0tZS5oZWFwX21heF09ZS5oZWFwWzFdLGZ1bmN0aW9uKGUsdCl7dmFyIHIsbixpLHMsYSxvLGg9dC5keW5fdHJlZSx1PXQubWF4X2NvZGUsbD10LnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxmPXQuc3RhdF9kZXNjLmhhc19zdHJlZSxjPXQuc3RhdF9kZXNjLmV4dHJhX2JpdHMsZD10LnN0YXRfZGVzYy5leHRyYV9iYXNlLHA9dC5zdGF0X2Rlc2MubWF4X2xlbmd0aCxtPTA7Zm9yKHM9MDtzPD1nO3MrKyllLmJsX2NvdW50W3NdPTA7Zm9yKGhbMiplLmhlYXBbZS5oZWFwX21heF0rMV09MCxyPWUuaGVhcF9tYXgrMTtyPF87cisrKXA8KHM9aFsyKmhbMioobj1lLmhlYXBbcl0pKzFdKzFdKzEpJiYocz1wLG0rKyksaFsyKm4rMV09cyx1PG58fChlLmJsX2NvdW50W3NdKyssYT0wLGQ8PW4mJihhPWNbbi1kXSksbz1oWzIqbl0sZS5vcHRfbGVuKz1vKihzK2EpLGYmJihlLnN0YXRpY19sZW4rPW8qKGxbMipuKzFdK2EpKSk7aWYoMCE9PW0pe2Rve2ZvcihzPXAtMTswPT09ZS5ibF9jb3VudFtzXTspcy0tO2UuYmxfY291bnRbc10tLSxlLmJsX2NvdW50W3MrMV0rPTIsZS5ibF9jb3VudFtwXS0tLG0tPTJ9d2hpbGUoMDxtKTtmb3Iocz1wOzAhPT1zO3MtLSlmb3Iobj1lLmJsX2NvdW50W3NdOzAhPT1uOyl1PChpPWUuaGVhcFstLXJdKXx8KGhbMippKzFdIT09cyYmKGUub3B0X2xlbis9KHMtaFsyKmkrMV0pKmhbMippXSxoWzIqaSsxXT1zKSxuLS0pfX0oZSx0KSxaKHMsdSxlLmJsX2NvdW50KX1mdW5jdGlvbiBYKGUsdCxyKXt2YXIgbixpLHM9LTEsYT10WzFdLG89MCxoPTcsdT00O2ZvcigwPT09YSYmKGg9MTM4LHU9MyksdFsyKihyKzEpKzFdPTY1NTM1LG49MDtuPD1yO24rKylpPWEsYT10WzIqKG4rMSkrMV0sKytvPGgmJmk9PT1hfHwobzx1P2UuYmxfdHJlZVsyKmldKz1vOjAhPT1pPyhpIT09cyYmZS5ibF90cmVlWzIqaV0rKyxlLmJsX3RyZWVbMipiXSsrKTpvPD0xMD9lLmJsX3RyZWVbMip2XSsrOmUuYmxfdHJlZVsyKnldKysscz1pLHU9KG89MCk9PT1hPyhoPTEzOCwzKTppPT09YT8oaD02LDMpOihoPTcsNCkpfWZ1bmN0aW9uIFYoZSx0LHIpe3ZhciBuLGkscz0tMSxhPXRbMV0sbz0wLGg9Nyx1PTQ7Zm9yKDA9PT1hJiYoaD0xMzgsdT0zKSxuPTA7bjw9cjtuKyspaWYoaT1hLGE9dFsyKihuKzEpKzFdLCEoKytvPGgmJmk9PT1hKSl7aWYobzx1KWZvcig7TChlLGksZS5ibF90cmVlKSwwIT0tLW87KTtlbHNlIDAhPT1pPyhpIT09cyYmKEwoZSxpLGUuYmxfdHJlZSksby0tKSxMKGUsYixlLmJsX3RyZWUpLFAoZSxvLTMsMikpOm88PTEwPyhMKGUsdixlLmJsX3RyZWUpLFAoZSxvLTMsMykpOihMKGUseSxlLmJsX3RyZWUpLFAoZSxvLTExLDcpKTtzPWksdT0obz0wKT09PWE/KGg9MTM4LDMpOmk9PT1hPyhoPTYsMyk6KGg9Nyw0KX19bihUKTt2YXIgcT0hMTtmdW5jdGlvbiBKKGUsdCxyLG4pe1AoZSwoczw8MSkrKG4/MTowKSwzKSxmdW5jdGlvbihlLHQscixuKXtNKGUpLG4mJihVKGUsciksVShlLH5yKSksaS5hcnJheVNldChlLnBlbmRpbmdfYnVmLGUud2luZG93LHQscixlLnBlbmRpbmcpLGUucGVuZGluZys9cn0oZSx0LHIsITApfXIuX3RyX2luaXQ9ZnVuY3Rpb24oZSl7cXx8KGZ1bmN0aW9uKCl7dmFyIGUsdCxyLG4saSxzPW5ldyBBcnJheShnKzEpO2ZvcihuPXI9MDtuPGEtMTtuKyspZm9yKElbbl09cixlPTA7ZTwxPDx3W25dO2UrKylBW3IrK109bjtmb3IoQVtyLTFdPW4sbj1pPTA7bjwxNjtuKyspZm9yKFRbbl09aSxlPTA7ZTwxPDxrW25dO2UrKylFW2krK109bjtmb3IoaT4+PTc7bjxmO24rKylmb3IoVFtuXT1pPDw3LGU9MDtlPDE8PGtbbl0tNztlKyspRVsyNTYraSsrXT1uO2Zvcih0PTA7dDw9Zzt0Kyspc1t0XT0wO2ZvcihlPTA7ZTw9MTQzOyl6WzIqZSsxXT04LGUrKyxzWzhdKys7Zm9yKDtlPD0yNTU7KXpbMiplKzFdPTksZSsrLHNbOV0rKztmb3IoO2U8PTI3OTspelsyKmUrMV09NyxlKyssc1s3XSsrO2Zvcig7ZTw9Mjg3Oyl6WzIqZSsxXT04LGUrKyxzWzhdKys7Zm9yKFooeixsKzEscyksZT0wO2U8ZjtlKyspQ1syKmUrMV09NSxDWzIqZV09aihlLDUpO089bmV3IEQoeix3LHUrMSxsLGcpLEI9bmV3IEQoQyxrLDAsZixnKSxSPW5ldyBEKG5ldyBBcnJheSgwKSx4LDAsYyxwKX0oKSxxPSEwKSxlLmxfZGVzYz1uZXcgRihlLmR5bl9sdHJlZSxPKSxlLmRfZGVzYz1uZXcgRihlLmR5bl9kdHJlZSxCKSxlLmJsX2Rlc2M9bmV3IEYoZS5ibF90cmVlLFIpLGUuYmlfYnVmPTAsZS5iaV92YWxpZD0wLFcoZSl9LHIuX3RyX3N0b3JlZF9ibG9jaz1KLHIuX3RyX2ZsdXNoX2Jsb2NrPWZ1bmN0aW9uKGUsdCxyLG4pe3ZhciBpLHMsYT0wOzA8ZS5sZXZlbD8oMj09PWUuc3RybS5kYXRhX3R5cGUmJihlLnN0cm0uZGF0YV90eXBlPWZ1bmN0aW9uKGUpe3ZhciB0LHI9NDA5MzYyNDQ0Nztmb3IodD0wO3Q8PTMxO3QrKyxyPj4+PTEpaWYoMSZyJiYwIT09ZS5keW5fbHRyZWVbMip0XSlyZXR1cm4gbztpZigwIT09ZS5keW5fbHRyZWVbMThdfHwwIT09ZS5keW5fbHRyZWVbMjBdfHwwIT09ZS5keW5fbHRyZWVbMjZdKXJldHVybiBoO2Zvcih0PTMyO3Q8dTt0KyspaWYoMCE9PWUuZHluX2x0cmVlWzIqdF0pcmV0dXJuIGg7cmV0dXJuIG99KGUpKSxZKGUsZS5sX2Rlc2MpLFkoZSxlLmRfZGVzYyksYT1mdW5jdGlvbihlKXt2YXIgdDtmb3IoWChlLGUuZHluX2x0cmVlLGUubF9kZXNjLm1heF9jb2RlKSxYKGUsZS5keW5fZHRyZWUsZS5kX2Rlc2MubWF4X2NvZGUpLFkoZSxlLmJsX2Rlc2MpLHQ9Yy0xOzM8PXQmJjA9PT1lLmJsX3RyZWVbMipTW3RdKzFdO3QtLSk7cmV0dXJuIGUub3B0X2xlbis9MyoodCsxKSs1KzUrNCx0fShlKSxpPWUub3B0X2xlbiszKzc+Pj4zLChzPWUuc3RhdGljX2xlbiszKzc+Pj4zKTw9aSYmKGk9cykpOmk9cz1yKzUscis0PD1pJiYtMSE9PXQ/SihlLHQscixuKTo0PT09ZS5zdHJhdGVneXx8cz09PWk/KFAoZSwyKyhuPzE6MCksMyksSyhlLHosQykpOihQKGUsNCsobj8xOjApLDMpLGZ1bmN0aW9uKGUsdCxyLG4pe3ZhciBpO2ZvcihQKGUsdC0yNTcsNSksUChlLHItMSw1KSxQKGUsbi00LDQpLGk9MDtpPG47aSsrKVAoZSxlLmJsX3RyZWVbMipTW2ldKzFdLDMpO1YoZSxlLmR5bl9sdHJlZSx0LTEpLFYoZSxlLmR5bl9kdHJlZSxyLTEpfShlLGUubF9kZXNjLm1heF9jb2RlKzEsZS5kX2Rlc2MubWF4X2NvZGUrMSxhKzEpLEsoZSxlLmR5bl9sdHJlZSxlLmR5bl9kdHJlZSkpLFcoZSksbiYmTShlKX0sci5fdHJfdGFsbHk9ZnVuY3Rpb24oZSx0LHIpe3JldHVybiBlLnBlbmRpbmdfYnVmW2UuZF9idWYrMiplLmxhc3RfbGl0XT10Pj4+OCYyNTUsZS5wZW5kaW5nX2J1ZltlLmRfYnVmKzIqZS5sYXN0X2xpdCsxXT0yNTUmdCxlLnBlbmRpbmdfYnVmW2UubF9idWYrZS5sYXN0X2xpdF09MjU1JnIsZS5sYXN0X2xpdCsrLDA9PT10P2UuZHluX2x0cmVlWzIqcl0rKzooZS5tYXRjaGVzKyssdC0tLGUuZHluX2x0cmVlWzIqKEFbcl0rdSsxKV0rKyxlLmR5bl9kdHJlZVsyKk4odCldKyspLGUubGFzdF9saXQ9PT1lLmxpdF9idWZzaXplLTF9LHIuX3RyX2FsaWduPWZ1bmN0aW9uKGUpe1AoZSwyLDMpLEwoZSxtLHopLGZ1bmN0aW9uKGUpezE2PT09ZS5iaV92YWxpZD8oVShlLGUuYmlfYnVmKSxlLmJpX2J1Zj0wLGUuYmlfdmFsaWQ9MCk6ODw9ZS5iaV92YWxpZCYmKGUucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPTI1NSZlLmJpX2J1ZixlLmJpX2J1Zj4+PTgsZS5iaV92YWxpZC09OCl9KGUpfX0seyIuLi91dGlscy9jb21tb24iOjQxfV0sNTM6W2Z1bmN0aW9uKGUsdCxyKXsidXNlIHN0cmljdCI7dC5leHBvcnRzPWZ1bmN0aW9uKCl7dGhpcy5pbnB1dD1udWxsLHRoaXMubmV4dF9pbj0wLHRoaXMuYXZhaWxfaW49MCx0aGlzLnRvdGFsX2luPTAsdGhpcy5vdXRwdXQ9bnVsbCx0aGlzLm5leHRfb3V0PTAsdGhpcy5hdmFpbF9vdXQ9MCx0aGlzLnRvdGFsX291dD0wLHRoaXMubXNnPSIiLHRoaXMuc3RhdGU9bnVsbCx0aGlzLmRhdGFfdHlwZT0yLHRoaXMuYWRsZXI9MH19LHt9XSw1NDpbZnVuY3Rpb24oZSx0LHIpeyhmdW5jdGlvbihlKXshZnVuY3Rpb24ocixuKXsidXNlIHN0cmljdCI7aWYoIXIuc2V0SW1tZWRpYXRlKXt2YXIgaSxzLHQsYSxvPTEsaD17fSx1PSExLGw9ci5kb2N1bWVudCxlPU9iamVjdC5nZXRQcm90b3R5cGVPZiYmT2JqZWN0LmdldFByb3RvdHlwZU9mKHIpO2U9ZSYmZS5zZXRUaW1lb3V0P2U6cixpPSJbb2JqZWN0IHByb2Nlc3NdIj09PXt9LnRvU3RyaW5nLmNhbGwoci5wcm9jZXNzKT9mdW5jdGlvbihlKXtwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCl7YyhlKX0pfTpmdW5jdGlvbigpe2lmKHIucG9zdE1lc3NhZ2UmJiFyLmltcG9ydFNjcmlwdHMpe3ZhciBlPSEwLHQ9ci5vbm1lc3NhZ2U7cmV0dXJuIHIub25tZXNzYWdlPWZ1bmN0aW9uKCl7ZT0hMX0sci5wb3N0TWVzc2FnZSgiIiwiKiIpLHIub25tZXNzYWdlPXQsZX19KCk/KGE9InNldEltbWVkaWF0ZSQiK01hdGgucmFuZG9tKCkrIiQiLHIuYWRkRXZlbnRMaXN0ZW5lcj9yLmFkZEV2ZW50TGlzdGVuZXIoIm1lc3NhZ2UiLGQsITEpOnIuYXR0YWNoRXZlbnQoIm9ubWVzc2FnZSIsZCksZnVuY3Rpb24oZSl7ci5wb3N0TWVzc2FnZShhK2UsIioiKX0pOnIuTWVzc2FnZUNoYW5uZWw/KCh0PW5ldyBNZXNzYWdlQ2hhbm5lbCkucG9ydDEub25tZXNzYWdlPWZ1bmN0aW9uKGUpe2MoZS5kYXRhKX0sZnVuY3Rpb24oZSl7dC5wb3J0Mi5wb3N0TWVzc2FnZShlKX0pOmwmJiJvbnJlYWR5c3RhdGVjaGFuZ2UiaW4gbC5jcmVhdGVFbGVtZW50KCJzY3JpcHQiKT8ocz1sLmRvY3VtZW50RWxlbWVudCxmdW5jdGlvbihlKXt2YXIgdD1sLmNyZWF0ZUVsZW1lbnQoInNjcmlwdCIpO3Qub25yZWFkeXN0YXRlY2hhbmdlPWZ1bmN0aW9uKCl7YyhlKSx0Lm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLHMucmVtb3ZlQ2hpbGQodCksdD1udWxsfSxzLmFwcGVuZENoaWxkKHQpfSk6ZnVuY3Rpb24oZSl7c2V0VGltZW91dChjLDAsZSl9LGUuc2V0SW1tZWRpYXRlPWZ1bmN0aW9uKGUpeyJmdW5jdGlvbiIhPXR5cGVvZiBlJiYoZT1uZXcgRnVuY3Rpb24oIiIrZSkpO2Zvcih2YXIgdD1uZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aC0xKSxyPTA7cjx0Lmxlbmd0aDtyKyspdFtyXT1hcmd1bWVudHNbcisxXTt2YXIgbj17Y2FsbGJhY2s6ZSxhcmdzOnR9O3JldHVybiBoW29dPW4saShvKSxvKyt9LGUuY2xlYXJJbW1lZGlhdGU9Zn1mdW5jdGlvbiBmKGUpe2RlbGV0ZSBoW2VdfWZ1bmN0aW9uIGMoZSl7aWYodSlzZXRUaW1lb3V0KGMsMCxlKTtlbHNle3ZhciB0PWhbZV07aWYodCl7dT0hMDt0cnl7IWZ1bmN0aW9uKGUpe3ZhciB0PWUuY2FsbGJhY2sscj1lLmFyZ3M7c3dpdGNoKHIubGVuZ3RoKXtjYXNlIDA6dCgpO2JyZWFrO2Nhc2UgMTp0KHJbMF0pO2JyZWFrO2Nhc2UgMjp0KHJbMF0sclsxXSk7YnJlYWs7Y2FzZSAzOnQoclswXSxyWzFdLHJbMl0pO2JyZWFrO2RlZmF1bHQ6dC5hcHBseShuLHIpfX0odCl9ZmluYWxseXtmKGUpLHU9ITF9fX19ZnVuY3Rpb24gZChlKXtlLnNvdXJjZT09PXImJiJzdHJpbmciPT10eXBlb2YgZS5kYXRhJiYwPT09ZS5kYXRhLmluZGV4T2YoYSkmJmMoK2UuZGF0YS5zbGljZShhLmxlbmd0aCkpfX0oInVuZGVmaW5lZCI9PXR5cGVvZiBzZWxmP3ZvaWQgMD09PWU/dGhpczplOnNlbGYpfSkuY2FsbCh0aGlzLCJ1bmRlZmluZWQiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDoidW5kZWZpbmVkIiE9dHlwZW9mIHNlbGY/c2VsZjoidW5kZWZpbmVkIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxMF0pKDEwKX0pOw==";

