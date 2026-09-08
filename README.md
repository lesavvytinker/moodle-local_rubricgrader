# Rubric Grader for Moodle (`local_rubricgrader`)

A local plugin that enhances the manual grading interface for quiz essay questions, allowing teachers to click-to-select rubric cells or confirm marking guide scores, with automatic population of the student feedback comment box.

> **Designed to work with rubrics built using the companion [Rubric Builder](https://github.com/lesavvytinker/moodle-local_rubricbuilder) plugin.** Install both for the complete experience — Rubric Grader activates automatically on any rubric table Rubric Builder generates. It will also work with a hand-coded HTML table using the same CSS classes, but in practice Rubric Builder is by far the easiest way to produce compatible content.

## Features

- **Rubric grading** — click a cell in a rubric table to select it; scores are totalled automatically and written to the mark field.
- **Marking guide grading** — type a score per criterion and confirm; weighted totals calculated automatically.
- **Student feedback summary** — selected rubric cells and scores are automatically written into the comment box as a formatted table visible to the student.
- **Split view** — view the student's response on the left and the marking interface on the right simultaneously.
- **Rescale mark** — enter the question's max mark to rescale a percentage-based rubric total to the question's actual mark value.
- **Works with `local_rubricbuilder`** — rubrics built with the companion plugin are fully compatible, but any HTML rubric table with the correct CSS classes will work.

## Requirements

- Moodle 4.5 or higher
- PHP 7.4 or higher
- jQuery (included with Moodle)

## Installation

1. Download the plugin ZIP file.
2. Go to **Site administration → Plugins → Install plugins**.
3. Upload the ZIP file and follow the on-screen instructions.

Alternatively, extract the `rubricgrader` folder into your Moodle installation's `/local/` directory and visit the site administration page to trigger the upgrade.

## Usage

1. Navigate to the manual grading page for a quiz essay question (`/mod/quiz/comment.php`).
2. The rubric or marking guide in the "Information for graders" box becomes interactive.
3. Click a rubric cell to select it, or type and confirm a score in a marking guide row.
4. The student feedback comment box is automatically populated with a grading summary.
5. Add any additional written feedback after completing the rubric.
6. Save as normal.

### Split view

Click the **Split View** button above the rubric to show the student's response in a panel on the left while grading on the right. Click **Exit Split View** (and save first) to return to the normal layout.

### Rescale mark

If your rubric totals to 100 (percentage-based) but the question is worth fewer marks, use the **Rescale mark** widget below the rubric. Enter the question's max mark and click **Rescale** to see the converted score.

## Rubric HTML format

This plugin activates on any table with `class="rs-table"` in the grader information box. Supported sub-types:

- `rs-rubric` — scored-cell rubric (each `<td class="rs-cell" data-score="X">`)
- `rs-marking-guide` — free-score marking guide (`rs-criterion-row`, `rs-score-input`, `rs-confirm-btn`)

Use `local_rubricbuilder` to generate compatible HTML without writing it by hand.

## Privacy

This plugin does not store any personal data. It reads quiz attempt data that already exists in Moodle and writes teacher-entered marks back to that same attempt record. See `classes/privacy/provider.php`.

## Changelog

See `CHANGES.md`.

## License

GNU General Public License v3 or later — see <https://www.gnu.org/licenses/gpl-3.0.html>

## Author

Developed for Equip English. Contributions welcome.
