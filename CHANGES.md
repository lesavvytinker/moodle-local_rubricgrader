# Changelog — local_rubricgrader

## 0.26 (2026-10-05)

- Fixed: the Rubric Grading Summary (standard/legacy rubric formats) could show the wrong score for a selected cell — e.g. a criterion actually graded at 2.5 marks displaying as 7.5 — whenever two criterion rows in the same rubric used different point scales (such as a 20-mark criterion alongside 10-mark ones). The summary matched each cell to its column by its raw score value against a map built from just one "first" row, so a value that happened to reappear in a different column of that first row (7.5 there vs. 2.5 in the actual row) got misattributed. Column matching is now positional first (each row's own cell at that physical position), falling back to the old value-matching only for a row that genuinely has fewer cells than the header.

## 0.25 (2026-10-04)

- Added support for Checklist mode's new "All checked or 0" section option (local_rubricbuilder 0.15+): a section flagged that way is now scored as one all-or-nothing block — its full points only if every item in it is checked, otherwise 0 for the whole section — instead of totalling each item on its own. The Checklist Summary now shows a small note next to each such section's heading saying whether it was awarded in full or scored 0. Sections without the flag total exactly as before, one item at a time.

## 0.24 (2026-09-29)

- Scores and totals now display to 2 decimal places everywhere, instead of 1 — Marking Guide's score input field, its confirmed values, and all three modes' generated feedback summaries (score badges, "out of X", and total rows). The Mark field itself was already scaling to 2 decimals; this brings the on-screen display in line with it.

## 0.23 (2026-09-29)

- Fixed Split View's student-name detection (0.22) not finding any names on Moodle's quiz manual-grading report page, so the "Jump to…" list came up empty on pages with multiple submissions. That page identifies each response with a plain-text (non-link) heading reading "Attempt number N for Full Name (email)" — a different pattern than the profile-link heuristic 0.22 relied on. Now matches that heading directly, checking both just before a response and inside it (the two layouts seen so far differ on which).

## 0.22 (2026-09-29)

- Split View now labels each student's response with a sticky name banner (pinned to the top of the left pane while that student's submission is in view, so it never scrolls away — the next student's banner takes over once you scroll past). Added a "Jump to…" dropdown in the left pane's top bar listing every detected student on the page, so you can go straight to any submission on a multi-student grading page instead of scrolling to find it. Names are detected heuristically — via the student's profile-page link or picture alt text found immediately before their response in the page — since Moodle doesn't expose one reliable class name for this across versions/themes; if a name can't be detected for a given response, it's simply left unlabelled rather than guessed at.

## 0.21 (2026-09-29)

- Fixed: Marking Guide mode wasn't scaling its total to the question's actual max mark — it wrote the raw rubric total straight into the Mark field even when the rubric's own total (e.g. 14) didn't match the question's max (e.g. 15). Rubric and Checklist modes already scaled correctly; Marking Guide's two calls into the mark-writing logic were both missing the rubric's max-possible value, so the `if (maxPossible > 0)` scaling check never ran for it. Fixed both the confirmed-row total and the live-while-typing preview.

## 0.20 (2026-09-29)

- The per-criterion comment box is now bigger by default: 4 rows instead of 2, wider (up to 420px instead of 260px), larger padding and text. Still resizable by dragging the corner.

## 0.19 (2026-09-29)

- Removed the manual "Rescale mark" widget (the "enter the question's max mark, click Rescale" box that used to sit under every table). Grading already auto-detects the question's actual max mark and scales the rubric total into it automatically on every click via `updateMarkFieldForTable()`, so the manual fallback had become dead weight. Also removed its now-unused helper function, lang strings, and CSS.

## 0.18 (2026-09-29)

- Fixed: the per-criterion comment toggle's own "Add comment"/"Save"/"Remove" button text was leaking into the Rubric summary's criterion names (e.g. "Introduction 💬 Add commentSaveRemove (6 marks)"). jQuery's `.text()` includes text from `display:none` elements, and the toggle sits inside the same criterion cell that grading reads the criterion name from — so even hidden, its button labels were being read as part of the name. Every place that reads a criterion/item cell's text now strips the injected comment controls first via a new `cellTextExcludingComment()` helper. Affects Rubric (standard, legacy, and weighted) most visibly; Marking Guide's description-extraction fallback was fixed the same way as a precaution, though its primary extraction path wasn't affected.

## 0.17 (2026-09-29)

- Fixed: Save and Remove on a per-criterion comment (0.16) closed the box but didn't actually refresh the grading summary already written into the comment box — that only happened when a score cell was next clicked, so a comment added or removed after grading appeared to do nothing until the mark was touched. Save and Remove now both re-trigger the same write the score cells do, so the comment box updates immediately.

## 0.16 (2026-09-29)

- Added explicit Save and Remove buttons under each per-criterion comment box (introduced in 0.15), so closing a note no longer requires clicking away from it elsewhere on the page. Save closes the box and marks the toggle as having a saved comment (shown with a highlighted state, and "Edit comment" instead of "Add comment"); Remove clears the text and closes the box.

## 0.15 (2026-09-28)

- Added an optional per-criterion comment: a small "Add comment" toggle now appears next to every criterion/item label (Rubric, Marking Guide and Checklist alike). Clicking it reveals a short textarea for a note on that specific criterion — nothing is shown by default and nothing is required. The "Criterion-specific comments" column in the generated feedback summary is now only included if at least one comment was actually entered for that student, instead of always shipping an empty column as before.

## 0.14 (2026-09-15)

- Fixed the "Checklist Summary"/"Marking Guide Summary"/"Rubric Grading Summary" title and the closing "Overall comments:" text always showing the Rubric colour regardless of which mode actually generated the summary — they shared one generic CSS rule left over from before per-mode theming existed. Each now explicitly uses its own mode's colour, matching the rest of that summary table.

## 0.13 (2026-09-08)

- Added admin settings (Site administration → Plugins → Local plugins → Rubric Grader): a colour picker for each of the three modes — Rubric, Marking Guide, Checklist. Drives the grading interface's header rows, selected/achieved-item colours, and total rows, plus the same colours baked into the student-facing feedback summary at the moment it's written (so the colour is fixed to whatever the admin had set at grading time, and doesn't depend on this plugin being loaded later when the student views their own feedback). Independent of Rubric Builder's own colour settings of the same name, since either plugin works standalone.

## 0.12 (2026-09-08)

- Reworked Checklist mode grading to match Rubric mode's click-a-value interaction: click an item's "Achieved" cell to award its full points (click again to undo), rather than typing a score and confirming. Removed partial credit and the per-item remark field entirely — an item is either achieved or it isn't. Student-facing summary now shows a clear achieved/not-achieved indicator per item instead of a remark column.

## 0.11 (2026-09-08)

- Added grading support for the new **Checklist** mode from Rubric Builder 0.12: click-to-confirm partial-credit scoring per item (same "type a score, confirm" UX as Marking Guide), automatic mark-field totalling, and a dedicated student-facing summary grouped by section, including each item's remark. Uses entirely dedicated `rgdr-cl-*` selectors throughout rather than sharing Marking Guide's classes, specifically to avoid any risk of cross-talk with existing unscoped `.rs-score-input`/`.rs-max-input` queries elsewhere in this file.

## 0.10 (2026-09-08)

- README: added a more prominent note on the relationship with the companion `local_rubricbuilder` plugin — this plugin is designed to work with rubrics built there, and installing both gives the complete experience.

## 0.9 (2026-09-04)

- Externalized every user-facing string — the rescale widget, split-view controls, and the grading summary tables written into the student-facing Comment box — into `lang/en/local_rubricgrader.php`, per the Moodle Marketplace guideline against hardcoded text. Strings are resolved via `get_string()` in `lib.php` and passed to `rubric-optimized.js` as a `window.RG_STRINGS` object, read fresh on every use (not cached at script-load time, avoiding the same load-order race fixed earlier in `local_rubricbuilder`'s sesskey handling). The three duplicated "1 mark"/"N marks" pluralization patterns are now a single shared `markLabel()` helper. Internal developer console logging was deliberately left untouched, since it's never seen by end users.
- Removed ~135 lines of confirmed-dead code (`updateTotal`, `updateMarkField`, `updateVisualFeedback` — the pre-split-view single-table versions, superseded by their `*ForTable` equivalents and never called from anywhere in the codebase). This was flagged during the original code audit and is now actually cleaned up rather than just documented.

## 0.8 (2026-09-04)

- Bumped `$plugin->requires` from Moodle 4.1 (security support ended Nov 2025 — no longer maintained) to Moodle 4.5 LTS, a version this plugin has actually been tested against.

## 0.7 (2026-09-04)

- Renamed all purely-dynamic UI class names (rescale widget, split view, hover/selected states, summary and feedback tables, badge markers — none of which are ever stored in question content) from the generic `rs-` prefix to a properly namespaced `rgdr-` prefix, per Moodle Marketplace's CSS-namespacing guideline. Structural classes shared with `local_rubricbuilder`'s generated rubric HTML (`rs-cell`, `rs-crit`, `rs-score-cell`, etc.) were deliberately left unchanged, since renaming them would break every rubric already inserted into a question — those stay as `rs-*` for backward compatibility. The rubric table's root element now also carries an additional `rgdr-table`/`rgdr-rubric`/`rgdr-marking-guide` class (added by `local_rubricbuilder` 0.7+) which this plugin's CSS matches alongside the legacy names.

## 0.6 (2026-09-03)

- Generalized automatic mark scaling to work for any rubric total, not just rubrics that happen to total exactly 100. Previously, a rubric totalling e.g. 60 or 24 would have its raw total written straight into the mark field with no conversion, which was only correct if that total happened to already equal the question's actual max mark. It now scales proportionally to the question's real max mark whenever they differ, regardless of what the rubric totals — making the manual "Rescale mark" widget unnecessary for normal use.

## 0.5 (2026-09-03) — CRITICAL FIX

- Fixed the actual root cause of grading summaries not appearing in the Comment box after selecting rubric criteria: `findMarkInput()` was called from two places (the mark-field fallback search, and `readQuestionMaxMark`) but was never defined anywhere in this file. Calling it threw an uncaught error, and because it happened inside a synchronous call chain, that error silently prevented everything after it — including the entire comment-box write — from running, with no visible error to the marker. This is specifically triggered whenever a rubric's total is exactly 100 (the common case), since that's what triggers the percentage-to-marks scaling logic that calls it.
- Also isolated the mark-field update and the comment-box write into independent try/catch blocks, so a future bug in either one can no longer silently prevent the other from running.

## 0.4 (2026-09-03)

- Fixed the grading summary not visibly appearing in the Comment box after selecting rubric criteria. The editor lookup previously matched a textarea's `id` string against `tinyMCE.get(id)`; if that string match failed for any reason, the code silently fell back to writing the raw `<textarea>` value, which updates hidden data but never updates what's actually rendered on screen. Editor lookup is now done by matching the actual DOM element via `tinyMCE.editors`, which can't be thrown off by an id-naming mismatch. Also fixed the single-question-page fallback preferring the ambiguous `tinyMCE.activeEditor` over the specific comment textarea's own editor instance.

## 0.3 (2026-09-03)

- Fixed the maximum-possible score for standard rubrics being calculated only from criterion rows that already had a cell selected, rather than every row in the rubric. This caused an incomplete rubric to display a misleadingly "complete-looking" total (e.g. 90/90 instead of the correct 90/100) whenever a criterion hadn't been graded yet.
- Fixed `writeToCommentArea` potentially writing a rubric grading summary into the wrong student's or question's comment box on pages that show more than one at once (e.g. the grading report), by removing the page-wide pixel-proximity fallback in favour of strict container scoping.

## 0.2 (2026-05-25)

- Added split view: student response on left, grading interface on right.
- Added score badge display on rubric cells (visible to students in feedback).
- Added rescale mark widget below rubrics.
- Added support for new `rs-rubric` class format generated by local_rubricbuilder.
- Fixed summary table rendering in student comment box for both legacy and new rubric formats.
- Fixed CSS loading to resolve MIME type issues.
- Added Privacy API implementation for GDPR compliance.
- Added PHPDoc comments to all PHP functions.
- Bumped maturity to MATURITY_BETA.

## 0.1 (2026-02-05)

- Initial release.
- Interactive rubric cell selection with score totalling.
- Marking guide score input with confirm button.
- Automatic student feedback summary written to comment box.
- Mark field auto-populated on cell selection.
