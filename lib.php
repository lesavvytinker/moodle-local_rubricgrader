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
