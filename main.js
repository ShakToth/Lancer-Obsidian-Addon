const { Plugin, ItemView, WorkspaceLeaf, Notice, MarkdownPostProcessorContext, Platform } = require('obsidian');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { Buffer } = require('buffer');

const LCP_PARSER_PYTHON_BASE64 = "aW1wb3J0IHN5cwppbXBvcnQgemlwZmlsZQppbXBvcnQganNvbgppbXBvcnQgb3MKaW1wb3J0IHJlCgpkZWYgc3RyaXBfaHRtbCh0ZXh0KToKICAgIGlmIG5vdCBpc2luc3RhbmNlKHRleHQsIHN0cik6CiAgICAgICAgcmV0dXJuICIiCiAgICByZXR1cm4gcmUuc3ViKCc8W148XSs+JywgJycsIHRleHQpCgpkZWYgcHJvY2Vzc19ucGNfY2xhc3Nlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QpOgogICAgdGFyZ2V0X2RpciA9IG9zLnBhdGguam9pbih2YXVsdF9wYXRoLCAiMDBfUmVnZWxuIiwgIkZlaW5kX1N0YXRibG9ja3MiKQogICAgb3MubWFrZWRpcnModGFyZ2V0X2RpciwgZXhpc3Rfb2s9VHJ1ZSkKICAgIAogICAgdHJ5OgogICAgICAgIGNsYXNzZXMgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX2NsYXNzZXMuanNvbiIpLmRlY29kZSgidXRmLTgiKSkKICAgIGV4Y2VwdCBLZXlFcnJvcjoKICAgICAgICByZXR1cm4KICAgICAgICAKICAgIGZvciBucGMgaW4gY2xhc3NlczoKICAgICAgICBuYW1lID0gbnBjLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICBzdGF0cyA9IG5wYy5nZXQoInN0YXRzIiwge30pCiAgICAgICAgaHAgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJocCIsIFswXSkpKQogICAgICAgIGV2YXNpb24gPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJldmFkZSIsIFswXSkpKQogICAgICAgIGVkZWYgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJlZGVmIiwgWzBdKSkpCiAgICAgICAgYXJtb3IgPSAiLCAiLmpvaW4obWFwKHN0ciwgc3RhdHMuZ2V0KCJhcm1vciIsIFswXSkpKQogICAgICAgIHNwZWVkID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic3BlZWQiLCBbMF0pKSkKICAgICAgICBzZW5zb3JzID0gIiwgIi5qb2luKG1hcChzdHIsIHN0YXRzLmdldCgic2Vuc29yIiwgWzBdKSkpCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gPSAiIyMg4pqU77iPIEJhc2lzLVdhZmZlbiAmIFN5c3RlbWVcbiIKICAgICAgICBiYXNlX2ZlYXR1cmVzID0gbnBjLmdldCgiYmFzZV9mZWF0dXJlcyIsIFtdKQogICAgICAgIGZvciBmX2lkIGluIGJhc2VfZmVhdHVyZXM6CiAgICAgICAgICAgIGlmIGZfaWQgaW4gZmVhdHVyZV9kaWN0OgogICAgICAgICAgICAgICAgZiA9IGZlYXR1cmVfZGljdFtmX2lkXQogICAgICAgICAgICAgICAgZl9uYW1lID0gZi5nZXQoIm5hbWUiLCAiVW5rbm93biIpCiAgICAgICAgICAgICAgICBmX3R5cGUgPSBmLmdldCgidHlwZSIsICJUcmFpdCIpCiAgICAgICAgICAgICAgICB3X3R5cGUgPSBmLmdldCgid2VhcG9uX3R5cGUiLCAiIikKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgaWYgZl90eXBlID09ICJXZWFwb24iOgogICAgICAgICAgICAgICAgICAgIGF0dF9ib251cyA9IGYuZ2V0KCJhdHRhY2tfYm9udXMiLCBbMF0pWzBdCiAgICAgICAgICAgICAgICAgICAgZG1nX2xpc3QgPSBmLmdldCgiZGFtYWdlIiwgW10pCiAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9ICIiCiAgICAgICAgICAgICAgICAgICAgaWYgZG1nX2xpc3Q6CiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBkbWdfbGlzdFswXQogICAgICAgICAgICAgICAgICAgICAgICBkbWdfdmFsID0gZC5nZXQoImRhbWFnZSIsIFswXSlbMF0gaWYgaXNpbnN0YW5jZShkLmdldCgiZGFtYWdlIiksIGxpc3QpIGVsc2UgZC5nZXQoInZhbCIsIDApCiAgICAgICAgICAgICAgICAgICAgICAgIGRtZ190eXBlID0gZC5nZXQoInR5cGUiLCAiIikKICAgICAgICAgICAgICAgICAgICAgICAgZG1nX3N0ciA9IGYie2RtZ192YWx9IHtkbWdfdHlwZX0iCiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gKz0gZiItICoqe2ZfbmFtZX0qKiAoe3dfdHlwZX0pXG4gIC0gQW5ncmlmZjogK3thdHRfYm9udXN9IHwgU2NoYWRlbjoge2RtZ19zdHJ9XG4iCiAgICAgICAgICAgICAgICBlbHNlOgogICAgICAgICAgICAgICAgICAgIGVmZmVjdCA9IHN0cmlwX2h0bWwoZi5nZXQoImVmZmVjdCIsICIiKSkKICAgICAgICAgICAgICAgICAgICBpZiBsZW4oZWZmZWN0KSA+IDMwMDoKICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0ID0gZWZmZWN0WzoyOTddICsgIi4uLiIKICAgICAgICAgICAgICAgICAgICBmZWF0dXJlc19tYXJrZG93biArPSBmIi0gKip7Zl9uYW1lfSoqICh7Zl90eXBlfSlcbiAgLSB7ZWZmZWN0fVxuIgoKICAgICAgICBmYWxsYmFja19jb250ZW50ID0gZiJcIlwiXCItLS1cbnRhZ3M6XG4gIC0gTlBDX0NsYXNzXG5IUDoge2hwfVxuQXJtb3I6IHthcm1vcn1cbkV2YXNpb246IHtldmFzaW9ufVxuRS1EZWZlbnNlOiB7ZWRlZn1cblNwZWVkOiB7c3BlZWR9XG5TZW5zb3IgUmFuZ2U6IHtzZW5zb3JzfVxuLS0tXG4jIHtuYW1lfVxuXG57e3t7TEFOQ0VSX1NUQVRTfX19fVxuXG4qKERpZXNlIE5vdGl6IHd1cmRlIGF1dG9tYXRpc2NoIGF1cyBlaW5lciBMQ1AtRGF0ZWkgZXh0cmFoaWVydC4pKlxuXG4tLS1cbioqSW5kZXg6KiogW1tJbmRleF9GZWluZF9TdGF0YmxvY2tzXV1cblwiXCJcIiIKICAgICAgICAKICAgICAgICB0ZW1wbGF0ZV9wYXRoID0gb3MucGF0aC5qb2luKHZhdWx0X3BhdGgsICI5OV9URU1QTEFURVMiLCAiVGVtcGxhdGVfTWVjaC5tZCIpCiAgICAgICAgdGVtcGxhdGVfdGV4dCA9IGZhbGxiYWNrX2NvbnRlbnQKICAgICAgICBpZiBvcy5wYXRoLmV4aXN0cyh0ZW1wbGF0ZV9wYXRoKToKICAgICAgICAgICAgd2l0aCBvcGVuKHRlbXBsYXRlX3BhdGgsICJyIiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgdGY6CiAgICAgICAgICAgICAgICB0ZW1wbGF0ZV90ZXh0ID0gdGYucmVhZCgpCiAgICAgICAgICAgIAogICAgICAgICAgICB5YW1sX3JlZ2V4ID0gcmUuY29tcGlsZShyIl4tLS1cbihbXHNcU10qPylcbi0tLSIpCiAgICAgICAgICAgIG1hdGNoID0geWFtbF9yZWdleC5zZWFyY2godGVtcGxhdGVfdGV4dCkKICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxudGFnczpcbiAgLSBOUENfQ2xhc3NcbkhQOiB7aHB9XG5Bcm1vcjoge2FybW9yfVxuRXZhc2lvbjoge2V2YXNpb259XG5FLURlZmVuc2U6IHtlZGVmfVxuU3BlZWQ6IHtzcGVlZH1cblNlbnNvciBSYW5nZToge3NlbnNvcnN9XG4iCiAgICAgICAgICAgIGlmIG1hdGNoOgogICAgICAgICAgICAgICAgbWVyZ2VkX3lhbWwgPSBmIi0tLVxue21hdGNoLmdyb3VwKDEpfVxuSFA6IHtocH1cbkFybW9yOiB7YXJtb3J9XG5FdmFzaW9uOiB7ZXZhc2lvbn1cbkUtRGVmZW5zZToge2VkZWZ9XG5TcGVlZDoge3NwZWVkfVxuU2Vuc29yIFJhbmdlOiB7c2Vuc29yc31cbi0tLSIKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSB5YW1sX3JlZ2V4LnN1YihtZXJnZWRfeWFtbCwgdGVtcGxhdGVfdGV4dCwgMSkKICAgICAgICAgICAgZWxzZToKICAgICAgICAgICAgICAgIHRlbXBsYXRlX3RleHQgPSBtZXJnZWRfeWFtbCArICItLS1cbiIgKyB0ZW1wbGF0ZV90ZXh0CgogICAgICAgIHN0YXRzX2Jsb2NrID0gZiJgbGFuY2VyLXN0YXRzXG7wn5OKIEJhc2lzLVN0YXRzXG5IUDoge2hwfVxuQXJtb3I6IHthcm1vcn1cbkV2YXNpb246IHtldmFzaW9ufVxuRS1EZWZlbnNlOiB7ZWRlZn1cblNwZWVkOiB7c3BlZWR9XG5TZW5zb3IgUmFuZ2U6IHtzZW5zb3JzfVxuYFxue2ZlYXR1cmVzX21hcmtkb3dufSIKCiAgICAgICAgY29udGVudCA9IHRlbXBsYXRlX3RleHQKICAgICAgICBpZiAie3tMQU5DRVJfU1RBVFN9fSIgaW4gY29udGVudDoKICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgie3tMQU5DRVJfU1RBVFN9fSIsIHN0YXRzX2Jsb2NrKQogICAgICAgIGVsc2U6CiAgICAgICAgICAgIGNvbnRlbnQgKz0gIlxuXG4iICsgc3RhdHNfYmxvY2sKICAgICAgICAgICAgCiAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgiPCUgdHAuZmlsZS50aXRsZSAlPiIsIG5hbWUpCiAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgie3tuYW1lfX0iLCBuYW1lKQogICAgICAgIAogICAgICAgIHNhZmVfbmFtZSA9IHJlLnN1YihyJ1s8PjoiL1xcfD8qXScsICcnLCBzdHIobmFtZSkpCiAgICAgICAgZmlsZV9wYXRoID0gb3MucGF0aC5qb2luKHRhcmdldF9kaXIsIGYie3NhZmVfbmFtZX0ubWQiKQogICAgICAgIHdpdGggb3BlbihmaWxlX3BhdGgsICJ3IiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgZmlsZToKICAgICAgICAgICAgZmlsZS53cml0ZShjb250ZW50KQoKZGVmIHByb2Nlc3NfbnBjX3RlbXBsYXRlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QpOgogICAgdGFyZ2V0X2RpciA9IG9zLnBhdGguam9pbih2YXVsdF9wYXRoLCAiMDBfUmVnZWxuIiwgIkZlaW5kX1RlbXBsYXRlcyIpCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgdHJ5OgogICAgICAgIHRlbXBsYXRlcyA9IGpzb24ubG9hZHMoei5yZWFkKCJucGNfdGVtcGxhdGVzLmpzb24iKS5kZWNvZGUoInV0Zi04IikpCiAgICBleGNlcHQgS2V5RXJyb3I6CiAgICAgICAgcmV0dXJuCgogICAgZm9yIHQgaW4gdGVtcGxhdGVzOgogICAgICAgIG5hbWUgPSB0LmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICBkZXNjID0gc3RyaXBfaHRtbCh0LmdldCgiZGVzY3JpcHRpb24iLCAiIikpCiAgICAgICAgCiAgICAgICAgZmVhdHVyZXNfbWFya2Rvd24gPSAiIyMg4pqU77iPIFRlbXBsYXRlIEZlYXR1cmVzXG4iCiAgICAgICAgYmFzZV9mZWF0dXJlcyA9IHQuZ2V0KCJiYXNlX2ZlYXR1cmVzIiwgW10pCiAgICAgICAgZm9yIGZfaWQgaW4gYmFzZV9mZWF0dXJlczoKICAgICAgICAgICAgaWYgZl9pZCBpbiBmZWF0dXJlX2RpY3Q6CiAgICAgICAgICAgICAgICBmID0gZmVhdHVyZV9kaWN0W2ZfaWRdCiAgICAgICAgICAgICAgICBmX25hbWUgPSBmLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICAgICAgICAgIGVmZmVjdCA9IHN0cmlwX2h0bWwoZi5nZXQoImVmZmVjdCIsICIiKSkKICAgICAgICAgICAgICAgIGZlYXR1cmVzX21hcmtkb3duICs9IGYiLSAqKntmX25hbWV9KipcbiAgLSB7ZWZmZWN0fVxuIgogICAgICAgICAgICAgICAgCiAgICAgICAgY29udGVudCA9IGYiLS0tXG50YWdzOlxuICAtIE5QQ19UZW1wbGF0ZVxuLS0tXG4jIHtuYW1lfVxuXG57ZGVzY31cblxue2ZlYXR1cmVzX21hcmtkb3dufSIKICAgICAgICAKICAgICAgICBzYWZlX25hbWUgPSByZS5zdWIocidbPD46Ii9cXHw/Kl0nLCAnJywgc3RyKG5hbWUpKQogICAgICAgIGZpbGVfcGF0aCA9IG9zLnBhdGguam9pbih0YXJnZXRfZGlyLCBmIntzYWZlX25hbWV9Lm1kIikKICAgICAgICB3aXRoIG9wZW4oZmlsZV9wYXRoLCAidyIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGZpbGU6CiAgICAgICAgICAgIGZpbGUud3JpdGUoY29udGVudCkKCmRlZiBwcm9jZXNzX2dlbmVyaWNfanNvbih6LCBmaWxlbmFtZSwgdmF1bHRfcGF0aCk6CiAgICBjYXRlZ29yeSA9IGZpbGVuYW1lLnJlcGxhY2UoJy5qc29uJywgJycpLnRpdGxlKCkKICAgIHRhcmdldF9kaXIgPSBvcy5wYXRoLmpvaW4odmF1bHRfcGF0aCwgIjAwX1JlZ2VsbiIsICJMQ1BfRGF0YSIsIGNhdGVnb3J5KQogICAgCiAgICB0cnk6CiAgICAgICAgZGF0YSA9IGpzb24ubG9hZHMoei5yZWFkKGZpbGVuYW1lKS5kZWNvZGUoInV0Zi04IikpCiAgICBleGNlcHQgRXhjZXB0aW9uOgogICAgICAgIHJldHVybgogICAgICAgIAogICAgaWYgbm90IGlzaW5zdGFuY2UoZGF0YSwgbGlzdCk6CiAgICAgICAgcmV0dXJuCiAgICAgICAgCiAgICBvcy5tYWtlZGlycyh0YXJnZXRfZGlyLCBleGlzdF9vaz1UcnVlKQogICAgCiAgICBmb3IgaXRlbSBpbiBkYXRhOgogICAgICAgIGlmIG5vdCBpc2luc3RhbmNlKGl0ZW0sIGRpY3QpOiBjb250aW51ZQogICAgICAgIG5hbWUgPSBpdGVtLmdldCgibmFtZSIsICJVbmtub3duIikKICAgICAgICAKICAgICAgICB5YW1sX2xpbmVzID0gWyItLS0iXQogICAgICAgIGZvciBrLCB2IGluIGl0ZW0uaXRlbXMoKToKICAgICAgICAgICAgaWYgayBpbiBbIm5hbWUiLCAiZGVzY3JpcHRpb24iLCAiZWZmZWN0Il06IGNvbnRpbnVlCiAgICAgICAgICAgIGlmIGlzaW5zdGFuY2UodiwgKHN0ciwgaW50LCBib29sLCBmbG9hdCkpOgogICAgICAgICAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoZiJ7a306IHt2fSIpCiAgICAgICAgICAgIGVsaWYgaXNpbnN0YW5jZSh2LCBsaXN0KSBhbmQgbGVuKHYpID4gMCBhbmQgaXNpbnN0YW5jZSh2WzBdLCBzdHIpOgogICAgICAgICAgICAgICAgeWFtbF9saW5lcy5hcHBlbmQoZiJ7a306IFt7JywgJy5qb2luKHYpfV0iKQogICAgICAgIHlhbWxfbGluZXMuYXBwZW5kKCItLS0iKQogICAgICAgIAogICAgICAgIHlhbWxfZnJvbnRtYXR0ZXIgPSAiXG4iLmpvaW4oeWFtbF9saW5lcykKICAgICAgICBkZXNjID0gc3RyaXBfaHRtbChpdGVtLmdldCgiZGVzY3JpcHRpb24iLCAiIikpCiAgICAgICAgZWZmZWN0ID0gc3RyaXBfaHRtbChpdGVtLmdldCgiZWZmZWN0IiwgIiIpKQogICAgICAgIAogICAgICAgIGNvbnRlbnQgPSBmInt5YW1sX2Zyb250bWF0dGVyfVxuIyB7bmFtZX1cblxuIgogICAgICAgIGlmIGRlc2M6IGNvbnRlbnQgKz0gZiJ7ZGVzY31cblxuIgogICAgICAgIGlmIGVmZmVjdDogY29udGVudCArPSBmIiMjIyBFZmZlY3RcbntlZmZlY3R9XG4iCiAgICAgICAgCiAgICAgICAgc2FmZV9uYW1lID0gcmUuc3ViKHInWzw+OiIvXFx8PypdJywgJycsIHN0cihuYW1lKSkKICAgICAgICBmaWxlX3BhdGggPSBvcy5wYXRoLmpvaW4odGFyZ2V0X2RpciwgZiJ7c2FmZV9uYW1lfS5tZCIpCiAgICAgICAgd2l0aCBvcGVuKGZpbGVfcGF0aCwgInciLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmaWxlOgogICAgICAgICAgICBmaWxlLndyaXRlKGNvbnRlbnQpCgpkZWYgbWFpbigpOgogICAgaWYgbGVuKHN5cy5hcmd2KSA8IDM6CiAgICAgICAgcHJpbnQoIlVzYWdlOiBweXRob24gbGNwX3BhcnNlci5weSA8bGNwX3BhdGg+IDx2YXVsdF9wYXRoPiIpCiAgICAgICAgc3lzLmV4aXQoMSkKCiAgICBsY3BfcGF0aCA9IHN5cy5hcmd2WzFdCiAgICB2YXVsdF9wYXRoID0gc3lzLmFyZ3ZbMl0KICAgIAogICAgdHJ5OgogICAgICAgIHdpdGggemlwZmlsZS5aaXBGaWxlKGxjcF9wYXRoLCAncicpIGFzIHo6CiAgICAgICAgICAgIHRyeToKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBqc29uLmxvYWRzKHoucmVhZCgibnBjX2ZlYXR1cmVzLmpzb24iKS5kZWNvZGUoInV0Zi04IikpCiAgICAgICAgICAgIGV4Y2VwdCBLZXlFcnJvcjoKICAgICAgICAgICAgICAgIGZlYXR1cmVzX2RhdGEgPSBbXQogICAgICAgICAgICBmZWF0dXJlX2RpY3QgPSB7ZlsiaWQiXTogZiBmb3IgZiBpbiBmZWF0dXJlc19kYXRhfQogICAgICAgICAgICAKICAgICAgICAgICAgZm9yIGYgaW4gei5uYW1lbGlzdCgpOgogICAgICAgICAgICAgICAgaWYgbm90IGYuZW5kc3dpdGgoJy5qc29uJyk6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICBpZiBmID09ICJsY3BfbWFuaWZlc3QuanNvbiI6IGNvbnRpbnVlCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIGYgPT0gIm5wY19jbGFzc2VzLmpzb24iOgogICAgICAgICAgICAgICAgICAgIHByb2Nlc3NfbnBjX2NsYXNzZXMoeiwgdmF1bHRfcGF0aCwgZmVhdHVyZV9kaWN0KQogICAgICAgICAgICAgICAgZWxpZiBmID09ICJucGNfdGVtcGxhdGVzLmpzb24iOgogICAgICAgICAgICAgICAgICAgIHByb2Nlc3NfbnBjX3RlbXBsYXRlcyh6LCB2YXVsdF9wYXRoLCBmZWF0dXJlX2RpY3QpCiAgICAgICAgICAgICAgICBlbGlmIGYgPT0gIm5wY19mZWF0dXJlcy5qc29uIjoKICAgICAgICAgICAgICAgICAgICAjIEhhbmRsZWQgbmF0aXZlbHkgYnkgY2xhc3Nlcy90ZW1wbGF0ZXMgdXN1YWxseSwgYnV0IHdlIGNvdWxkIGR1bXAgaXQgdG9vCiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc19nZW5lcmljX2pzb24oeiwgZiwgdmF1bHRfcGF0aCkKICAgICAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc19nZW5lcmljX2pzb24oeiwgZiwgdmF1bHRfcGF0aCkKICAgICAgICAgICAgCiAgICAgICAgcHJpbnQoIkxDUCBlcmZvbGdyZWljaCBleHRyYWhpZXJ0LiIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiJGZWhsZXI6IHtlfSIpCiAgICAgICAgc3lzLmV4aXQoMSkKCmlmIF9fbmFtZV9fID09ICJfX21haW5fXyI6CiAgICBtYWluKCkNCg==";

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
        let mechWeapons = [];
        let mechSystems = [];
        let pilotWeapons = [];
        let pilotGear = [];
        
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
        
        if (pilot.stats && pilot.stats.max) {
            hp = pilot.stats.max.hp || hp;
            armor = pilot.stats.max.armor || armor;
            evasion = pilot.stats.max.evasion || evasion;
            edef = pilot.stats.max.edef || edef;
            speed = pilot.stats.max.speed || speed;
            sensor = pilot.stats.max.sensorRange || 0;
        }

        // Extract Pilot Loadout
        if (pilot.loadout) {
            if (pilot.loadout.weapons) {
                pilot.loadout.weapons.forEach(w => pilotWeapons.push(w.data?.name || formatId(w.id)));
            }
            if (pilot.loadout.gear) {
                pilot.loadout.gear.forEach(g => pilotGear.push(g.data?.name || formatId(g.id)));
            }
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
            const yamlRegex = /^---\n([\s\S]*?)\n---/;
            const match = templateText.match(yamlRegex);
            let mergedYaml = `---
tags:
  - PC
callsign: "${pilot.callsign}"
name: "${pilot.name}"
hp: ${hp}
armor: ${armor}
evasion: ${evasion}
edef: ${edef}
speed: ${speed}
sensor: ${sensor}
`;
            if (match) {
                // Keep the template's YAML, just append our stats
                mergedYaml = `---\n${match[1]}\ncallsign: "${pilot.callsign}"\nname: "${pilot.name}"\nhp: ${hp}\narmor: ${armor}\nevasion: ${evasion}\nedef: ${edef}\nspeed: ${speed}\nsensor: ${sensor}\n---`;
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
\`\`\`

### Mech Loadout
**Weapons:**
${mechWeapons.length > 0 ? mechWeapons.map(w => `- [${w.mount}] ${w.name}`).join("\n") : "- None"}

**Systems:**
${mechSystems.length > 0 ? mechSystems.map(s => `- ${s}`).join("\n") : "- None"}

### Pilot Loadout
**Weapons:** ${pilotWeapons.length > 0 ? pilotWeapons.join(", ") : "None"}
**Gear:** ${pilotGear.length > 0 ? pilotGear.join(", ") : "None"}

## Licenses & Talents
`;
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
        }

        let content = templateText;
        if (content.includes("{{LANCER_STATS}}")) {
            content = content.replace("{{LANCER_STATS}}", statsBlock);
        } else {
            content += "\n\n" + statsBlock;
        }
        
        // Also auto-replace {{name}} and {{callsign}} if the template uses them instead of Templater
        content = content.replace(/{{name}}/gi, pilot.name);
        content = content.replace(/{{callsign}}/gi, pilot.callsign);

        const existing = this.plugin.app.metadataCache.getFirstLinkpathDest(filename, "");
        if (existing) {
            await this.plugin.app.vault.modify(existing, content);
        } else {
            await this.plugin.app.vault.create(filename, content);
        }
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
                const uint8Array = new Uint8Array(arrayBuffer);
                
                const vaultPath = this.plugin.app.vault.adapter.getBasePath();
                const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', 'lancer-companion');
                const tempLcpPath = path.join(pluginDir, 'temp_import.lcp');
                
                // Write the file to the plugin directory temporarily
                fs.writeFileSync(tempLcpPath, uint8Array);
                
                const pythonScript = path.join(pluginDir, 'lcp_parser.py');
                
                // Ensure python parser exists and is updated, write it from embedded base64 string
                fs.writeFileSync(pythonScript, atob(LCP_PARSER_PYTHON_BASE64), 'utf-8');
                
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
        this.selectedTiers = {}; // { basename: tierIndex }
        this.combatants = []; // array of basenames
        
        // New State for Tabbed & Foundry VTT Style Combat
        this.activeTab = 'roster'; // 'roster' or 'initiative'
        this.isCombatActive = false;
        this.turnIndex = 0; // index in this.combatants
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

        // Clean up combatants list (remove deleted links)
        this.combatants = this.combatants.filter(c => allNpcs[c]);
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
        const inCombat = this.combatants.includes(npc.name);
        
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
            if (inCombat) {
                this.combatants = this.combatants.filter(c => c !== npc.name);
                if (this.turnIndex >= this.combatants.length) this.turnIndex = 0;
            } else {
                this.combatants.push(npc.name);
            }
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

        const activeCombatants = this.combatants.map(c => allNpcs[c]);
        activeCombatants.forEach((npc, index) => {
            if (npc) {
                this.renderInitiativeCard(npc, index, currentFile);
            }
        });
    }

    renderInitiativeCard(npc, index, currentFile) {
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

        const title = card.createEl("div", { text: npc.name.toUpperCase() });
        title.style.fontWeight = "bold";
        title.style.color = "var(--text-normal)";
        title.style.cursor = "pointer";
        title.style.marginBottom = npc.isCombatMech ? "5px" : "0";
        title.onclick = () => this.plugin.app.workspace.getLeaf('tab').openFile(npc.file);

        if (npc.isCombatMech) {
            this.renderMiniGrid(card, npc.name, npc.fm);
        } else {
            let details = [];
            if (npc.fm.fraktion) details.push(npc.fm.fraktion);
            if (npc.fm.rolle) details.push(npc.fm.rolle);
            if (details.length > 0) {
                const sub = card.createEl("div", { text: details.join(" • ") });
                sub.style.fontSize = "0.75em";
                sub.style.color = "var(--text-muted)";
            }
        }
    }

    renderMiniGrid(card, name, stats) {
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

        if (hpArr.length > 1) {
            const toggleContainer = card.createEl("div");
            toggleContainer.style.position = "absolute";
            toggleContainer.style.top = "40px";
            toggleContainer.style.right = "5px";
            toggleContainer.style.display = "flex";
            toggleContainer.style.flexDirection = "column";
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
