# Changelog — local_rubricgrader

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
