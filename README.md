# Basic — a boot camp journal

A scrollable, page-per-page reader for my basic training journal (Fort Jackson,
Delta Company / 2nd Platoon, January–March 2026), plus ~100 preset questions that
get answered out of the journal itself with the source pages quoted underneath.

**Open `index.html`.** No build step, no server, no dependencies — double-click it.

---

## What's here

```
index.html            the site
assets/style.css      styling
assets/app.js         all behaviour
source/journal.txt    THE JOURNAL — plain text, the actual source of truth
source/questions.txt  the preset questions and answers, plain text
data/entries.js       generated from source/journal.txt
data/questions.js     generated from source/questions.txt
data/art.js           maps drawings to image files (edit this by hand)
images/               scans of the doodles go here
tools/build.py        source/journal.txt  -> data/entries.js
tools/build_questions.py  source/questions.txt -> data/questions.js
```

105 pages, 41,385 words, 98 questions, 201 verified quotes.

## Adding your doodles

Every drawing the journal mentions renders as an empty slot with an id printed on
it — `p5-1`, `p35-1`, and so on. To fill one:

1. Drop the image in `images/` (e.g. `images/p35-1.jpg` — a phone photo is fine)
2. Add a line to `data/art.js`:
   ```js
   window.ART = {
     "p35-1": { src: "images/p35-1.jpg" },
   };
   ```
3. Reload.

Optional per-slot keys: `caption` (overrides the journal's description), `alt`, `wide`.

There are five slots waiting right now:

| slot | what the journal says |
|---|---|
| `p5-1`  | A drawing of my living room |
| `p5-2`  | A detailed face selfie in pen obscured by darkness, covering half the face |
| `p17-1` | A chart of the AFT score |
| `p35-1` | Drawing of me beating the obstacle course |
| `p64-1` | Drawing of a pencil astronaut floating in space |

If you have drawings the journal never mentions, say which page they belong near
and a new slot can be added to `source/journal.txt` with a `[[art: description]]`
line, then rebuild.

## Editing the journal

`source/journal.txt` is the real document. Each page starts with a metadata line:

```
@@ date=2026-01-29 | approx=yes | head=January 29 | title=Gas chamber | ch=red
```

- `date` — ISO date. `approx=yes` means it was inferred, not written in the notebook;
  the site shows those with a `≈`.
- `head` — the heading exactly as it appears in the notebook (blank if there wasn't one).
- `title` — a short label for navigation. Not from the notebook.
- `ch` — chapter: `reception`, `red`, `hammer`, `range`, `anvil`, `blue`, `forge`, `last`, `home`.

Blank lines separate paragraphs. `[[art: caption]]` makes a drawing slot.

After editing, rebuild:

```bash
python3 tools/build.py
python3 tools/build_questions.py
```

## Editing the questions

`source/questions.txt`:

```
## cat=Category name
?? The question?
An answer paragraph, in my voice.

> p34 | an exact quote from page 34
+ p50 p61
```

`>` lines are pull quotes shown under the answer and linked to the page.
`+` lines add extra "also see" page links.

**Every `>` quote is checked against the journal at build time.** If a quote isn't
really on that page, the build fails and tells you which line. So nothing in the
answers can drift away from what's actually written in the notebook.

## Keyboard

| key | does |
|---|---|
| `J` / `↓` | next page |
| `K` / `↑` | previous page |
| `/` | jump to search |
| `Esc` | clear search |

Deep links work: `index.html#p78` opens a page, `index.html#q-what-was-the-hardest-part`
opens a question.
