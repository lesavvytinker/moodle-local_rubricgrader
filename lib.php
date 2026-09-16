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
 * Library functions for local_rubricgrader.
 *
 * @package   local_rubricgrader
 * @copyright 2026 Equip English
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Injects the rubric grader JavaScript and CSS on quiz manual grading pages.
 *
 * Hooked via the before_http_headers callback. Loads jQuery, the main
 * rubric-optimized.js script, and the plugin stylesheet on the following pages:
 * - /mod/quiz/comment.php  (individual question grading)
 * - /mod/quiz/review.php   (attempt review)
 * - /mod/quiz/grading.php  (grading overview)
 * - /mod/quiz/report.php   (grading report, mode=grading)
 *
 * @return void
 */
function local_rubricgrader_before_http_headers(): void {
    global $PAGE;

    $path = $PAGE->url->get_path();
    $mode = optional_param('mode', '', PARAM_ALPHA);

    $isgradingpage =
        strpos($path, '/mod/quiz/comment.php') !== false ||
        strpos($path, '/mod/quiz/review.php') !== false ||
        strpos($path, '/mod/quiz/grading.php') !== false ||
        (strpos($path, '/mod/quiz/report.php') !== false && $mode === 'grading');

    if ($isgradingpage) {
        $PAGE->requires->jquery();

        // All user-facing text in rubric-optimized.js is looked up here via
        // get_string() and handed across as a single JSON object, rather
        // than being hardcoded in the JS itself — the JS has no access to
        // Moodle's string API directly since it isn't an AMD module.
        //
        // Strings with a single {$a} placeholder are resolved with a
        // sentinel '__A__' value (since the real value is only known at
        // runtime in JS), then the sentinel is swapped back for the literal
        // '{$a}' text so the JS can do its own substitution later.
        //
        // Strings with multiple named placeholders ({$a->foo}) use the same
        // trick with an object of sentinel values.
        $sentinelobj = (object) ['score' => '__SCORE__', 'max' => '__MAX__'];
        $strings = [
            'errorcouldnotwrite'      => get_string('js_errorcouldnotwrite', 'local_rubricgrader'),
            'errorinvalidmaxmark'     => get_string('js_errorinvalidmaxmark', 'local_rubricgrader'),
            'errornoscoresyet'        => get_string('js_errornoscoresyet', 'local_rubricgrader'),
            'splitviewbtn'            => get_string('js_splitviewbtn', 'local_rubricgrader'),
            'splitviewbtncollapsed'   => get_string('js_splitviewbtncollapsed', 'local_rubricgrader'),
            'exitsplitviewbtn'        => get_string('js_exitsplitviewbtn', 'local_rubricgrader'),
            'studentresponsereadonly' => get_string('js_studentresponsereadonly', 'local_rubricgrader'),
            'studentresponsetitle'    => get_string('js_studentresponsetitle', 'local_rubricgrader'),
            'rescalemark'             => get_string('js_rescalemark', 'local_rubricgrader'),
            'rescalehint'             => get_string('js_rescalehint', 'local_rubricgrader'),
            'maxmarkforquestion'      => get_string('js_maxmarkforquestion', 'local_rubricgrader'),
            'maxmarkplaceholder'      => get_string('js_maxmarkplaceholder', 'local_rubricgrader'),
            'rescalebtn'              => get_string('js_rescalebtn', 'local_rubricgrader'),
            'rescaleenterinstruction' => get_string('js_rescaleenterinstruction', 'local_rubricgrader', '__A__'),
            'markingguidesummarytitle' => get_string('js_markingguidesummarytitle', 'local_rubricgrader'),
            'criterionheader'         => get_string('js_criterionheader', 'local_rubricgrader'),
            'scoreheader'             => get_string('js_scoreheader', 'local_rubricgrader'),
            'criterionspecificcomments' => get_string('js_criterionspecificcomments', 'local_rubricgrader'),
            'weightpercent'           => get_string('js_weightpercent', 'local_rubricgrader', '__A__'),
            'outofmax'                => get_string('js_outofmax', 'local_rubricgrader', '__A__'),
            'totalrow'                => get_string('js_totalrow', 'local_rubricgrader'),
            'overallcomments'         => get_string('js_overallcomments', 'local_rubricgrader'),
            'rubricgradingsummarytitle' => get_string('js_rubricgradingsummarytitle', 'local_rubricgrader'),
            'onemark'                 => get_string('js_onemark', 'local_rubricgrader'),
            'nmarks'                  => get_string('js_nmarks', 'local_rubricgrader', '__A__'),
            'totalscoreline'          => get_string('js_totalscoreline', 'local_rubricgrader', $sentinelobj),
            'totalscorelinepercent'   => get_string('js_totalscorelinepercent', 'local_rubricgrader', $sentinelobj),
            'checklistsummarytitle'   => get_string('js_checklistsummarytitle', 'local_rubricgrader'),
            'itemheader'              => get_string('js_itemheader', 'local_rubricgrader'),
        ];
        foreach ($strings as $key => $value) {
            $value = str_replace('__A__', '{$a}', $value);
            $value = str_replace('__SCORE__', '{$a->score}', $value);
            $value = str_replace('__MAX__', '{$a->max}', $value);
            $strings[$key] = $value;
        }
        $PAGE->requires->js_init_code(
            'window.RG_STRINGS = ' . json_encode($strings) . ';',
            true
        );

        $PAGE->requires->js(new moodle_url('/local/rubricgrader/rubric-optimized.js'), true);
        // Load CSS via JS to avoid MIME type issues on some server configurations.
        $cssurl = new moodle_url('/local/rubricgrader/styles.css');
        $PAGE->requires->js_init_code(
            '(function(){' .
            'var l=document.createElement("link");' .
            'l.rel="stylesheet";l.type="text/css";' .
            'l.href=' . json_encode($cssurl->out(false)) . ';' .
            'document.head.appendChild(l);' .
            '})();',
            true
        );
    }
}
