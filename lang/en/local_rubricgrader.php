<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Language strings for local_rubricgrader.
 *
 * @package   local_rubricgrader
 * @copyright 2026 Equip English
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname']       = 'Rubric Grader';

// Admin settings (colour customization per mode). Independent of
// local_rubricbuilder's own settings of the same name.
$string['settings_rubriccolor']            = 'Rubric colour';
$string['settings_rubriccolor_desc']       = 'The primary colour used for Rubric mode\'s grading interface and the student-facing feedback summary. Drives the selected-cell colour, the summary table\'s header, and the total row.';
$string['settings_markingguidecolor']      = 'Marking Guide colour';
$string['settings_markingguidecolor_desc'] = 'The primary colour used for Marking Guide mode\'s grading interface and the student-facing feedback summary. Drives the score-cell highlight, the summary table\'s header, and the total row.';
$string['settings_checklistcolor']         = 'Checklist colour';
$string['settings_checklistcolor_desc']    = 'The primary colour used for Checklist mode\'s grading interface and the student-facing feedback summary. Drives the achieved-item colour, the summary table\'s header, and the total row.';
$string['privacy:metadata'] = 'The Rubric Grader plugin does not store any personal data. It reads existing quiz attempt data managed by mod_quiz and writes teacher-entered marks back to those same records.';

// Rubric Grader UI strings (used by rubric-optimized.js via RG_STRINGS).
$string['js_errorcouldnotwrite']    = 'Rubric Grader: could not confidently locate the correct feedback box for this response, so the grading summary was not written automatically. Please copy it into the comment box manually, or reload the page and try again.';
$string['js_splitviewbtn']          = 'Split View — student response on left, mark on right';
$string['js_splitviewbtncollapsed'] = 'Split View';
$string['js_exitsplitviewbtn']      = 'Exit Split View — save first!';
$string['js_studentresponsereadonly'] = 'Student Response (read only)';
$string['js_studentresponsetitle']  = 'Student response';
$string['js_jumptostudent']         = 'Jump to…';
$string['js_markingguidesummarytitle'] = 'Marking Guide Summary';
$string['js_criterionheader']       = 'Criterion';
$string['js_scoreheader']           = 'Score';
$string['js_criterionspecificcomments'] = 'Criterion-specific comments';
$string['js_weightpercent']         = 'weight: {$a}%';
$string['js_outofmax']              = 'out of {$a}';
$string['js_totalrow']              = 'Total';
$string['js_overallcomments']       = 'Overall comments:';
$string['js_rubricgradingsummarytitle'] = 'Rubric Grading Summary';
$string['js_onemark']               = '1 mark';
$string['js_nmarks']                = '{$a} marks';
$string['js_totalscoreline']        = 'Total {$a->score} / {$a->max}';
$string['js_totalscorelinepercent'] = 'Total {$a->score} / {$a->max}%';
$string['js_checklistsummarytitle'] = 'Checklist Summary';
$string['js_itemheader']            = 'Item';
$string['js_addcomment']            = 'Add comment';
$string['js_editcomment']           = 'Edit comment';
$string['js_commentplaceholder']    = 'Comment for this criterion (optional)';
$string['js_save']                  = 'Save';
$string['js_remove']                = 'Remove';
$string['js_allornoneawarded']      = 'all items checked — full marks';
$string['js_allornonenotawarded']   = 'not all items checked — 0 for this section';
