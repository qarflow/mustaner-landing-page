# Strategic Thinking for Growth — Landing Page

Static landing page for the Mustaner programme: **two languages** (EN / AR) and
**two themes** (light / dark). Open `index.html` or serve the folder.

- Local (Laragon): <http://localhost/mustaner/>
- Also works straight from `file://`.

HTML sections live as components under `components/`. After editing them, rebuild:

```powershell
powershell -File scripts/build.ps1
```

---

## Files

```
components/
  layout/                           head, masthead, footer, modal, fab, scripts
  sections/                         hero, quickbar, video … faq, finalcta
scripts/build.ps1                   assembles components/ → index.html
index.html                          built page (what the browser loads)

assets/css/styles.css               stylesheet entry — @imports the modules below
assets/css/base/
       ├─ tokens.css                both colour themes, spacing, depth, radii
       ├─ typography.css            Clash Display (EN) + IBM Plex Sans Arabic (AR)
       ├─ reset.css                 reset, shells, section chrome
       └─ fonts.css                 Clash Display @font-face
assets/css/components/
       ├─ _index.css                imports every component module
       ├─ devices.css               notch, plate, card, button, chip, eyebrow
       ├─ heading.css               slanted section-heading mark
       ├─ masthead.css              fixed overlay header
       ├─ hero.css                  full-bleed hero band
       ├─ quickbar.css              sticky quick-info bar
       ├─ video.css                 9:16 course video device
       ├─ sections.css              overview → final CTA
       ├─ footer.css
       ├─ fab.css                   WhatsApp floating button
       └─ modal.css                 apply form dialog
assets/css/utilities/
       ├─ motion.css                scroll reveal
       └─ rtl.css                   RTL + print
assets/fonts/                       Clash Display woff2 files
assets/js/content.js                ALL copy, both languages — this is the file to edit
assets/js/app.js                    language, theme, form, video, masthead scroll
assets/brand/                       logo, wordmark, slogan and mark, web-sized
assets/media/                       photographs from previous rounds
assets/logos/                       client logos
assets/video/course-intro.mp4       the 9:16 intro video
assets/docs/…Brochure.pdf           what "Download Brochure" serves
```

Edit a section in `components/sections/…`, then run `scripts/build.ps1`.
Edit CSS under `assets/css/` — no rebuild needed for styles.

## Typography

| Role | Font | Source |
|---|---|---|
| English display + body | **Clash Display** | Self-hosted in `assets/fonts/` |
| Arabic (all text) | **IBM Plex Sans Arabic** | Google Fonts |

Stacks and Arabic optical overrides live in `assets/css/base/typography.css`.

## Themes

The page ships **light** and remembers whatever the visitor picks. The toggle sits in
the masthead and again in the footer; the choice is stored in `localStorage` and applied
by a tiny inline script in `<head>` so the page never flashes the wrong theme.

There is deliberately **no system-preference fallback** — a marketing page should look
the same to everyone until they choose otherwise.

To ship dark by default instead, change one line in the `<head>` script of `index.html`
(and in the generator): default `data-theme` to `dark` rather than leaving it unset.

How the two themes are built:

- `base/tokens.css` declares the **light** palette on `:root` and overrides only what
  changes under `:root[data-theme="dark"]`.
- The **gradient plate stays dark in both themes.** It is the brand's own artwork —
  `brand/background.png` is literally a dark plate on a white margin — so in the light
  theme it becomes the page's anchor rather than its ground. The hero, the fees plate
  and the video bezel all use it.
- The **hero is a dark band in both themes.** It re-declares `color` and the ink tokens
  locally, so its whole subtree flips without restyling any child.

Two things that bite when editing themes:

1. `color` inherits as a *computed* value. Redefining `--ink` on a container does **not**
   recolour headings and paragraphs, because they never reference the variable — they
   inherit the ancestor's resolved colour. Re-declare `color` too.
2. Specificity. `.icon-toggle span` (0,1,1) silently out-ranked `.only-dark` (0,1,0) and
   rendered both theme icons at once. Keep the theme-visibility rules unopposed.

## Changing text

Everything is in **`assets/js/content.js`**, as `{ en: {...}, ar: {...} }`.
The English strings also appear in `index.html` (that is deliberate — the page reads
correctly with JavaScript disabled and search engines index real text). So an English
edit needs to happen in **both** files; an Arabic edit only in `content.js`.

The keys are wired to the markup through `data-i18n="path.to.key"`. The two language
objects must keep identical keys and identical array lengths — the toggle walks them
by path.

## Swapping assets

| What | How |
|---|---|
| **Video** | Replace `assets/video/course-intro.mp4`. Keep it portrait; the frame is 9:16. |
| **Video thumbnail** | Add `poster="assets/media/your-thumb.jpg"` to the `<video id="courseVideo">` tag. Without it the browser paints the frame at 0.4s. |
| **Brochure** | Replace the PDF in `assets/docs/` (keep the filename, or update the three `download` links). |
| **Photos** | Drop new files in `assets/media/` and point the five `<figure class="tile …">` images at them. Export with EXIF rotation baked in. |
| **Client logos** | Drop files in `assets/logos/` and copy one `<div class="logo-cell">` block per logo. The grid centres and auto-fits, and the CSS filter unifies them. |
| **Brand marks** | Regenerate from `/brand` — see below. Two copies of each mark ship in the markup (`.only-light` / `.only-dark`) and CSS swaps them, so neither can flash the wrong one. |
| **Testimonials** | In `content.js`, the `testimonials` array in each language. Same length in both. |

### Brand assets

The masters live in `/brand` (untouched). `assets/brand/` holds web-sized exports:

| Export | From | Used for |
|---|---|---|
| `wordmark-color.png` | `colored logo.png` | masthead + footer, light theme |
| `wordmark-white.png` | `white logo.png` | masthead + footer, dark theme |
| `favicon.png` / `mark.png` | `pattern.png` | browser tab + apple-touch-icon **only** |
| `slogan-color.png` / `slogan-white.png` | `slogan.png` | footer lockup |
| `plate.jpg` | `background.png` | reference swatch; the plate itself is CSS |

The masthead lockup is the **wordmark alone**. `pattern.png` is a decorative element,
not a companion mark — placing it beside the wordmark read as two logos, so it was
removed. It survives only as the browser-tab icon, because a square asset is the one
thing a favicon needs and the wordmark is far too wide to crop into one. Supply a
proper square icon mark and it can be swapped in two lines of `<head>`.

The slogan ships as an **image, not text**, on purpose: it carries full vocalisation and
mis-transcribing one letter of a company's own slogan is not a risk worth taking.

The palette is sampled from those files, not guessed:

| | | |
|---|---|---|
| `#116CB5` | primary blue | accents, heading marks (odd sections) |
| `#057A57` | secondary green | accents, heading marks (even sections) |
| `#030303` | heading ink | section titles and display type |
| `#342F28` | body ink | paragraphs and supporting copy |
| `#069E70` / `#1A7FD0` | lifted pair | plate tints + dark-theme accents |

### Logo filter — read this before adding logos

Client logos are filtered through `--logo-filter`, which differs per theme because the
supplied files are **dark marks on a white background** (JPEG, no transparency):

- light theme: `grayscale(1) contrast(1.08)` — keeps the mark dark
- dark theme: `invert(1) grayscale(1) …` — turns the white ground black, the mark light

If you add a **white mark on a transparent PNG**, the dark-theme filter will erase it.
Those need `grayscale(1) brightness(0) invert(1)` instead. Mixing both kinds of file
means splitting the rule by a class.

## CTAs — where each one goes

| Button | Destination |
|---|---|
| Book Now / Reserve Your Seat | the Fawaterk payment link |
| Apply Now | opens the form, then hands the filled details to WhatsApp on `+20 109 271 8547` |
| Download Brochure | the local PDF |
| Floating button | WhatsApp, same number |

The apply form has **no backend**. It composes a message and opens `wa.me`. Nothing is
stored and nothing is sent until the person presses send inside WhatsApp. If you later
want the leads captured server-side, that is the one piece that needs adding.

To change the number, edit `WA_NUMBER` at the top of `app.js` **and** the `href`s in
`index.html`.

## Language

The toggle sets `lang` and `dir` on `<html>` and swaps every bound string. It remembers
the choice in `localStorage`, and first-time visitors whose browser language is Arabic
land on Arabic.

The layout is written entirely in CSS logical properties, so it mirrors without a
separate stylesheet. Two things deliberately do **not** mirror, because they are brand
geometry rather than reading direction:

- the notch bracket frame (green top-right, blue bottom-left — as fixed as a logo)
- the gradient plate diagonal

The hero photo's dark-to-light ramp **does** mirror, so the photo always sits on the
side the text does not occupy.

## Still outstanding

- **Early Bird has no deadline.** A discount with no end date does not create urgency.
  Send one and it can become a countdown.
- **One client logo.** Only Al Rajhi Bank survived extraction from the brochure PDF.
  More logos would materially strengthen the proof section — it is the weakest block
  on the page.
- **Testimonials praise the teaching, not business outcomes.** They are real and they
  are good, but two or three quotes about what someone *did differently afterwards*
  would convert harder. Also confirm the participants are happy to be named publicly —
  the quotes were lifted from the programme group chats via the brochure.
- **No faculty section.** The trainers are named in the participant feedback
  (Dr. Ahmed Magraby, Eng. Fouad Hussien) but the brochure never introduces them.
  Photos and two-line bios would fill the biggest remaining gap versus the INSEAD
  reference, which leads with its programme directors.
- **Venue address.** "New Cairo" is on the page; the actual address is not.
