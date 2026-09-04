<?php
/**
 * Privacy provider for local_rubricgrader.
 *
 * @package   local_rubricgrader
 * @copyright 2026 Equip English
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GNU GPL v3 or later
 */

namespace local_rubricgrader\privacy;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy provider for local_rubricgrader.
 *
 * This plugin does not store any personal data of its own.
 * It reads existing quiz attempt data (already managed by mod_quiz)
 * and writes teacher-entered marks back to those same attempt records.
 * No additional personal data is created or stored by this plugin.
 */
class provider implements \core_privacy\local\metadata\null_provider {

    /**
     * Returns a reason string explaining why this plugin stores no personal data.
     *
     * @return string The lang string identifier.
     */
    public static function get_reason(): string {
        return 'privacy:metadata';
    }
}
