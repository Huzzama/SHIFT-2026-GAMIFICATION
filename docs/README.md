# FARO documentation

Three books, in Spanish and English, as Markdown chapters (versioned here) and as PDFs (`docs/pdf/`).

| Book | For whom | Spanish | English |
|---|---|---|---|
| **1 · Security, protocols and data handling** | Institution, IT, jury | `01-seguridad-y-datos/` → `pdf/FARO-1-Seguridad-y-datos.pdf` | `en/01-security-and-data/` → `pdf/FARO-1-Security-and-data.pdf` |
| **2 · User guide** | Students and whoever presents the demo | `02-tutorial-de-uso/` → `pdf/FARO-2-Tutorial-de-uso.pdf` | `en/02-user-guide/` → `pdf/FARO-2-User-guide.pdf` |
| **3 · Technical documentation and Canvas implementation** | Developers and whoever deploys | `03-documentacion-tecnica/` → `pdf/FARO-3-Documentacion-tecnica.pdf` | `en/03-technical-documentation/` → `pdf/FARO-3-Technical-documentation.pdf` |

Each folder has a cover (`00-portada.md` / `00-cover.md`) with the contents and numbered chapters. Chapters read in order but each stands on its own. The two languages have the same structure and the same content.

## Rebuilding the PDFs

```bash
npm install -g marked playwright   # once
node docs/tools/build-pdf.mjs
```

The script concatenates each book's chapters, converts them to HTML with its own print stylesheet and prints them to PDF with Chromium (Playwright). It needs neither LaTeX nor Pandoc.

## Keeping them current

- If a threshold changes in `src/lib/`, change chapter 3 of Book 3 and chapter 8 of Book 2, in both languages.
- If a Canvas path is added, follow the procedure in chapter 5.8 of Book 3 (it includes updating Book 1).
- The **[code] [test] [pending]** marks in Book 1 must reflect the real state of the repository at every delivery.
