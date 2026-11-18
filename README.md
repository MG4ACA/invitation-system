# 25 Years Get-together — Digital Invitation

## Add your artwork (optional – built-in SVG versions show until then)
Drop transparent PNGs into `assets/` with these exact names:
- `baubles-top.png`  – hanging red & black ornaments (full width, top-aligned)
- `crest-25-years.png` – silver crown + "25 Years" + lime "Get together party" (portrait, ~540x650 ratio)
- `dresscode-man.png`, `dresscode-woman.png` – cut-outs (bottom-aligned)

## Deploy
```
npm i -g firebase-tools
firebase login
firebase init hosting     # or: firebase projects:create 25years-raj-2026   (pick any free ID)
firebase deploy
```
The site URL is `https://<project-id>.web.app`. Suggested IDs: `25years-getTogether-raj` (lowercase: `25years-gettogether-raj`) or `raj-25years-2026`. The page auto-detects its own URL, so nothing in the code needs changing.

## Personalised links
`https://<your-site>/?guest=Raj+Kumar+Family`  (alias `?g=`)
Open `https://<your-site>/?admin=1` to paste all guest names and copy each link.

## Edit details
Event time, map link and QR target are in the `CFG` block at the top of `app.js`.
