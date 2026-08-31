# HTML components

Source of truth for the page markup. Edit these files, then rebuild:

```powershell
powershell -File scripts/build.ps1
```

That regenerates `index.html` (what the browser loads).

```
components/
  layout/          chrome: head, masthead, footer, modal, fab, scripts
  sections/        one file per page section (hero → faq + finalcta)
```

CSS for the same pieces lives under `assets/css/components/`.
Copy strings live in `assets/js/content.js`.
