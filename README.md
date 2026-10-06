# Rubric Grader for Moodle (`local_rubricgrader`)

A local plugin that turns the "Information for graders" rubric on Moodle's manual grading pages into a click-to-grade interface. Markers click rubric cells, enter marking guide scores or tick checklist items; the plugin totals the marks, scales them to the question's maximum, and writes a formatted summary into the student's feedback box.

> **Designed to work with rubrics built using the companion [Rubric Builder](https://github.com/lesavvytinker/moodle-local_rubricbuilder) plugin.** Install both for the complete experience — Rubric Grader activates automatically on any table Rubric Builder generates. It will also work with a hand-coded HTML table using the same CSS classes, but Rubric Builder is by far the easiest way to produce compatible content.

## Features

- **Three grading modes**
  - **Rubric** — click a cell to select it for that criterion; scores are totalled automatically.
  - **Marking Guide** — type a score per criterion and confirm it.
  - **Checklist** — click an item to mark it achieved (click again to undo). Sections can be flagged **"All checked or 0"** in Rubric Builder, so the section scores its full points only if every item in it is ticked.
- **Automatic Mark field** — the total is written to the question's Mark field on every change, scaled to the question's actual maximum mark whenever the rubric's own total differs (e.g. a rubric out of 14 on a question worth 15). Scores display to two decimal places.
- **Student feedback summary** — a formatted summary table is written into the comment box, in the colour of the mode used. Anything you type under "Overall comments:" is kept when the summary is regenerated.
- **Per-criterion comments** — an optional "Add comment" button beside every criterion or item opens a small box for a note on that criterion alone. A "Criterion-specific comments" column appears in the summary only if at least one comment was used.
- **Edit previous marking** — re-opening a response that was already marked loads that marking back into the table (selected cells, scores, ticks and per-criterion comments), so you can bump a mark or add a comment without starting again. Nothing is rewritten until you change something. A notice above the table offers **Start with a clean slate** if you'd rather begin fresh.
- **Split view** — student response on the left, marking interface on the right. Each submission carries a sticky name banner, and a **Jump to…** dropdown takes you straight to any student on a multi-submission page.
- **Configurable colours** — admins can set a colour for each mode under **Site administration → Plugins → Local plugins → Rubric Grader**.

## Requirements

- Moodle 4.5 or higher
- PHP 7.4 or higher
- jQuery (included with Moodle)
- Recommended: the companion [Rubric Builder](https://github.com/lesavvytinker/moodle-local_rubricbuilder) plugin. The "All checked or 0" checklist option needs Rubric Builder 0.15+ to create it and Rubric Grader 0.25+ to score it.

## Installation

1. Download the plugin ZIP file.
2. Go to **Site administration → Plugins → Install plugins**.
3. Upload the ZIP file and follow the on-screen instructions.

Alternatively, extract the `rubricgrader` folder into your Moodle installation's `/local/` directory and visit the site administration page to trigger the upgrade.

After upgrading, purge caches (**Site administration → Development → Purge all caches**) and hard-refresh your browser so the updated JavaScript and CSS load.

## Usage

1. Open the manual grading page for a quiz essay question (**Quiz → Results → Manual grading**, or an individual attempt).
2. The rubric, marking guide or checklist in the question's "Information for graders" becomes interactive.
3. Mark it:
   - **Rubric:** click one cell per criterion.
   - **Marking Guide:** type a score and press Enter or click away to confirm.
   - **Checklist:** click each item the student achieved.
4. The Mark field and the student's comment box update automatically.
5. Optionally add a comment on any individual criterion with its **Add comment** button, then **Save**.
6. Add any overall feedback under "Overall comments:" in the comment box, then save as normal.

### Re-marking a response

If the response already has a saved summary, it is loaded back into the table when you open the page. Change what you need and the summary and Mark field update. To discard it and mark from scratch, click **Start with a clean slate** above the table (this also clears the comment box).

### Split view

Click **Split View** above the question to show the student's response on the left and the marking interface on the right. On pages with several submissions, use the **Jump to…** dropdown in the left panel to go to a particular student; their name stays pinned at the top of their response as you scroll. Click **Exit Split View** (and save first) to return to the normal layout.

## Supported HTML format

The plugin activates on any table with `class="rs-table"` in the grader information box. Supported types:

- `rs-rubric` — scored-cell rubric (`<td class="rs-cell" data-score="X">`). Rows may use different point scales and different numbers of cells.
- `rs-marking-guide` — free-score marking guide (`rs-criterion-row`, `rs-score-input`, `rs-confirm-btn`).
- `rgdr-checklist` — checklist (`rgdr-cl-section-row`, `rgdr-cl-item-row`, `rgdr-cl-item-cell` with `data-score`). Add `data-allornone="1"` to a section row to make that section all-or-nothing.

Use `local_rubricbuilder` to generate compatible HTML without writing it by hand.

## Privacy

This plugin does not store any personal data. It reads quiz attempt data that already exists in Moodle and writes teacher-entered marks and feedback back to that same attempt record. See `classes/privacy/provider.php`.

## Changelog

See `CHANGES.md`.

## License

GNU General Public License v3 or later — see <https://www.gnu.org/licenses/gpl-3.0.html>

## Author

Developed for Equip English. Contributions welcome.
