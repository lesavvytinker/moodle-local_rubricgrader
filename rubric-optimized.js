(function($) {
    'use strict';

    var RubricGrader = {
        debugMode: true,
        
        log: function(message, data) {
            if (this.debugMode) {
                if (data !== undefined) {
                    console.log('🎯 RubricGrader: ' + message, data);
                } else {
                    console.log('🎯 RubricGrader: ' + message);
                }
            }
        },

        // Looks up a user-facing string from window.RG_STRINGS (populated by
        // lib.php via get_string()). Read fresh on every call rather than
        // cached into a variable at script-load time — the same load-order
        // race we found and fixed in rubric-builder.js's sesskey handling
        // could otherwise apply here too. Falls back to a hardcoded English
        // string only if RG_STRINGS somehow isn't available.
        t: function(key, fallback) {
            return (typeof window.RG_STRINGS !== 'undefined' && window.RG_STRINGS[key] !== undefined)
                ? window.RG_STRINGS[key]
                : fallback;
        },
        // Same as t(), but substitutes a single {$a} placeholder.
        ta: function(key, a, fallback) {
            return this.t(key, fallback).replace('{$a}', a);
        },
        // Same as t(), but substitutes multiple named {$a->xxx} placeholders
        // given as an object, e.g. {score: 5, max: 10}.
        tm: function(key, replacements, fallback) {
            var s = this.t(key, fallback);
            Object.keys(replacements).forEach(function(k) {
                s = s.replace('{$a->' + k + '}', replacements[k]);
            });
            return s;
        },
        // "1 mark" / "{$a} marks" — the same pluralized score label is
        // built in several places, so it's centralised here.
        markLabel: function(score) {
            var n = parseFloat(score);
            return (n === 1) ? this.t('onemark', '1 mark') : this.ta('nmarks', score, '{$a} marks');
        },

        init: function() {
            var self = this;
            self.log('=== INITIALIZING RUBRIC GRADER ===');
            self.log('Current URL: ' + window.location.href);
            self.log('Page path: ' + window.location.pathname);
            
            // Add class to body to enable grading-page-specific CSS
            $('body').addClass('rgdr-grading-page');
            self.log('Added rgdr-grading-page class to body');
            
            $(document).ready(function() {
                self.log('DOM ready');
                
                // Look for rubric tables
                var $tables = $('.rs-table');
                self.log('Found ' + $tables.length + ' table(s) with rs-table class');
                
                // Also check for tables without the class
                var $allTables = $('table');
                self.log('Total tables on page: ' + $allTables.length);
                
                if ($tables.length === 0) {
                    self.log('❌ No tables found with rs-table class');
                    self.log('Listing all tables to help diagnose:');
                    $allTables.each(function(idx) {
                        var classes = $(this).attr('class') || 'none';
                        var id = $(this).attr('id') || 'none';
                        self.log('  Table ' + idx + ': classes="' + classes + '" id="' + id + '"');
                    });
                    return;
                }
                
                $tables.each(function(index) {
                    var $table = $(this);
                    self.log('Processing table ' + (index + 1));
                    self.setupTable($table);
                });
                
                self.setupClickHandlers();
                self.injectSplitViewButton();

                // Auto-expand TinyMCE editor on page load
                self.autoExpandEditorOnLoad();
                
                self.log('✅ Initialization complete!');
                self.log('Hover over cells to see the effect, click to select');
            });
        },
        
        autoExpandEditorOnLoad: function() {
            var self = this;
            self.log('Starting auto-expand checker...');
            
            // Try multiple times as TinyMCE may load after our script
            var attempts = 0;
            var maxAttempts = 20; // Increased attempts
            
            var expandInterval = setInterval(function() {
                attempts++;
                self.log('Auto-expand attempt ' + attempts + '/' + maxAttempts);
                
                // Check for TinyMCE
                if (typeof tinyMCE !== "undefined") {
                    self.log('TinyMCE is defined');
                    
                    if (tinyMCE.activeEditor) {
                        self.log('TinyMCE activeEditor found!');
                        self.expandTinyMCE();
                        clearInterval(expandInterval);
                        return;
                    } else {
                        self.log('TinyMCE defined but no activeEditor yet');
                    }
                    
                    // Try all editors
                    if (tinyMCE.editors && tinyMCE.editors.length > 0) {
                        self.log('Found ' + tinyMCE.editors.length + ' TinyMCE editors');
                        tinyMCE.editors.forEach(function(editor) {
                            self.expandSpecificEditor(editor);
                        });
                        clearInterval(expandInterval);
                        return;
                    }
                }
                
                // Try to find and expand iframe directly
                var $iframe = $('iframe').filter(function() {
                    return $(this).attr('id') && $(this).attr('id').indexOf('editor') !== -1;
                });
                
                if ($iframe.length > 0) {
                    self.log('Found editor iframe directly: ' + $iframe.attr('id'));
                    $iframe.css('height', '1200px');
                    $iframe.closest('.tox-edit-area').css('height', '1200px');
                    clearInterval(expandInterval);
                    return;
                }
                
                // Try textarea
                var $textarea = $('textarea[name*="comment"]');
                if ($textarea.length > 0) {
                    self.log('Found comment textarea');
                    $textarea.attr('rows', 60).css('height', '1200px');
                }
                
                if (attempts >= maxAttempts) {
                    self.log('❌ Auto-expand timeout after ' + maxAttempts + ' attempts');
                    self.log('Available elements:');
                    self.log('  TinyMCE defined: ' + (typeof tinyMCE !== "undefined"));
                    self.log('  Iframes: ' + $('iframe').length);
                    self.log('  Textareas: ' + $('textarea').length);
                    clearInterval(expandInterval);
                }
            }, 300); // Check every 300ms (faster)
        },
        
        expandSpecificEditor: function(editor) {
            var self = this;
            try {
                self.log('Expanding specific editor: ' + editor.id);
                
                // Try iframe
                if (editor.iframeElement) {
                    editor.iframeElement.style.height = '1200px';
                    self.log('  Set iframe height to 1200px');
                }
                
                // Try container
                var container = editor.getContainer();
                if (container) {
                    var editArea = container.querySelector('.tox-edit-area');
                    if (editArea) {
                        editArea.style.height = '1200px';
                        self.log('  Set edit area height to 1200px');
                    }
                }
                
                // Try body element
                var body = editor.getBody();
                if (body) {
                    body.style.minHeight = '1180px';
                    self.log('  Set body min-height');
                }
                
                self.log('✅ Editor expanded to 1200px (60 lines)');
            } catch (e) {
                self.log('Error expanding editor: ' + e.message);
            }
        },
        
        setupTable: function($table) {
            var self = this;
            var $cells = $table.find('.rs-cell');
            self.log('Found ' + $cells.length + ' clickable cells');
            $cells.each(function(idx) {
                var score = $(this).attr('data-score');
                if (idx < 3) { self.log('  Cell ' + idx + ' has score: ' + score); }
            });
            $cells.each(function() { $(this).addClass('rgdr-clickable'); });

            // Inject score badge into each cell from data-score (survives Moodle DB stripping)
            $cells.each(function() {
                var $cell = $(this);
                var score = $cell.attr('data-score');
                if (score === undefined) return;
                // Only add if not already present
                if ($cell.find('.rs-cell-score-badge').length) return;
                var label = self.markLabel(score);
                $cell.prepend('<strong class="rs-cell-score-badge">' + label + '</strong><br class="rgdr-badge-br">');
            });
            if ($table.hasClass('rs-marking-guide')) {
                self.log('Marking guide detected');
                self.setupMarkingGuide($table);
            }
            self.injectRescaleWidget($table);
        },

        injectSplitViewButton: function() {
            var self = this;
            if (document.getElementById('rgdr-split-btn')) return;

            // Find a good anchor — the question formulation or main content area
            var $anchor = $('.que.essay, .que, #page-content, #region-main, .generalbox').first();
            if (!$anchor.length) return;

            var $btn = $('<button type="button" id="rgdr-split-btn" class="rgdr-split-toggle">&#9707; ' + self.t('splitviewbtn', 'Split View — student response on left, mark on right') + '</button>');

            $btn.on('click', function() {
                self.toggleSplitView();
            });

            $anchor.before($btn);
            self.log('Split view button injected');
        },

        toggleSplitView: function() {
            var self = this;
            var $btn = $('#rgdr-split-btn');

            if ($('body').hasClass('rgdr-split-active')) {
                // --- EXIT SPLIT VIEW ---
                // Just remove the CSS class — the live page content is untouched
                $('body').removeClass('rgdr-split-active');
                $('#rgdr-split-left-panel').remove();
                $btn.html('&#9707; ' + self.t('splitviewbtncollapsed', 'Split View'));
                self.log('Split view off');
                return;
            }

            // --- ENTER SPLIT VIEW ---
            // Load only the student response in a left iframe.
            // The live page becomes the right panel — nothing gets wiped.
            var currentUrl = window.location.href;

            // Build left panel with iframe showing response only
            var $left = $('<div id="rgdr-split-left-panel"></div>');
            var $iframe = $('<iframe class="rgdr-split-left-frame" src="' + currentUrl + '" title="' + self.t('studentresponsetitle', 'Student response') + '"></iframe>');
            $left.append('<div class="rgdr-split-left-bar">&#128065; ' + self.t('studentresponsereadonly', 'Student Response (read only)') + '</div>');
            $left.append($iframe);
            $('body').prepend($left);
            $('body').addClass('rgdr-split-active');



            // Once iframe loads, inject CSS to show only the student response.
            // Use a delay + !important cascade to survive Moodle's own JS running after load.
            $iframe[0].addEventListener('load', function() {
                var iframeEl = this;
                function applyCSS() {
                    try {
                        var iDoc = iframeEl.contentDocument || iframeEl.contentWindow.document;
                        // Remove any previous injection
                        var existing = iDoc.getElementById('rs-split-style');
                        if (existing) existing.parentNode.removeChild(existing);

                        var style = iDoc.createElement('style');
                        style.id = 'rs-split-style';
                        // Target exactly what we saw: #page-wrapper > .que > .content
                        style.textContent = [
                            'body * { visibility:hidden !important; }',
                            '.que .content,',
                            '.que .content * { visibility:visible !important; }',
                            '.que .content .comment,',
                            '.que .content .gradingdetails,',
                            '.que .content .submitbtns,',
                            '.que .content .history,',
                            '.que .content .rs-table,',
                            '.que .content .rgdr-rescale-wrap,',
                            '.que .content .rgdr-split-toggle,',
                            '.que .content input[name*="mark"],',
                            '.que .content label[for*="mark"],',
                            '.que .content .fitem_id_mark,',
                            '.que .content .comment *,',
                            '.que .content .gradingdetails *,',
                            '.que .content .submitbtns *,',
                            '.que .content .history *,',
                            '.que .content .rs-table *,',
                            '.que .content .rgdr-rescale-wrap * { visibility:hidden !important; }',
                            'body { background:#fff !important; }',
                        'body, html { overflow-x:hidden !important; max-width:100% !important; }',
                        '* { max-width:100% !important; box-sizing:border-box !important; }',
                        'audio, video, img, iframe { max-width:100% !important; height:auto !important; }',
                        'pre, code { white-space:pre-wrap !important; word-break:break-word !important; }',
                        'table { table-layout:fixed !important; width:100% !important; }'
                        ].join('\n');

                        iDoc.head.appendChild(style);
                        self.log('iframe CSS applied');
                    } catch(e) {
                        self.log('iframe CSS failed: ' + e.message);
                    }
                }
                // Apply immediately and again after delays to beat Moodle's JS
                applyCSS();
                setTimeout(applyCSS, 300);
                setTimeout(applyCSS, 800);
                setTimeout(applyCSS, 1500);
            });

            $btn.html('&#10005; ' + self.t('exitsplitviewbtn', 'Exit Split View — save first!'));
            self.log('Split view on');
        },

        injectRescaleWidget: function($table) {
            var self = this;
            // Don't add twice
            if ($table.next('.rgdr-rescale-wrap').length) return;

            var $widget = $([
                '<div class="rgdr-rescale-wrap">',
                '  <div class="rgdr-rescale-inner">',
                '    <span class="rgdr-rescale-label">&#9881; ' + self.t('rescalemark', 'Rescale mark') + '</span>',
                '    <span class="rgdr-rescale-hint">' + self.t('rescalehint', 'Enter the question\'s max mark, then click Rescale to convert the rubric total.') + '</span>',
                '    <div class="rgdr-rescale-controls">',
                '      <label class="rgdr-rescale-field-label">' + self.t('maxmarkforquestion', 'Max mark for this question') + '</label>',
                '      <input class="rgdr-rescale-max" type="number" min="0" step="0.5" placeholder="' + self.t('maxmarkplaceholder', 'e.g. 14') + '">',
                '      <button type="button" class="rgdr-rescale-btn">' + self.t('rescalebtn', 'Rescale') + '</button>',
                '      <span class="rgdr-rescale-result" style="display:none;"></span>',

                '    </div>',
                '  </div>',
                '</div>'
            ].join(''));

            $table.after($widget);

            // Wire up the rescale button
            $widget.find('.rgdr-rescale-btn').on('click', function() {
                var maxMark = parseFloat($widget.find('.rgdr-rescale-max').val());
                if (isNaN(maxMark) || maxMark <= 0) {
                    alert(self.t('errorinvalidmaxmark', 'Please enter a valid max mark greater than 0.'));
                    return;
                }

                // Get current rubric total
                var total = 0;
                var maxPossible = 0;
                if ($table.hasClass('rs-marking-guide')) {
                    $table.find('tr.rs-criterion-row').each(function() {
                        total       += parseFloat($(this).find('.rs-score-input').val()) || 0;
                        maxPossible += parseFloat($(this).find('.rs-max-input').val())   || 0;
                    });
                } else {
                    // Standard, weighted, or legacy rubric
                    var isWgt = $table.hasClass('rs-weighted');
                    var rTotalCols = self.readClassNum($table, 'rs-cols-') ||
                                     Math.max(0, $table.find('thead tr th, tr:first-child th').length - 1);
                    $table.find('tr').each(function() {
                        var $row = $(this);
                        var $sel = $row.find('.rs-cell.rgdr-selected');
                        if (!$sel.length) return;
                        var $critCell = $row.find('td:first-child');
                        var score, rMax;
                        if (!isNaN(parseFloat($sel.attr('data-score')))) {
                            // Legacy: direct score value
                            score = parseFloat($sel.attr('data-score')) || 0;
                            rMax  = self.getRowMax($row);
                            var mfn = self.extractMaxFromCriterionName($critCell.text().trim());
                            if (mfn !== null) rMax = mfn;
                        } else {
                            // New format: position-based, read from classes
                            rMax = isWgt
                                ? (self.readClassNum($critCell, 'rs-w-') || parseFloat($critCell.attr('data-weight')) || 0)
                                : (self.readClassNum($critCell, 'rs-max-') || parseFloat($critCell.attr('data-max')) || self.getRowMaxScore($row));
                            var colIdx = self.readClassNum($sel, 'rs-col-');
                            if (colIdx === null) colIdx = parseInt($sel.attr('data-col'));
                            var fraction = (!isNaN(colIdx) && rTotalCols > 1)
                                ? (1 - colIdx / (rTotalCols - 1)) : 0;
                            score = Math.round(fraction * rMax * 100) / 100;
                        }
                        total       += score;
                        maxPossible += rMax;
                    });
                }

                if (maxPossible <= 0) {
                    alert(self.t('errornoscoresyet', 'No scores entered yet — please complete the rubric first.'));
                    return;
                }

                var scaled = Math.round((total / maxPossible) * maxMark * 100) / 100;

                $widget.find('.rgdr-rescale-result').html(
                    '<strong>' + total + ' / ' + maxPossible + '</strong>' +
                    ' &rarr; <span class="rgdr-rescale-value">' + scaled + '</span> / ' + maxMark +
                    ' &nbsp;&mdash;&nbsp; <em>' + self.ta('rescaleenterinstruction', '<strong>' + scaled + '</strong>', 'enter {$a} in the Mark field below') + '</em>'
                ).show();
            });
        },

        getRowMax: function($row) {
            // For rubric tables, find the highest data-score in the row
            var max = 0;
            $row.find('.rs-cell[data-score]').each(function() {
                var s = parseFloat($(this).attr('data-score')) || 0;
                if (s > max) max = s;
            });
            return max;
        },

        setupMarkingGuide: function($table) {
            var self = this;
            self.log('=== SETUP MARKING GUIDE ===');
            $table.find('.rs-max-input').each(function() {
                $(this).prop('readonly', true).prop('disabled', false);
                self.log('  max locked: ' + $(this).val());
            });
            var $rows = $table.find('tr.rs-criterion-row');
            self.log('rows: ' + $rows.length);
            $rows.each(function(i) {
                var $row = $(this);
                var $si = $row.find('.rs-score-input');
                var lbl = $row.find('.rs-criterion-label').text().trim();
                self.log('  row ' + i + ': "' + lbl + '" input=' + ($si.length ? 'YES' : 'NO'));
                if (!$si.length) return;
                $si.on('input keyup', function() {
                    var mx = parseFloat($row.find('.rs-max-input').val()) || 0;
                    var v  = parseFloat($(this).val());
                    if (!isNaN(v)) {
                        if (v > mx) $(this).val(mx.toFixed(1));
                        if (v < 0)  $(this).val('0.0');
                    }
                    self.updateMarkOnlyForTable($table);
                    $row.find('.rs-confirm-btn').addClass('rs-confirm-btn--dirty');
                });
                $si.on('keydown', function(e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        e.preventDefault(); e.stopPropagation();
                        self.log('Enter on "' + lbl + '"');
                        self.confirmRow($row, $table);
                    }
                });
                $si.on('blur', function() {
                    self.log('blur on "' + lbl + '" val=' + $(this).val());
                    self.confirmRow($row, $table);
                });
            });
        },

        confirmRow: function($row, $table) {
            var self = this;
            var lbl = $row.find('.rs-criterion-label').text().trim();
            self.log('confirmRow: "' + lbl + '"');
            var $si  = $row.find('.rs-score-input');
            var $btn = $row.find('.rs-confirm-btn');
            var mx   = parseFloat($row.find('.rs-max-input').val()) || 0;
            var v    = parseFloat($si.val());
            self.log('  raw="' + $si.val() + '" parsed=' + v + ' max=' + mx);
            if (isNaN(v) || v < 0) v = 0;
            else if (v > mx)       v = mx;
            $si.val(v.toFixed(1));
            $row.addClass('rgdr-row-confirmed');
            $btn.removeClass('rs-confirm-btn--dirty').addClass('rs-confirm-btn--done').text('checkmark');
            self.log('  confirmed=' + v.toFixed(1) + ', calling updateTotalForTable');
            self.updateTotalForTable($table);
        },

        updateMarkOnlyForTable: function($table) {
            var self = this;
            var t = 0;
            $table.find('tr.rs-criterion-row').each(function() {
                t += parseFloat($(this).find('.rs-score-input').val()) || 0;
            });
            self.log('updateMarkOnly: ' + t);
            self.updateMarkFieldForTable($table, t);
        },
        
        setupClickHandlers: function() {
            var self = this;
            self.log('Setting up click and hover handlers');

            // Clear any existing handlers
            $(document).off('click.rubricgrader mouseenter.rubricgrader mouseleave.rubricgrader');

            // MARKING GUIDE: confirm span (document-level, Moodle-safe span not button)
            $(document).on('click.rubricgrader', '.rs-confirm-btn', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.log('rs-confirm-btn clicked');
                var $row   = $(this).closest('tr.rs-criterion-row');
                var $table = $(this).closest('.rs-marking-guide');
                self.log('  row found: ' + ($row.length ? 'YES' : 'NO') + ' table found: ' + ($table.length ? 'YES' : 'NO'));
                if ($row.length && $table.length) {
                    self.confirmRow($row, $table);
                }
            });

            // CHECKLIST: click a cell to toggle it achieved/not-achieved.
            // Unlike Rubric mode's cells (several per row, click one to
            // select it, deselecting its siblings), each checklist item has
            // exactly one cell — so clicking TOGGLES it, since there's no
            // sibling cell to click instead if you want to undo a mistake.
            $(document).on('click.rubricgrader', '.rgdr-cl-item-cell', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var $cell = $(this);
                $cell.toggleClass('rgdr-cl-selected');
                self.log('Checklist item toggled: ' + ($cell.hasClass('rgdr-cl-selected') ? 'achieved' : 'not achieved'));
                var $row   = $cell.closest('tr.rgdr-cl-item-row');
                $row.toggleClass('rgdr-row-confirmed', $cell.hasClass('rgdr-cl-selected'));
                var $table = $cell.closest('.rgdr-checklist');
                if ($table.length) self.updateTotalForTable($table);
            });
            
            // HOVER EFFECTS
            $(document).on('mouseenter.rubricgrader', '.rs-cell', function() {
                $(this).addClass('rgdr-hover');
                self.log('Hover ON - Score: ' + $(this).attr('data-score'));
            });
            
            $(document).on('mouseleave.rubricgrader', '.rs-cell', function() {
                $(this).removeClass('rgdr-hover');
            });

            $(document).on('mouseenter.rubricgrader', '.rgdr-cl-item-cell', function() {
                $(this).addClass('rgdr-cl-hover');
            });

            $(document).on('mouseleave.rubricgrader', '.rgdr-cl-item-cell', function() {
                $(this).removeClass('rgdr-cl-hover');
            });
            
            // CLICK HANDLER
            $(document).on('click.rubricgrader', '.rs-cell', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var $cell = $(this);
                var score = $cell.attr('data-score');
                
                self.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                self.log('💥 CELL CLICKED!');
                self.log('Score: ' + score);
                self.log('Text preview: ' + $cell.text().substring(0, 50) + '...');
                
                // Get the row
                var $row = $cell.closest('tr');
                var rowCells = $row.find('.rs-cell');
                self.log('Row has ' + rowCells.length + ' cells');
                
                // DESELECT all cells in this row
                rowCells.removeClass('rgdr-selected');
                self.log('Deselected all cells in row');
                
                // SELECT this cell
                $cell.addClass('rgdr-selected');
                self.log('✓ Cell now selected');
                
                // Verify it worked
                if ($cell.hasClass('rgdr-selected')) {
                    self.log('✅ Selection confirmed!');
                } else {
                    self.log('❌ Selection FAILED!');
                }
                
                // Find which rubric table this belongs to (important for manual grading with multiple questions)
                var $table = $cell.closest('.rs-table');
                
                // Update total for THIS specific rubric
                self.updateTotalForTable($table);
                self.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            });
            
            self.log('✅ Handlers attached');
        },
        
        updateTotalForTable: function($table) {
            var self = this;
            self.log('');
            self.log('📊 CALCULATING TOTAL FOR THIS RUBRIC...');

            var total = 0;
            var maxPossible = 0;
            var breakdown = [];

            // ── CHECKLIST MODE ────────────────────────────────────────────
            // Every item's data-score counts toward maxPossible regardless
            // of whether it's been clicked yet (same reasoning as the
            // rubric fix earlier: an ungraded item should shrink the
            // visible total, not silently vanish from the denominator).
            // An item's own score is its full data-score if the marker has
            // toggled it "achieved" (rgdr-cl-selected), otherwise zero —
            // there's no partial credit and no remark field to read here.
            if ($table.hasClass('rgdr-checklist')) {
                self.log('  → checklist mode');
                var currentSection = '';
                $table.find('tr.rgdr-cl-section-row, tr.rgdr-cl-item-row').each(function() {
                    var $row = $(this);
                    if ($row.hasClass('rgdr-cl-section-row')) {
                        currentSection = $row.find('.rgdr-cl-section-label').text().trim();
                        return;
                    }
                    var itemLabel = $row.find('.rgdr-cl-item-label').text().trim();
                    var itemDesc  = $row.find('.rgdr-cl-item-desc').text().trim();
                    var $cell = $row.find('.rgdr-cl-item-cell');
                    var mx = parseFloat($cell.attr('data-score')) || 0;
                    var achieved = $cell.hasClass('rgdr-cl-selected');
                    var sc = achieved ? mx : 0;
                    maxPossible += mx;
                    total += sc;
                    breakdown.push({
                        section: currentSection,
                        criterion: itemLabel,
                        description: itemDesc,
                        score: sc,
                        max: mx,
                        achieved: achieved
                    });
                });
                self.log('CHECKLIST TOTAL: ' + total + ' / ' + maxPossible);
                try {
                    self.updateMarkFieldForTable($table, total, maxPossible);
                } catch (err) {
                    self.log('❌ updateMarkFieldForTable threw: ' + (err && err.message));
                    if (window.console && console.error) console.error('RubricGrader: updateMarkFieldForTable failed', err);
                }
                try {
                    self.updateVisualFeedbackForTable($table, breakdown, total, maxPossible);
                } catch (err) {
                    self.log('❌ updateVisualFeedbackForTable threw: ' + (err && err.message));
                    if (window.console && console.error) console.error('RubricGrader: updateVisualFeedbackForTable failed', err);
                }
                return;
            }
            // ─────────────────────────────────────────────────────────────

            // ── MARKING GUIDE MODE ────────────────────────────────────────
            if ($table.hasClass('rs-marking-guide') || $table.hasClass('rs-wmg')) {
                var isWMG = $table.hasClass('rs-wmg');
                self.log('  → ' + (isWMG ? 'weighted marking guide' : 'marking guide') + ' mode');
                $table.find('tr.rs-criterion-row').each(function() {
                    var $row = $(this);
                    var criterion = $row.find('.rs-criterion-label').text().trim();
                    var mx  = parseFloat($row.find('.rs-max-input, .rs-wmg-weight-cell').first().text()) ||
                              parseFloat($row.find('.rs-max-input').val()) || 0;
                    var sc  = parseFloat($row.find('.rs-score-input').val()) || 0;
                    // Multi-strategy description extraction with logging
                    var $labelCell = $row.find('.rs-criterion-label-cell').length
                        ? $row.find('.rs-criterion-label-cell')
                        : $row.find('td').first();
                    // Strategy 1: by class name — read innerHTML to preserve <br> tags
                    var $descEl = $labelCell.find('.rs-criterion-desc');
                    var desc = $descEl.length ? $descEl.html().trim() : '';
                    self.log('  desc s1 (class): len=' + $descEl.length + ' val="' + desc.substring(0, 40) + '"');
                    // Strategy 2: second span in label cell
                    if (!desc) {
                        var $spans = $labelCell.find('span');
                        self.log('  spans in label cell: ' + $spans.length);
                        if ($spans.length >= 2) {
                            desc = $spans.eq(1).html().trim();
                            self.log('  desc s2 (2nd span): "' + desc.substring(0, 40) + '"');
                        }
                    }
                    // Strategy 3: all cell text minus the criterion label (plain text fallback)
                    if (!desc) {
                        var cellText = $labelCell.text().trim();
                        desc = cellText.replace(criterion, '').trim();
                        self.log('  desc s3 (cell-label): "' + desc.substring(0, 40) + '"');
                    }
                    self.log('  criterion="' + criterion + '" FINAL desc="' + desc.substring(0, 60) + '" score=' + sc + ' max=' + mx);
                    maxPossible += mx;
                    total += sc;
                    breakdown.push({
                        criterion: criterion,
                        score: sc,
                        max: mx,
                        description: desc
                    });
                });
                self.log('MARKING GUIDE TOTAL: ' + total + ' / ' + maxPossible);
                try {
                    self.updateMarkFieldForTable($table, total);
                } catch (err) {
                    self.log('❌ updateMarkFieldForTable threw: ' + (err && err.message));
                    if (window.console && console.error) console.error('RubricGrader: updateMarkFieldForTable failed', err);
                }
                try {
                    self.updateVisualFeedbackForTable($table, breakdown, total, maxPossible);
                } catch (err) {
                    self.log('❌ updateVisualFeedbackForTable threw: ' + (err && err.message));
                    if (window.console && console.error) console.error('RubricGrader: updateVisualFeedbackForTable failed', err);
                }
                return;
            }
            // ─────────────────────────────────────────────────────────────

            var isWeighted  = $table.hasClass('rs-weighted');
            var isStandard  = $table.hasClass('rs-standard');
            var isNewRubric = $table.hasClass('rs-rubric');
            var isLegacy    = !isWeighted && !isStandard && !isNewRubric;
            self.log('  isWeighted=' + isWeighted + ' isStandard=' + isStandard + ' isNewRubric=' + isNewRubric + ' isLegacy=' + isLegacy);

            if (isWeighted) {
                // WEIGHTED RUBRIC: iterate all criterion rows, contribution = (score/colMax)*weight
                var $allRows = $table.find('tbody tr');
                var hasAnySelection = $table.find('.rs-cell.rgdr-selected').length > 0;
                if (!hasAnySelection) {
                    self.log('⚠️ No cells selected yet');
                    return;
                }
                // Total columns for position-based scoring
                // Get col count from class rs-cols-N or thead
                var wTotalCols = self.readClassNum($table, 'rs-cols-') || 0;
                if (!wTotalCols) wTotalCols = Math.max(0, $table.find('thead tr th').length - 1);
                self.log('  wTotalCols=' + wTotalCols);

                $allRows.each(function(idx) {
                    var $row = $(this);
                    var $critCell = $row.find('td:first-child');
                    if (!$critCell.length) return;
                    // Weight from class rs-w-30 or legacy data-weight
                    var weight = self.readClassNum($critCell, 'rs-w-') ||
                                 parseFloat($critCell.attr('data-weight')) || 0;
                    if (!weight) return;
                    var criterionName = self.extractCriterionName($critCell.text().trim());
                    var $sel = $row.find('.rs-cell.rgdr-selected');
                    var fraction = 0;
                    if ($sel.length) {
                        // Col index from class rs-col-N or legacy data-col
                        var colAttr = self.readClassNum($sel, 'rs-col-');
                        if (colAttr === null) colAttr = parseInt($sel.attr('data-col'));
                        if (!isNaN(colAttr) && wTotalCols > 1) {
                            fraction = 1 - colAttr / (wTotalCols - 1);
                        } else if (!isNaN(parseFloat($sel.attr('data-score')))) {
                            var legacyMax = self.getRowMaxScore($row);
                            fraction = legacyMax > 0 ? parseFloat($sel.attr('data-score')) / legacyMax : 0;
                        }
                    }
                    var contribution = Math.round(fraction * weight * 100) / 100;
                    var description = $sel.length ? $sel.text().trim() : '';
                    self.log('  Row ' + (idx+1) + ' "' + criterionName + '": fraction=' + fraction.toFixed(2) + ' x ' + weight + '% = ' + contribution);
                    total += contribution;
                    maxPossible += weight;
                    breakdown.push({criterion: criterionName, score: contribution, max: weight, description: description, isWeighted: true});
                });
            } else {
                // STANDARD or LEGACY rubric
                var $selected = $table.find('.rs-cell.rgdr-selected');
                self.log('Selected cells: ' + $selected.length);
                if ($selected.length === 0) {
                    self.log('⚠️ No cells selected yet');
                    return;
                }
                var totalCols = self.readClassNum($table, 'rs-cols-') || 0;
                if (!totalCols) totalCols = Math.max(0, $table.find('thead tr th, tr:first-child th').length - 1);
                self.log('  totalCols=' + totalCols);

                // Determine a criterion row's maximum score, independent of
                // whether it currently has a cell selected.
                function rowMaxFor($row, $critCell) {
                    var rowHasDataScore = $row.find('.rs-cell[data-score]').length > 0;
                    if (isLegacy || isNewRubric || rowHasDataScore) {
                        var rm = self.getRowMaxScore($row);
                        if (!isNewRubric) {
                            var mfn = self.extractMaxFromCriterionName($critCell.text().trim());
                            if (mfn !== null) rm = mfn;
                        }
                        return rm;
                    }
                    return self.readClassNum($critCell, 'rs-max-') ||
                           parseFloat($critCell.attr('data-max')) ||
                           self.getRowMaxScore($row);
                }

                // maxPossible = sum of EVERY criterion row's max score, not
                // just rows that already have a selection. Computing it only
                // from selected rows understated the denominator whenever a
                // criterion was still ungraded — e.g. showing "90/90" for a
                // rubric that should total 100 with one criterion left
                // unclicked, making incomplete grading look finished.
                $table.find('tbody tr').each(function() {
                    var $row = $(this);
                    if (!$row.find('.rs-cell').length) return; // not a criterion row
                    var $critCell = $row.find('td:first-child');
                    maxPossible += rowMaxFor($row, $critCell);
                });

                $selected.each(function(idx) {
                    var $cell = $(this);
                    var $row = $cell.closest('tr');
                    var $critCell = $row.find('td:first-child');
                    var criterionText = $critCell.text().trim();
                    var criterionName = self.extractCriterionName(criterionText);
                    var description = $cell.text().trim();
                    var score, rowMax;

                    if (isLegacy || isNewRubric || !isNaN(parseFloat($cell.attr('data-score')))) {
                        // New rubric or legacy: data-score holds the actual score value directly
                        score = parseFloat($cell.attr('data-score')) || 0;
                        rowMax = self.getRowMaxScore($row);
                        // For new rubric, rowMax IS the highest data-score in the row
                        if (!isNewRubric) {
                            var maxFromName = self.extractMaxFromCriterionName(criterionText);
                            if (maxFromName !== null) rowMax = maxFromName;
                        }
                    } else {
                        // New standard rubric: position-based, rowMax from class or name
                        rowMax = self.readClassNum($critCell, 'rs-max-') ||
                                 parseFloat($critCell.attr('data-max')) ||
                                 self.getRowMaxScore($row);
                        var colIdx = self.readClassNum($cell, 'rs-col-');
                        if (colIdx === null) colIdx = parseInt($cell.attr('data-col'));
                        if (!isNaN(colIdx) && totalCols > 1) {
                            score = Math.round(rowMax * (1 - colIdx / (totalCols - 1)) * 100) / 100;
                        } else {
                            score = 0;
                        }
                    }

                    self.log('  Row ' + (idx+1) + ': score=' + score + ' max=' + rowMax);
                    total += score;
                    // NOTE: maxPossible is no longer accumulated here — it's
                    // computed once above, across every criterion row.
                    breakdown.push({criterion: criterionName, score: score, max: rowMax, description: description});
                });
            }
            
            self.log('');
            self.log('🎯 TOTAL SCORE: ' + total + ' / ' + maxPossible + ' marks');
            self.log('');

            // These two calls do genuinely independent jobs (setting the mark
            // field vs. writing the student-facing summary), but previously
            // ran back-to-back in the same synchronous chain — meaning an
            // uncaught error in updateMarkFieldForTable (e.g. the missing
            // findMarkInput() method, fixed below) silently prevented
            // updateVisualFeedbackForTable from ever running at all, with no
            // visible error to the marker. Each is now isolated so a failure
            // in one can never again take out the other.
            try {
                self.updateMarkFieldForTable($table, total, maxPossible);
            } catch (err) {
                self.log('❌ updateMarkFieldForTable threw: ' + (err && err.message));
                if (window.console && console.error) console.error('RubricGrader: updateMarkFieldForTable failed', err);
            }
            try {
                self.updateVisualFeedbackForTable($table, breakdown, total, maxPossible);
            } catch (err) {
                self.log('❌ updateVisualFeedbackForTable threw: ' + (err && err.message));
                if (window.console && console.error) console.error('RubricGrader: updateVisualFeedbackForTable failed', err);
            }
        },
        
        // Locates the numeric mark/grade input field for the current question.
        // This was previously called from two places (updateMarkFieldForTable's
        // fallback search, and readQuestionMaxMark) but was never actually
        // defined anywhere in this file — calling it threw an uncaught
        // TypeError ("self.findMarkInput is not a function"). Because that
        // happens inside a synchronous call chain, the error silently
        // prevented everything after it from running, including the write to
        // the student-facing Comment box — with no visible error to the
        // marker. This is the actual fix for that; the try/catch isolation
        // added around the call sites is a safety net on top of it.
        findMarkInput: function() {
            var self = this;
            var $best = $();
            $('input[name*="mark"], input[name*="grade"]').filter(':visible').each(function() {
                var name = $(this).attr('name') || '';
                if (name.indexOf('maxmark') !== -1) return; // skip the hidden max-mark field itself
                $best = $(this);
                return false; // take the first visible match
            });
            if ($best.length) return $best;
            // Fall back to any matching input at all, visible or not.
            return $('input[name*="mark"], input[name*="grade"]').not('[name*="maxmark"]').first();
        },

        updateMarkFieldForTable: function($table, total, maxPossible) {
            var self = this;
            self.log('');
            self.log('📝 updateMarkFieldForTable total=' + total + ' maxPossible=' + maxPossible);

            var $markInput = null;

            // Dump all visible inputs for diagnosis
            self.log('  Visible inputs:');
            $('input:visible').each(function(idx) {
                if (idx < 25) {
                    self.log('    [' + idx + '] type=' + ($(this).attr('type')||'?') +
                        ' name="' + ($(this).attr('name')||'') +
                        '" id="' + ($(this).attr('id')||'') + '"');
                }
            });

            // 1. Container search
            var $container = $table.closest('.que, .question, form, div[class*="question"]');
            self.log('  Container: ' + ($container.length ? $container[0].className : 'NONE'));
            if ($container.length) {
                $markInput = $container.find('input[name*="mark"], input[name*="grade"]').first();
                self.log('  Container result: ' + ($markInput.length ? $markInput.attr('name') : 'not found'));
            }

            // 2. Wide proximity search (1000px, no name filter — log everything)
            if (!$markInput || !$markInput.length) {
                var tOff = $table.offset();
                self.log('  Proximity from y=' + tOff.top);
                $('input[type="text"], input[type="number"]').each(function() {
                    var n = $(this).attr('name') || '';
                    var d = Math.abs(tOff.top - $(this).offset().top);
                    self.log('    name="' + n + '" dist=' + Math.round(d));
                    if ((n.indexOf('mark') !== -1 || n.indexOf('grade') !== -1) && d < 1000) {
                        self.log('    ✅ Matched!');
                        $markInput = $(this);
                        return false;
                    }
                });
            }

            // 3. findMarkInput fallback
            if (!$markInput || !$markInput.length) {
                $markInput = self.findMarkInput();
                self.log('  findMarkInput: ' + ($markInput && $markInput.length ? $markInput.attr('name') : 'FAILED'));
            }

            if (!$markInput || !$markInput.length) {
                self.log('❌ Mark field NOT FOUND');
                return;
            }

            // --- Marks conversion ---
            // Scale the rubric's raw total proportionally to the question's
            // actual max mark, whenever they differ — not just when the
            // rubric happens to total exactly 100. A rubric built to some
            // other total (e.g. 60, 24) now converts correctly too, instead
            // of writing its raw sum straight into the mark field (which was
            // only ever correct by coincidence, if the rubric's total
            // happened to already match the question's max mark).
            var scaledTotal = total;
            if (maxPossible > 0) {
                // Try to read the question's actual max mark from the Moodle grading page DOM
                var questionMax = self.readQuestionMaxMark($table);
                if (questionMax && questionMax > 0) {
                    if (Math.abs(questionMax - maxPossible) > 0.01) {
                        scaledTotal = Math.round((total / maxPossible) * questionMax * 100) / 100;
                        self.log('⚖️ Scaling ' + total + '/' + maxPossible + ' → ' + scaledTotal + '/' + questionMax);
                    } else {
                        self.log('  No scaling needed — rubric max (' + maxPossible + ') already matches question max (' + questionMax + ')');
                    }
                } else {
                    self.log('  ⚠️ Could not read question max mark from the page — writing rubric total unscaled');
                }
            }
            var old = $markInput.val();
            $markInput.val(scaledTotal);
            self.log('💾 ' + $markInput.attr('name') + ' "' + old + '" → "' + scaledTotal + '"');

            $markInput.trigger('change').trigger('input').trigger('blur').trigger('keyup');
            if ($markInput[0]) {
                $markInput[0].dispatchEvent(new Event('change', { bubbles: true }));
                $markInput[0].dispatchEvent(new Event('input',  { bubbles: true }));
            }
            self.log('✅ Mark field done');
        },
        
        updateVisualFeedbackForTable: function($table, breakdown, total, maxPossible) {
            var self = this;
            self.log('📄 updateVisualFeedbackForTable called');

            // ── CHECKLIST: dedicated output ──────────────────────────────
            if ($table.hasClass('rgdr-checklist')) {
                self.log('  → checklist feedback path');
                var clHTML = self.buildChecklistSummaryHTML(breakdown, total, maxPossible);
                self.writeToCommentArea($table, clHTML);
                return;
            }
            // ── MARKING GUIDE: dedicated output ──────────────────────────
            if ($table.hasClass('rs-marking-guide')) {
                self.log('  → marking guide feedback path');
                var mgHTML = self.buildMarkingGuideSummaryHTML(breakdown, total, maxPossible);
                self.writeToCommentArea($table, mgHTML);
                return;
            }
            // ── WEIGHTED MARKING GUIDE: same flow, different label ────────
            if ($table.hasClass('rs-wmg')) {
                self.log('  → weighted marking guide feedback path');
                var wmgHTML = self.buildMarkingGuideSummaryHTML(breakdown, total, maxPossible, true);
                self.writeToCommentArea($table, wmgHTML);
                return;
            }
            // ─────────────────────────────────────────────────────────────

            // Build the summary HTML and route to comment area
            var summary = self.buildSummaryHTML(breakdown, total, maxPossible, $table);
            self.log('Built rubric summary HTML, length=' + (summary ? summary.length : 'NULL'));
            if (summary) self.writeToCommentArea($table, summary);
        },
        
        // Finds the live TinyMCE editor instance wrapping a given <textarea>
        // DOM element by comparing the actual element reference, rather than
        // matching id strings via tinyMCE.get(id). This is strictly more
        // reliable: if Moodle ever generates the editor's registry key
        // slightly differently from the textarea's own id attribute, an
        // id-string lookup silently fails and falls back to setting the raw
        // textarea value — which updates hidden data but never updates what
        // the marker actually sees in the rendered editor on screen.
        findTinyMCEForElement: function(el) {
            if (!el || typeof tinyMCE === 'undefined' || !tinyMCE.editors) return null;
            for (var i = 0; i < tinyMCE.editors.length; i++) {
                var ed = tinyMCE.editors[i];
                try {
                    if (ed.getElement && ed.getElement() === el) return ed;
                } catch (e) { /* ignore and keep scanning */ }
            }
            return null;
        },

        writeToCommentArea: function($table, html) {
            var self = this;
            self.log('writeToCommentArea called, html length=' + html.length);

            // 1. Container-scoped lookup. Walk up to the nearest question/attempt
            //    wrapper and only look for a comment textarea INSIDE it. This is
            //    the only reliable strategy on pages that show more than one
            //    student/question at once (e.g. report.php?mode=grading), since
            //    it can never cross over into a neighbouring question's fields.
            var $container = $table.closest('.que, .question, div[class*="question"]');
            if (!$container.length) {
                // Narrower fallback: nearest enclosing form. Still scoped to a
                // single question on single-question grading pages.
                $container = $table.closest('form');
            }
            self.log('  container: ' + ($container.length ? ($container[0].className || $container[0].tagName) : 'NONE'));

            if ($container.length) {
                var $ta = $container.find('textarea[name*="comment"]').first();
                if ($ta.length) {
                    var taId = $ta.attr('id');
                    self.log('  textarea id: ' + taId);
                    if (typeof tinyMCE !== 'undefined') {
                        var ed = self.findTinyMCEForElement($ta[0]) || (taId ? tinyMCE.get(taId) : null);
                        if (ed) {
                            self.log('  → TinyMCE (container)');
                            ed.setContent(html);
                            self.expandSpecificEditor(ed);
                            return;
                        }
                        self.log('  ⚠️ textarea found (id=' + taId + ') but no matching TinyMCE instance — writing raw value as fallback (may not appear until the editor reloads)');
                    }
                    self.log('  → textarea (container)');
                    $ta.val(html);
                    return;
                }
            }

            // 2. Page-wide fallback — ONLY safe when there is exactly one rubric
            //    table on the whole page, so there is no possibility of writing
            //    this feedback into a different student's or question's comment
            //    box. We deliberately removed the old pixel-distance "proximity"
            //    guess here: on multi-question/multi-attempt grading pages it
            //    could silently misattribute a grading summary to the wrong
            //    student. Silent misattribution is worse than doing nothing.
            if ($('.rs-table').length === 1) {
                var $anyComment = $('textarea[name*="comment"]').first();
                if ($anyComment.length && typeof tinyMCE !== 'undefined') {
                    var specificEd = self.findTinyMCEForElement($anyComment[0]) ||
                                      (typeof tinyMCE.get === 'function' ? tinyMCE.get($anyComment.attr('id')) : null);
                    if (specificEd) {
                        self.log('  → TinyMCE (single-table, matched comment textarea directly)');
                        specificEd.setContent(html);
                        self.expandSpecificEditor(specificEd);
                        return;
                    }
                }
                if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
                    self.log('  → TinyMCE activeEditor fallback (only one rubric table on page)');
                    tinyMCE.activeEditor.setContent(html);
                    self.expandTinyMCE();
                    return;
                }
                if ($anyComment.length) {
                    self.log('  → textarea fallback (only one rubric table on page)');
                    $anyComment.val(html);
                    return;
                }
            }

            // 3. No safe target found. Fail loudly rather than guessing, so the
            //    marker knows to add feedback manually instead of assuming it
            //    was written somewhere it wasn't.
            self.log('❌ writeToCommentArea: no safe target found — feedback NOT written');
            alert(self.t('errorcouldnotwrite', 'Rubric Grader: could not confidently locate the correct feedback box for this response, so the grading summary was not written automatically. Please copy it into the comment box manually, or reload the page and try again.'));
        },

        buildMarkingGuideSummaryHTML: function(breakdown, total, maxPossible, isWMG) {
            var self = this;
            var s = '<div class="rgdr-summary rs-mg-feedback-wrap">';
            s += '<p><strong>' + self.t('markingguidesummarytitle', 'Marking Guide Summary') + '</strong></p>';
            s += '<table class="rgdr-mg-feedback-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;font-size:0.92em;">';
            s += '<tr style="background-color:#1565C0;color:white;">';
            s += '<th style="text-align:left;padding:10px 14px;">' + self.t('criterionheader', 'Criterion') + '</th>';
            s += '<th style="text-align:center;padding:10px 14px;">' + self.t('scoreheader', 'Score') + '</th>';
            s += '<th style="text-align:left;padding:10px 14px;">' + self.t('criterionspecificcomments', 'Criterion-specific comments') + '</th>';
            s += '</tr>';
            breakdown.forEach(function(item, idx) {
                var bg = (idx % 2 === 0) ? '#ffffff' : '#f5f8ff';
                s += '<tr style="background-color:' + bg + ';">';
                s += '<td style="padding:12px 14px;vertical-align:top;width:22%;border:1px solid #dde3f0;">';
                s += '<p style="margin:0 0 4px 0;font-weight:700;color:#1a237e;">' + item.criterion + '</p>';
                if (item.description) {
                    s += '<p style="margin:0;font-weight:normal;font-size:0.88em;color:#555;line-height:1.45;">' + item.description + '</p>';
                }
                s += '</td>';
                s += '<td style="padding:12px 14px;text-align:center;vertical-align:top;width:120px;border:1px solid #dde3f0;">';
                s += '<span style="display:inline-block;background:#1565C0;color:white;font-weight:700;font-size:1.05em;border-radius:5px;padding:3px 14px;min-width:50px;text-align:center;">' + parseFloat(item.score).toFixed(1) + '</span>';
                s += '<span style="display:block;font-size:0.78em;color:#888;margin-top:3px;">' + (isWMG ? self.ta('weightpercent', parseFloat(item.max).toFixed(0), 'weight: {$a}%') : self.ta('outofmax', parseFloat(item.max).toFixed(1), 'out of {$a}')) + '</span>';
                s += '</td>';
                s += '<td style="padding:12px 14px;background-color:#fffde7;vertical-align:top;border:1px solid #dde3f0;min-width:200px;">&nbsp;</td>';
                s += '</tr>';
            });
            s += '<tr style="background-color:#1565C0;color:white;">';
            s += '<td style="padding:10px 14px;text-align:right;font-weight:700;border:none;">' + self.t('totalrow', 'Total') + '</td>';
            s += '<td style="padding:10px 14px;text-align:center;font-weight:700;font-size:1.1em;border:none;">' + parseFloat(total).toFixed(1) + ' / ' + parseFloat(maxPossible).toFixed(1) + '</td>';
            s += '<td style="border:none;"></td></tr>';
            s += '</table><br><p><strong>' + self.t('overallcomments', 'Overall comments:') + '</strong></p></div>';
            return s;
        },

        // Checklist mode's summary groups items under their section headers
        // (breakdown items already carry a 'section' field set while
        // updateTotalForTable walked the table) and shows each item as
        // clearly achieved or not — there's no remark or partial score to
        // display, just whether the item was awarded its full points.
        buildChecklistSummaryHTML: function(breakdown, total, maxPossible) {
            var self = this;
            var s = '<div class="rgdr-summary rgdr-cl-feedback-wrap">';
            s += '<p><strong>' + self.t('checklistsummarytitle', 'Checklist Summary') + '</strong></p>';
            s += '<table class="rgdr-cl-feedback-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;font-size:0.92em;">';
            s += '<tr style="background-color:#92400e;color:white;">';
            s += '<th style="text-align:left;padding:10px 14px;">' + self.t('itemheader', 'Item') + '</th>';
            s += '<th style="text-align:center;padding:10px 14px;">' + self.t('scoreheader', 'Score') + '</th>';
            s += '</tr>';
            var lastSection = null;
            breakdown.forEach(function(item, idx) {
                if (item.section && item.section !== lastSection) {
                    lastSection = item.section;
                    s += '<tr style="background-color:#fffbeb;"><td colspan="2" style="padding:8px 14px;font-weight:700;color:#92400e;border:1px solid #dde3f0;">' + item.section + '</td></tr>';
                }
                var bg = (idx % 2 === 0) ? '#ffffff' : '#fffdf5';
                s += '<tr style="background-color:' + bg + ';">';
                s += '<td style="padding:12px 14px;vertical-align:top;width:70%;border:1px solid #dde3f0;">';
                s += '<p style="margin:0 0 4px 0;font-weight:700;color:#78350f;">' + item.criterion + '</p>';
                if (item.description) {
                    s += '<p style="margin:0;font-weight:normal;font-size:0.88em;color:#555;line-height:1.45;">' + item.description + '</p>';
                }
                s += '</td>';
                s += '<td style="padding:12px 14px;text-align:center;vertical-align:top;width:140px;border:1px solid #dde3f0;">';
                if (item.achieved) {
                    s += '<span style="display:inline-block;background:#43a047;color:white;font-weight:700;font-size:0.95em;border-radius:5px;padding:4px 12px;">&#10003; ' + parseFloat(item.score).toFixed(1) + '</span>';
                } else {
                    s += '<span style="display:inline-block;background:#e5e7eb;color:#6b7280;font-weight:700;font-size:0.95em;border-radius:5px;padding:4px 12px;">&#10007; 0.0</span>';
                }
                s += '<span style="display:block;font-size:0.78em;color:#888;margin-top:3px;">' + self.ta('outofmax', parseFloat(item.max).toFixed(1), 'out of {$a}') + '</span>';
                s += '</td>';
                s += '</tr>';
            });
            s += '<tr style="background-color:#92400e;color:white;">';
            s += '<td style="padding:10px 14px;text-align:right;font-weight:700;border:none;">' + self.t('totalrow', 'Total') + '</td>';
            s += '<td style="padding:10px 14px;text-align:center;font-weight:700;font-size:1.1em;border:none;">' + parseFloat(total).toFixed(1) + ' / ' + parseFloat(maxPossible).toFixed(1) + '</td>';
            s += '</tr>';
            s += '</table><br><p><strong>' + self.t('overallcomments', 'Overall comments:') + '</strong></p></div>';
            return s;
        },

        buildSummaryHTML: function(breakdown, total, maxPossible, $table) {
            var self = this;
            self.log('🔷 buildSummaryHTML called: breakdown.length=' + breakdown.length + ' total=' + total + ' $table=' + ($table && $table.length ? $table[0].className : 'NULL'));
            if (!breakdown.length) { self.log('⚠️ Empty breakdown — returning null'); return null; }
            if (!$table || !$table.length) { self.log('⚠️ No $table — returning null'); return null; }

            var summary = '<div class="rgdr-summary">';
            summary += '<p><strong>' + self.t('rubricgradingsummarytitle', 'Rubric Grading Summary') + '</strong></p>';
            
            // Build column headers from the table's thead
            var colHeaders = [];
            var $headerRow = $table.find('thead tr').first();
            if (!$headerRow.length) $headerRow = $table.find('tr').first();
            $headerRow.find('th').each(function(i) {
                if (i === 0) return; // skip Criteria column
                colHeaders.push($(this).text().trim());
            });
            var numCols = colHeaders.length;
            self.log('Summary: ' + numCols + ' columns: ' + colHeaders.join(', '));

            // Detect format
            var useDataScore = $table.find('.rs-cell[data-score]').length > 0;
            var useDataCol   = !useDataScore && $table.find('.rs-cell[data-col], .rs-cell[class*="rs-col-"]').length > 0;

            summary += '<table class="rgdr-feedback-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;">';

            // Header row
            summary += '<tr style="background-color:#e3f2fd;">';
            summary += '<th>' + self.t('criterionheader', 'Criterion') + '</th>';
            colHeaders.forEach(function(h) {
                summary += '<th style="text-align:center;">' + h + '</th>';
            });
            summary += '<th>' + self.t('criterionspecificcomments', 'Criterion-specific comments') + '</th>';
            summary += '</tr>';

            // One row per breakdown item
            breakdown.forEach(function(item) {
                summary += '<tr>';
                var criterionLabel = item.criterion;
                if (item.isWeighted) {
                    criterionLabel += ' (' + item.max + '%)';
                } else {
                    criterionLabel += ' (' + self.markLabel(item.max) + ')';
                }
                summary += '<td><strong>' + criterionLabel + '</strong></td>';

                // Find this criterion's row in the table
                var $criterionRow = null;
                $table.find('tbody tr, tr').each(function() {
                    var $row = $(this);
                    if (!$row.find('.rs-cell').length) return;
                    var rowCriterion = self.extractCriterionName($row.find('td:first-child').text().trim());
                    if (rowCriterion === item.criterion) { $criterionRow = $row; return false; }
                });

                if ($criterionRow) {
                    if (useDataScore) {
                        // Legacy: match cells by data-score value
                        // Build score→header map from header row
                        var scoreMap = {};
                        $headerRow.find('th').each(function(i) {
                            if (i === 0) return;
                            var $firstDataRow = $table.find('tbody tr, tr').filter(function() {
                                return $(this).find('.rs-cell').length > 0;
                            }).first();
                            var $c = $firstDataRow.find('td').eq(i);
                            var sc = parseFloat($c.attr('data-score'));
                            if (!isNaN(sc)) scoreMap[sc] = i - 1;
                        });
                        for (var ci = 0; ci < numCols; ci++) {
                            // Find cell in this row whose data-score maps to column ci
                            var $found = null;
                            $criterionRow.find('.rs-cell').each(function() {
                                var sc = parseFloat($(this).attr('data-score'));
                                if (!isNaN(sc) && scoreMap[sc] === ci) { $found = $(this); return false; }
                            });
                            if (!$found) {
                                // Try positional fallback
                                $found = $criterionRow.find('td').eq(ci + 1);
                                if (!$found.hasClass('rs-cell')) $found = null;
                            }
                            if ($found && $found.length) {
                                var html2 = $found.html().trim();
                                var isSel = $found.hasClass('rgdr-selected');
                                if (html2 && html2 !== ' ' && html2 !== '&nbsp;') {
                                    var scoreVal2 = $found.attr('data-score');
                                    var scoreVal2Num = parseFloat(scoreVal2);
                                    var scoreLabel2 = scoreVal2 !== undefined ? self.markLabel(scoreVal2) : '';
                                    if (isSel) {
                                        var badge2 = scoreLabel2 ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#fff;opacity:1;">' + scoreLabel2 + '</strong>' : '';
                                        summary += '<td style="background:#1565C0;color:white;font-weight:bold;padding:8px;">&#10003;<br>' + badge2 + html2.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '') + '</td>';
                                    } else {
                                        var badge2u = scoreLabel2 ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#1a237e;">' + scoreLabel2 + '</strong>' : '';
                                        summary += '<td style="background:#f5f5f5;padding:8px;">' + badge2u + html2.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '') + '</td>';
                                    }
                                } else {
                                    summary += '<td></td>';
                                }
                            } else {
                                summary += '<td></td>';
                            }
                        }
                    } else {
                        // New format: class rs-col-N or data-col
                        for (var ci2 = 0; ci2 < numCols; ci2++) {
                            var $cell = $criterionRow.find('.rs-cell.rs-col-' + ci2 + ', .rs-cell[data-col="' + ci2 + '"]');
                            if ($cell.length) {
                                var cHtml = $cell.html().trim();
                                var cSel  = $cell.hasClass('rgdr-selected');
                                if (cHtml && cHtml !== ' ' && cHtml !== '&nbsp;') {
                                    var scoreValC = $cell.attr('data-score');
                                    var scoreValCNum = parseFloat(scoreValC);
                                    var scoreLabelC = scoreValC !== undefined ? self.markLabel(scoreValC) : '';
                                    var cleanHtml = cHtml.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '');
                                    if (cSel) {
                                        var badgeC = scoreLabelC ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#fff;opacity:1;">' + scoreLabelC + '</strong>' : '';
                                        summary += '<td style="background:#1565C0;color:white;font-weight:bold;padding:8px;">&#10003;<br>' + badgeC + cleanHtml + '</td>';
                                    } else {
                                        var badgeCu = scoreLabelC ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#1a237e;">' + scoreLabelC + '</strong>' : '';
                                        summary += '<td style="background:#f5f5f5;padding:8px;">' + badgeCu + cleanHtml + '</td>';
                                    }
                                } else {
                                    summary += '<td></td>';
                                }
                            } else {
                                summary += '<td></td>';
                            }
                        }
                    }
                } else {
                    // Can't find row — just show selected description in correct col
                    for (var ci3 = 0; ci3 < numCols; ci3++) { summary += '<td></td>'; }
                }

                summary += '<td style="background:#fffde7;padding:8px;min-width:200px;">&nbsp;</td>';
                summary += '</tr>';
            });

            summary += '</table>';
            summary += '<br>';
            var isWgtSummary = breakdown.length > 0 && breakdown[0].isWeighted;
            var maxPossibleSummary = breakdown.reduce(function(s, item) { return s + (parseFloat(item.max) || 0); }, 0);
            maxPossibleSummary = Math.round(maxPossibleSummary * 100) / 100;
            if (isWgtSummary) {
                summary += '<p><strong>' + self.tm('totalscorelinepercent', {score: total, max: maxPossibleSummary}, 'Total {$a->score} / {$a->max}%') + '</strong></p>';
            } else {
                summary += '<p><strong>' + self.tm('totalscoreline', {score: total, max: maxPossibleSummary}, 'Total {$a->score} / {$a->max}') + '</strong></p>';
            }
            summary += '<br>';
            summary += '<p><strong>' + self.t('overallcomments', 'Overall comments:') + '</strong></p>';
            summary += '</div>';

            return summary;
        },
        
        // Extract criterion name without max marks notation
        // Read numeric value encoded in a CSS class (e.g. rs-cols-7 → 7, rs-w-30 → 30)
        readClassNum: function(el, prefix) {
            var classes = ($(el).attr('class') || '').split(' ');
            for (var i = 0; i < classes.length; i++) {
                if (classes[i].indexOf(prefix) === 0) {
                    var val = parseFloat(classes[i].substring(prefix.length).replace('_', '.'));
                    if (!isNaN(val)) return val;
                }
            }
            return null;
        },

        // Read the question's actual max mark from the Moodle grading page DOM.
        // Used to scale a /100 rubric to the question's real mark value.
        readQuestionMaxMark: function($table) {
            var self = this;
            var maxMark = null;

            var $markInput = self.findMarkInput();

            // Strategy 1: Read sibling text nodes directly after the mark input.
            // Moodle renders: <input name="mark"> out of 16.00
            // The "out of X" is a raw text node sibling of the input.
            if ($markInput && $markInput.length) {
                var inputNode = $markInput[0];
                var sibling = inputNode.nextSibling;
                while (sibling) {
                    var txt = sibling.nodeType === 3 ? sibling.nodeValue : (sibling.textContent || sibling.innerText || '');
                    var m = txt.match(/out\s+of\s*([\d.]+)/i);
                    if (m) {
                        maxMark = parseFloat(m[1]);
                        self.log('📏 Question max from sibling text node: ' + maxMark);
                        return maxMark;
                    }
                    sibling = sibling.nextSibling;
                }
            }

            // Strategy 2: Walk up DOM tree checking each ancestor's full text,
            // but extract only the "out of X" portion to avoid matching the score itself.
            if ($markInput && $markInput.length) {
                var $el = $markInput.parent();
                for (var i = 0; i < 6; i++) {
                    var fullText = $el.text();
                    // Look specifically for "out of X" — not just any number
                    var m2 = fullText.match(/out\s+of\s*([\d.]+)/i);
                    if (m2) {
                        maxMark = parseFloat(m2[1]);
                        self.log('📏 Question max from ancestor (level ' + i + '): ' + maxMark);
                        return maxMark;
                    }
                    $el = $el.parent();
                    if (!$el.length) break;
                }
            }

            // Strategy 3: Scan the whole page for "out of X.XX" near a mark label
            $('label, .fitemtitle, td, div').each(function() {
                var t = $(this).text();
                if (/\bmark\b/i.test(t)) {
                    var m3 = t.match(/out\s+of\s*([\d.]+)/i);
                    if (m3) {
                        maxMark = parseFloat(m3[1]);
                        self.log('📏 Question max from page scan: ' + maxMark);
                        return false; // break
                    }
                }
            });
            if (maxMark) return maxMark;

            // Strategy 4: hidden maxmark input — Moodle uses name="qX:Y_-maxmark"
            // Find it in the same container as the mark input for accuracy
            var $hidden = null;
            if ($markInput && $markInput.length) {
                $hidden = $markInput.closest('div, fieldset, form')
                    .find('input[name*="maxmark"], input[name*="-maxmark"]').first();
            }
            if (!$hidden || !$hidden.length) {
                $hidden = $('input[name*="maxmark"], input[name*="-maxmark"]').first();
            }
            if ($hidden && $hidden.length) {
                maxMark = parseFloat($hidden.val());
                self.log('📏 Question max from hidden maxmark input: ' + maxMark);
                return maxMark;
            }

            // Strategy 5: input[max] attribute on the mark field
            if ($markInput && $markInput.length) {
                var inputMax = parseFloat($markInput.attr('max'));
                if (!isNaN(inputMax) && inputMax > 0) {
                    self.log('📏 Question max from input[max]: ' + inputMax);
                    return inputMax;
                }
            }

            self.log('📏 Question max mark NOT found — no scaling applied');
            return null;
        },

        extractCriterionName: function(text) {
            // Remove patterns like "(3)", "(3 marks)", ": 3 marks", "[weight: 20]" etc.
            var cleaned = text
                .replace(/\[weight:\s*[^\]]*\]/gi, '') // Remove [weight: X]
                .replace(/\([^)]*marks?\)/gi, '')        // Remove (3 marks)
                .replace(/\([^)]*points?\)/gi, '')       // Remove (3 points)
                .replace(/\(\d+\)/g, '')                 // Remove (3)
                .replace(/:\s*\d+\s*marks?/gi, '')      // Remove : 3 marks
                .replace(/:\s*\d+\s*points?/gi, '')     // Remove : 3 points
                .replace(/:/g, '')                         // Remove remaining colons
                .trim();

            return cleaned;
        },
        
        // Extract max marks from criterion name if present
        extractMaxFromCriterionName: function(text) {
            // Look for patterns like "(3)", "(3 marks)", ": 3 marks"
            var patterns = [
                /\((\d+)\s*marks?\)/i,    // (3 marks) or (3 mark)
                /\((\d+)\s*points?\)/i,   // (3 points) or (3 point)
                /\((\d+)\)/,               // (3)
                /:\s*(\d+)\s*marks?/i,    // : 3 marks
                /:\s*(\d+)\s*points?/i    // : 3 points
            ];
            
            for (var i = 0; i < patterns.length; i++) {
                var match = text.match(patterns[i]);
                if (match) {
                    return parseFloat(match[1]);
                }
            }
            
            return null;
        },
        
        getRowMaxScore: function($row) {
            var self = this;
            var maxScore = 0;
            
            // Find all cells with data-score in this row
            $row.find('.rs-cell[data-score]').each(function() {
                var cellText = $(this).text().trim();
                
                // Skip empty cells
                if (cellText.length === 0 || cellText === ' ') {
                    return; // continue
                }
                
                var score = parseFloat($(this).attr('data-score'));
                if (!isNaN(score) && score > maxScore) {
                    maxScore = score;
                }
            });
            
            return maxScore;
        },
        
        expandTinyMCE: function() {
            var self = this;
            
            try {
                if (typeof tinyMCE !== "undefined" && tinyMCE.activeEditor) {
                    self.expandSpecificEditor(tinyMCE.activeEditor);
                } else if (typeof tinyMCE !== "undefined" && tinyMCE.editors && tinyMCE.editors.length > 0) {
                    tinyMCE.editors.forEach(function(editor) {
                        self.expandSpecificEditor(editor);
                    });
                }
            } catch (e) {
                self.log('Could not expand TinyMCE: ' + e.message);
            }
        }
    };

    // Auto-start
    console.log('🎯 RubricGrader: Script file loaded!');
    console.log('🎯 RubricGrader: jQuery available:', typeof jQuery !== 'undefined');
    RubricGrader.init();

})(jQuery);
