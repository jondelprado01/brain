/*
 * ============================================================================================================================
 * AI-GENERATED CODE NOTICE
 * This file was authored with substantial assistance from an AI coding tool (Claude Code / Anthropic Claude). Review before
 * relying on it in production.
 * ----------------------------------------------------------------------------------------------------------------------------
 * timephase-instance-calc.js  --  live-compute + save-gate for the timephasing instance-edit view
 * (INDEX_ALT.PHP?...&timephase-instance=<TPI_ID>). Loaded ONLY on that view (INDEX_ALT.PHP adds the <script> when
 * ?timephase-instance is present) and AFTER the shared, UNMODIFIED js/custom.js so custom.js binds its own handlers first.
 *
 * What it does (2026-09-28 RM, AI: Claude Code):
 *   - For ATE WS / ATE PBS setups only (FOR NOW), keeps the two trailing display-only columns TD EFF (col 34) and
 *     WFR IDX % (col 35) correct: when a user COMMITS an edit (blur / Enter, not per-keystroke) to an instance input
 *     (TTPI / UTPI / IndxPI / OEE) it recomputes that setup's
 *     TD_EFF / WFR_IDX_PCT through the same-origin proxy requests/TIMEPHASE_RUNRATE_PROXY.PHP (which sources GROSS_DPW
 *     server-side and fans out to the afotcosj004 RUNRATE calc). "Apply Calc to All" recomputes every WS/PBS setup in ONE
 *     batched proxy call. ATE FT rows carry no TD EFF / WFR IDX % cells, so they are inert here.
 *   - Non-blocking + visible: a phased status badge (Collecting edits -> Sending to calc & awaiting result -> Updated) shows next
 *     to Save, and the affected TD EFF / WFR IDX % cells pulse AMBER ("working") from the moment the recompute is kicked off until the
 *     result lands, then flash by DIRECTION: GREEN if the recomputed value rose, RED if it fell, brief GREY if unchanged (these are
 *     efficiency numbers -- higher is better, so up = green). The amber pulse is held a minimum time so it shows at least once even on
 *     an instant round-trip, and the result flash always fires (incl. grey when identical), so the user always sees that a calc ran.
 *   - Save gate: .btn-save-config is disabled (plus a capture-phase click guard that stopImmediatePropagation()s the
 *     bubble-phase custom.js handler) while any recompute is pending or in flight, or after a calc error, so no stale /
 *     partial TD_EFF / WFR_IDX_PCT can be saved. Persistence itself rides the UNCHANGED custom.js save loop + TPI_PUT: the
 *     TD EFF / WFR IDX % <td> are stamped instance-field / instance-identifier / instance-data-id, so writing their .text()
 *     is enough for them to be harvested and persisted (see the two *_INSTANCE_ALT.PHP templates).
 *
 * EXTENSIBILITY (2026-09-28 RM): TD_EFF / WFR_IDX_PCT are the only outputs in this build, but INDX and OEE (which apply to
 * ATE FT too) will hook into this same proxy once enabled on the afotcosj004 API. The plumbing is therefore field-agnostic:
 * add a descriptor to OUTPUTS (field, cellClass, dp) + any new input to TRIGGERS and the trigger -> batch -> apply -> gate
 * flow carries them with no rework. (INDX/OEE also need per-field trigger sets + a manual-override confirm UX -- out of scope
 * here; see memory wfr-idx-pct-runrate-api.)
 * ============================================================================================================================
 */
(function () {
    'use strict';

    // Only run on the instance-edit view; on any other page this file is a no-op (it should not even be loaded elsewhere).
    var urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('timephase-instance')) { return; }

    // ---- config -----------------------------------------------------------------------------------------------------------
    // OUTPUTS: the derived fields this build maintains. cellClass = the <td> class the templates stamp; dp = display decimals
    // (must match the templates: TD EFF 2 dp, WFR IDX % 3 dp) so the recomputed .text() compares cleanly against instance-default.
    var OUTPUTS = [
        { field: 'TD_EFF',      cellClass: 'td-eff-cell',  dp: 2 },
        { field: 'WFR_IDX_PCT', cellClass: 'wfr-idx-cell', dp: 3 }
    ];
    // TRIGGERS: instance-input fields whose edit forces a recompute -- the union of user-editable inputs to the derived outputs
    // TD_EFF / WFR_IDX_PCT (RUNRATE inputs UTPI/TTPI/INDX/OEE) AND UTPH (= OEE * TD_EFF * WFR_IDX_PCT * UTPI*3600 / (TTPI+INDX),
    // per MAPPER_BRAIN_006 UTPH_CALC). OEE feeds UTPH (and is passed to RUNRATE), so editing it must also gate + recompute. The
    // display-only cells (QC Factor / Sprint UPH / UPH) are NOT inputs and never trigger. Stored (cloned) values stand untouched
    // until the user edits one of these -- we trust brain_adi_alldb_all's cloned TD_EFF/WFR_IDX_PCT and do not recompute on load.
    var TRIGGERS  = ['TTPI', 'UTPI', 'INDX', 'OEE'];
    var PROXY_URL = 'requests/TIMEPHASE_RUNRATE_PROXY.PHP';

    // ---- state ------------------------------------------------------------------------------------------------------------
    var inFlight      = 0;      // number of proxy calls currently outstanding.
    var pendingIdents = {};     // setup instance-identifier -> its <tr>, queued for the next debounced batch (dedupes rapid edits).
    var debounceTimer = null;
    var hadError      = false;  // sticky until the next successful recompute or an explicit dismiss; keeps Save disabled meanwhile.
    var lastErrorMsg  = '';
    var doneTimer     = null;   // clears the transient "Updated" confirmation badge back to idle after a short delay.
    var lastSentCount = 0;      // how many setups the last batch actually sent to the calc (0 = nothing valid was collected).
    // Blink state: the output cells (TD EFF / WFR IDX %) pulse while a recompute is being kicked off + is in flight, and stop when
    // it settles. MIN_BLINK_MS guarantees at least one visible blink even if the round-trip is near-instant, so the user always
    // gets a "something happened" cue -- including when the returned value is identical to what was already shown.
    var MIN_BLINK_MS   = 750;
    var blinkStart     = 0;
    var blinkStopTimer = null;
    var $blinkCells    = $();   // the set of cells currently in the blinking state.

    // ---- small helpers ----------------------------------------------------------------------------------------------------
    function hasPending() { for (var k in pendingIdents) { if (pendingIdents.hasOwnProperty(k)) { return true; } } return false; }
    function isBusy()     { return inFlight > 0 || hasPending(); }

    // Select the ENTIRE value of a typable field when focus enters it (click or Tab), so a click drops in ready to overwrite the
    // whole number rather than placing a caret mid-value. contenteditable <td> (the instance inputs) need a Range over the node
    // contents (.select() is input-only); native text inputs/textarea use .select(). Callers defer this to a macrotask so it runs
    // AFTER the click's own mouseup, which would otherwise immediately collapse the range back to a caret at the click point.
    function selectAllOnFocus(el) {
        if (!el) { return; }
        var tag = (el.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            try { el.select(); } catch (e) { /* some input types reject select(); ignore */ }
            return;
        }
        if (el.isContentEditable) {
            try {
                var range = document.createRange();
                range.selectNodeContents(el);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (e) { /* Selection API can throw on detached/odd nodes; ignore -- caret placement still works */ }
        }
    }

    // The output cells for a row (or all of them): TD EFF + WFR IDX %. These are what pulse during a recompute.
    function $rowOutputs($row) { return $row.find('.td-eff-cell, .wfr-idx-cell'); }
    function $allOutputs()     { return $('.td-eff-cell, .wfr-idx-cell'); }

    // Start the pulsing indicator on the given output cells (idempotent; new cells fold into the active set). blinkStart is stamped
    // when the first cells begin so stopBlink() can enforce MIN_BLINK_MS -- i.e. hold the blink long enough to be seen even if the
    // calc returns almost immediately. A pending stop is cancelled: as long as work is being kicked off, the cells keep blinking.
    function startBlink($cells) {
        if (!$cells || !$cells.length) { return; }
        if (blinkStopTimer) { clearTimeout(blinkStopTimer); blinkStopTimer = null; }
        if (!$blinkCells.length) { blinkStart = (new Date()).getTime(); }
        $blinkCells = $blinkCells.add($cells);
        $cells.addClass('tp-calc-blinking');
    }

    // Stop the pulsing once everything has settled, but not before MIN_BLINK_MS has elapsed since it started -- so a fast round-trip
    // still shows at least one full blink. If the minimum has not yet passed, defer the class removal for the remainder.
    function stopBlink() {
        if (!$blinkCells.length) { return; }
        var remain = MIN_BLINK_MS - ((new Date()).getTime() - blinkStart);
        var finish = function () { $blinkCells.removeClass('tp-calc-blinking'); $blinkCells = $(); blinkStopTimer = null; };
        if (blinkStopTimer) { clearTimeout(blinkStopTimer); blinkStopTimer = null; }
        if (remain > 0) { blinkStopTimer = setTimeout(finish, remain); } else { finish(); }
    }

    // Fire the result flash on ONE output cell once its recomputed value lands: green if it rose, red if it fell, neutral grey if
    // unchanged (efficiency numbers -- higher is better, so up = green). This TAKES OVER from the amber "working" pulse: we strip
    // tp-calc-blinking + any prior result class, force a reflow so re-adding the same class restarts its animation, then add the new
    // one. The animations are finite (3 blinks up/down, 2 same) and use fill-mode none, so the cell's normal bg returns when they end;
    // a per-cell timer (stored via .data) removes the class after the run and is cleared if a newer flash starts first.
    function flashDirection($cell, dir) {
        var cls = (dir === 'up') ? 'tp-calc-up' : ((dir === 'down') ? 'tp-calc-down' : 'tp-calc-same');
        var dur = (dir === 'same') ? 700 : 1050; // must cover the animation run: .35s * (2 same | 3 up/down).
        $cell.removeClass('tp-calc-blinking tp-calc-up tp-calc-down tp-calc-same');
        if ($cell[0]) { void $cell[0].offsetWidth; } // reflow: lets the same class re-trigger its animation on back-to-back recomputes.
        $cell.addClass(cls);
        var prev = $cell.data('tpFlashTimer');
        if (prev) { clearTimeout(prev); }
        $cell.data('tpFlashTimer', setTimeout(function () { $cell.removeClass(cls).removeData('tpFlashTimer'); }, dur));
    }

    // Build the proxy INPUT item for one setup row. Returns null when the row is not a WS/PBS setup (no .td-eff-cell) or when the
    // numeric inputs are not yet valid (UTPI/TTPI must be > 0; INDX/OEE finite) -- in which case we skip it and custom.js's own
    // NaN/<=0 validation will block Save on the bad input anyway.
    function buildItemForRow($row) {
        var $tdEff = $row.find('.td-eff-cell').first();
        if (!$tdEff.length) { return null; }

        function fieldNum(f) {
            var $c = $row.find('[instance-field="' + f + '"]').first();
            return $c.length ? parseFloat($.trim($c.text())) : NaN;
        }
        var utpi = fieldNum('UTPI'), ttpi = fieldNum('TTPI'), indx = fieldNum('INDX'), oee = fieldNum('OEE');
        if (isNaN(utpi) || utpi <= 0 || isNaN(ttpi) || ttpi <= 0 || isNaN(indx) || indx < 0 || isNaN(oee)) { return null; }

        return {
            KEY:          $tdEff.attr('instance-identifier'), // step|rte|prio|tester|handler -- unique per setup; echoed back.
            UTPI:         utpi,
            TTPI:         ttpi,
            INDX:         indx,
            OEE:          oee,
            RES_AREA:     $tdEff.attr('data-res-area'),
            HANDLER:      $tdEff.attr('data-handler'),
            MFG_PART_NUM: $tdEff.attr('data-partnum'),
            SITE_NUM:     $tdEff.attr('data-site'),
            STEP_NM:      $tdEff.attr('data-step'),
            SAP_RTE_ID:   $tdEff.attr('data-rte')
        };
    }

    // Write returned values into the matching output cells. Matched by cellClass + instance-identifier (iterated, not via an
    // attribute selector, so tester/handler names with odd characters can't break the lookup). instance-default is left as-is so
    // a value that differs from the stored baseline is picked up as a change by the custom.js save loop and persisted.
    function applyResults(dataMap) {
        if (!dataMap) { return; }
        OUTPUTS.forEach(function (o) {
            $('.' + o.cellClass).each(function () {
                var $cell = $(this);
                var key   = $cell.attr('instance-identifier');
                if (!key || !dataMap.hasOwnProperty(key)) { return; }
                var val = dataMap[key][o.field];
                if (val === null || val === undefined || val === '' || isNaN(parseFloat(val))) { return; }
                // Direction of change vs what the cell currently shows, judged at DISPLAY precision so a sub-dp wobble that rounds to
                // the same shown number does not paint a false green/red. A non-numeric / blank prior value -> neutral (can't compare).
                var oldNum = parseFloat($.trim($cell.text()));
                var newTxt = parseFloat(val).toFixed(o.dp);
                var dir    = 'same';
                if (!isNaN(oldNum)) {
                    var oldR = parseFloat(oldNum.toFixed(o.dp)), newR = parseFloat(newTxt);
                    if (newR > oldR) { dir = 'up'; } else if (newR < oldR) { dir = 'down'; }
                }
                $cell.text(newTxt);
                flashDirection($cell, dir); // green up / red down / grey same -- takes over from the amber "working" pulse.
            });
        });
    }

    // ---- save-gate + status badge ----------------------------------------------------------------------------------------
    function $saveButtons() { return $('.btn-save-config'); }
    function $statusBadge() { return $('#tp-calc-status'); }

    function updateGate() {
        var busy = isBusy();
        $saveButtons().prop('disabled', busy || hadError);

        var $badge = $statusBadge();
        if (!$badge.length) { return; }
        if (busy) {
            // Two distinct in-progress phases so the user can see the lifecycle: (1) a trigger fired and we are debouncing /
            // gathering the edited setups (pending, nothing in flight yet); (2) the batched request is on the wire and we are
            // awaiting the calc's response. Either phase disables Save.
            if (inFlight > 0) {
                $badge.attr('class', 'badge bg-primary ms-2')
                      .html('<i class="fa-solid fa-spinner fa-spin"></i> Sending to calc &amp; awaiting result…');
            } else {
                $badge.attr('class', 'badge bg-info text-dark ms-2')
                      .html('<i class="fa-solid fa-hourglass-half"></i> Collecting edits…');
            }
        } else if (hadError) {
            // Sticky error: keep Save disabled + show why, with a dismiss (x) so a structural error (e.g. no GROSS_DPW) does not
            // permanently lock Save when the user still wants to save other edits.
            $badge.attr('class', 'badge bg-danger ms-2')
                  .html('<i class="fa-solid fa-triangle-exclamation"></i> ' + escapeHtml(lastErrorMsg) +
                        ' <a href="#" class="text-white text-decoration-underline tp-calc-dismiss">dismiss</a>');
        } else {
            $badge.attr('class', 'ms-2').text('');
        }
    }

    // Transient green confirmation shown once a batch settles with no error -- the "received & applied" phase. Auto-clears back to
    // idle after a few seconds (unless another recompute has since started). Also re-enables Save (we are neither busy nor errored).
    function showDone() {
        $saveButtons().prop('disabled', false);
        var $badge = $statusBadge();
        if ($badge.length) {
            $badge.attr('class', 'badge bg-success ms-2')
                  .html('<i class="fa-solid fa-check"></i> Updated ' + lastSentCount + (lastSentCount === 1 ? ' setup' : ' setups'));
        }
        if (doneTimer) { clearTimeout(doneTimer); }
        doneTimer = setTimeout(function () { if (!isBusy() && !hadError) { updateGate(); } }, 3000);
    }

    // A trigger fired but nothing valid could be collected to send (buildItemForRow skipped every queued row -- e.g. a required
    // input like TTPI/UTPI/INDX/OEE is blank or non-numeric). Surface a brief amber note so an edit that produced NO recompute is
    // not silently swallowed, then fall back to the normal idle/gate state. Nothing is in flight here.
    function showEmptyNotice() {
        stopBlink(); // nothing is going to the calc; end the pulse (it still honored MIN_BLINK_MS, so it blinked at least once).
        updateGate();
        var $badge = $statusBadge();
        if ($badge.length && !hadError && !isBusy()) {
            $badge.attr('class', 'badge bg-warning text-dark ms-2')
                  .html('<i class="fa-solid fa-circle-info"></i> No recompute &mdash; check inputs');
            if (doneTimer) { clearTimeout(doneTimer); }
            doneTimer = setTimeout(function () { if (!isBusy() && !hadError) { updateGate(); } }, 3000);
        }
    }

    function escapeHtml(s) {
        return String(s === null || s === undefined ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function flagError(msg) {
        hadError     = true;
        lastErrorMsg = msg || 'Calc failed.';
        updateGate();
    }

    // ---- proxy batch call -------------------------------------------------------------------------------------------------
    function runBatch(items) {
        lastSentCount = (items && items.length) ? items.length : 0;
        if (!lastSentCount) { showEmptyNotice(); return; }
        inFlight++;
        updateGate(); // -> "Sending to calc & awaiting result…"
        $.ajax({
            url: PROXY_URL, method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ INPUT: items }), dataType: 'json'
        }).done(function (resp) {
            if (!resp || resp.ok !== true || !resp.DATA) {
                flagError(resp && resp.error ? resp.error : 'Calc failed (unexpected response).');
                return;
            }
            hadError = false; lastErrorMsg = '';
            applyResults(resp.DATA); // writes the recomputed values into the (blinking) output cells.
        }).fail(function (xhr) {
            var msg = 'Calc request failed.';
            try { var j = JSON.parse(xhr.responseText); if (j && j.error) { msg = j.error; } } catch (e) { /* keep default */ }
            flagError(msg);
        }).always(function () {
            inFlight--;
            // Settled: stop the pulse once no batch remains in flight (honoring the min-blink hold), then show the transient
            // "Updated" confirmation when nothing errored; otherwise fall back to the normal gate (sticky error / remaining phase).
            if (!isBusy()) { stopBlink(); }
            if (!isBusy() && !hadError) { showDone(); }
            else { updateGate(); }
        });
    }

    // ---- trigger -> debounced batch --------------------------------------------------------------------------------------
    function scheduleRecompute($row) {
        var $tdEff = $row.find('.td-eff-cell').first();
        if (!$tdEff.length) { return; } // not a WS/PBS setup -> nothing to recompute.
        pendingIdents[$tdEff.attr('instance-identifier')] = $row;
        startBlink($rowOutputs($row)); // kick the pulse on this setup's TD EFF / WFR IDX % the moment an input edit is registered.
        updateGate(); // gate Save immediately (a recompute is now pending) even before the debounce fires.
        if (debounceTimer) { clearTimeout(debounceTimer); }
        debounceTimer = setTimeout(flushPending, 450);
    }

    function flushPending() {
        var rows = pendingIdents;
        pendingIdents = {};
        var items = [];
        for (var k in rows) {
            if (rows.hasOwnProperty(k)) {
                var it = buildItemForRow(rows[k]);
                if (it) { items.push(it); }
            }
        }
        runBatch(items);
    }

    // Recompute EVERY WS/PBS setup in one batched proxy call. Batching (vs N calls) also limits the RUNRATE provenance-row writes.
    function applyAll() {
        var items = [];
        $('.td-eff-cell').each(function () {
            var it = buildItemForRow($(this).closest('tr'));
            if (it) { items.push(it); }
        });
        if (!items.length) { return; }
        startBlink($allOutputs()); // pulse every output cell while the one batched "apply to all" call is kicked off + in flight.
        runBatch(items);
    }

    // ---- wiring -----------------------------------------------------------------------------------------------------------
    $(document).ready(function () {

        // 2026-09-28 RM (AI: Claude Code): [AI-generated] inject the blink keyframe once (assets/LIST.PHP + the CSS files stay
        // untouched). .tp-calc-blinking pulses the cell background so the recomputing output columns visibly flash; !important
        // overrides the row's own bg class ($bg_cell / dedication tint) during the pulse. Removing the class restores that bg.
        if (!document.getElementById('tp-calc-style')) {
            // 2026-09-28 RM (AI: Claude Code): [AI-generated] blink / result indicator. Earlier invisible attempts taught us two things:
            // (1) steps(1,end) sampled a single keyframe point per iteration so the cell held solid; (2) animating background-color did
            // nothing because BOOTSTRAP 5 PAINTS TABLE-CELL BACKGROUNDS WITH AN INSET box-shadow FILL (box-shadow:inset 0 0 0 9999px
            // var(...)), which sits ON TOP of background-color. So EVERY pulse here animates that SAME inset box-shadow fill (the layer
            // Bootstrap actually shows) with !important, beating both Bootstrap's cell-bg box-shadow and the row's $bg_cell class.
            // Timing is linear with hold-then-snap keyframes (0-50% state A, 50.01-100% state B) = a crisp on/off square wave.
            //   .tp-calc-blinking : neutral AMBER "working" pulse (infinite) while a recompute is pending / in flight. Red can't mean
            //                       "busy" here because it now signals a DECREASE. Handed off to a result flash when the value lands.
            //   .tp-calc-up       : GREEN flash when the recomputed value ROSE (higher efficiency = good). Finite (3 blinks) then reverts.
            //   .tp-calc-down     : RED flash when it FELL. Finite (3 blinks) then reverts.
            //   .tp-calc-same     : brief neutral GREY flash when the value is unchanged (still confirms a calc ran). Finite (2 blinks).
            // Finite animations use the default fill-mode (none) so the cell's normal bg returns on its own when the animation ends;
            // the JS also removeClass()es after the run so the same class can be re-triggered on the next recompute.
            // CRITICAL: NO !important inside @keyframes -- per CSS spec an !important declaration in a keyframe is INVALID and is
            // DROPPED, which is exactly what made earlier attempts show "bold black, no color" (the class-level font-weight applied
            // but every animated box-shadow/color was discarded). !important is NOT needed anyway: CSS-Animation declarations sit
            // above normal author rules in the cascade, so the animated box-shadow overrides Bootstrap's (non-important) inset cell-bg
            // box-shadow on its own. An outline is animated too as a second, independent cue that no background fill can ever cover.
            var css = '@keyframes tpCalcWork{0%,50%{box-shadow:inset 0 0 0 9999px #ffd54a;color:#5c4600;outline:3px solid #b38f00;outline-offset:-3px;}'
                    + '50.01%,100%{box-shadow:inset 0 0 0 9999px #fff2b0;color:#5c4600;outline:3px solid #ffd54a;outline-offset:-3px;}}'
                    + '@keyframes tpFlashUp{0%,50%{box-shadow:inset 0 0 0 9999px #1e7e34;color:#ffffff;outline:3px solid #0b3d17;outline-offset:-3px;}'
                    + '50.01%,100%{box-shadow:inset 0 0 0 9999px #8ff0a4;color:#08350f;outline:3px solid #1e7e34;outline-offset:-3px;}}'
                    + '@keyframes tpFlashDown{0%,50%{box-shadow:inset 0 0 0 9999px #c82333;color:#ffffff;outline:3px solid #7a0f19;outline-offset:-3px;}'
                    + '50.01%,100%{box-shadow:inset 0 0 0 9999px #ffb3ae;color:#4a0600;outline:3px solid #c82333;outline-offset:-3px;}}'
                    + '@keyframes tpFlashSame{0%,50%{box-shadow:inset 0 0 0 9999px #adb5bd;color:#111111;outline:3px solid #6c757d;outline-offset:-3px;}'
                    + '50.01%,100%{box-shadow:inset 0 0 0 9999px #e9ecef;color:#111111;outline:3px solid #adb5bd;outline-offset:-3px;}}'
                    + '.tp-calc-blinking{animation:tpCalcWork .5s linear infinite !important;font-weight:700 !important;}'
                    + '.tp-calc-up{animation:tpFlashUp .35s linear 3 !important;font-weight:700 !important;}'
                    + '.tp-calc-down{animation:tpFlashDown .35s linear 3 !important;font-weight:700 !important;}'
                    + '.tp-calc-same{animation:tpFlashSame .35s linear 2 !important;font-weight:700 !important;}';
            $('<style id="tp-calc-style"></style>').text(css).appendTo('head');
        }

        // Inject the "Apply Calc to All" control + the status badge next to the existing Save button (no template edit needed).
        var $save = $saveButtons().first();
        if ($save.length && !$('#tp-calc-apply-all').length) {
            var $apply = $('<button type="button" id="tp-calc-apply-all" class="btn btn-outline-primary btn-sm">' +
                           'Apply Calc to All <i class="fa-solid fa-calculator"></i></button>');
            var $badge = $('<span id="tp-calc-status" class="ms-2"></span>');
            $save.before($apply);
            $save.after($badge);
            $apply.on('click', function (e) { e.preventDefault(); applyAll(); });
        }

        // Delegated trigger binding on the instance inputs. Recompute fires ONLY when the user COMMITS an edit -- on 'focusout'
        // (blur / Tab out) or by pressing Enter -- NOT on every keystroke, so the RUNRATE calc runs once per finished edit rather
        // than mid-typing (which would fire a call on each character and thrash the calc + provenance writes).
        var triggerSel = TRIGGERS.map(function (f) { return '[instance-field="' + f + '"]'; }).join(', ');
        // Snapshot the value the moment focus ENTERS a trigger cell, so on blur we can tell whether the user actually changed it.
        $(document).on('focusin', triggerSel, function () {
            $(this).data('tpPrevVal', $.trim($(this).text()));
        });
        // Recompute ONLY when a committed edit ACTUALLY CHANGED the value. Compare the value at focus-in vs at blur/Enter: a pure
        // select/deselect (focus then leave without editing) or re-typing the same number is a NO-OP -- no calc, no blink, no Save
        // gate. We treat both string-identical and numerically-identical (e.g. "5" -> "5.00") as unchanged so trivial reformatting
        // does not fire the calc. Falls back to instance-default as the baseline if focus-in was never seen (e.g. programmatic focus).
        $(document).on('focusout', triggerSel, function () {
            var $cell  = $(this);
            var before = $cell.data('tpPrevVal');
            if (before === undefined) { before = $.trim($cell.attr('instance-default') || ''); }
            var after  = $.trim($cell.text());
            $cell.removeData('tpPrevVal');
            if (before === after) { return; }                     // string-identical -> nothing changed.
            var bn = parseFloat(before), an = parseFloat(after);
            if (!isNaN(bn) && !isNaN(an) && bn === an) { return; } // numerically identical (e.g. "5" -> "5.00") -> nothing changed.
            scheduleRecompute($cell.closest('tr'));
        });
        // Enter commits the value like Tab/blur instead of inserting a carriage return: block the default newline and blur the cell,
        // which fires the 'focusout' above (one intentional trigger). Shift is ignored -- a newline in a numeric instance cell would
        // corrupt the value, so every Enter commits. (Native inputs would submit a form on Enter; preventDefault stops that too.)
        $(document).on('keydown', triggerSel, function (e) {
            if ((e.which || e.keyCode) === 13) {
                e.preventDefault();
                this.blur();
            }
        });

        // 2026-09-28 RM (AI: Claude Code): [AI-generated] auto-select the whole value when focus enters a typable field (a
        // contenteditable instance input, or a text/number input/textarea) so clicking in selects-all and the next keystroke
        // overwrites the value. Selects/checkboxes/radios/buttons are excluded (not "typable"). Deferred to a macrotask so the
        // selection survives the click's own mouseup (which would collapse it to a caret). jQuery maps delegated 'focus' -> focusin.
        var typableSel = '[contenteditable="true"], input[type="text"], input[type="number"], input:not([type]), textarea';
        $(document).on('focus', typableSel, function () {
            var el = this;
            setTimeout(function () { selectAllOnFocus(el); }, 0);
        });

        // Dismiss a sticky error (re-enables Save so unrelated edits can still be saved -- the calc simply did not update).
        $(document).on('click', '.tp-calc-dismiss', function (e) {
            e.preventDefault();
            hadError = false; lastErrorMsg = '';
            updateGate();
        });

        // Capture-phase guard: custom.js binds its Save handler in the bubble phase and loads first, so a disabled attribute alone
        // is the primary block; this ancestor-capture listener is the belt-and-suspenders that stops the event from ever reaching
        // that handler while a recompute is pending/in flight or an error is unresolved.
        document.addEventListener('click', function (e) {
            if (!(isBusy() || hadError)) { return; }
            var t = e.target;
            var btn = (t && t.closest) ? t.closest('.btn-save-config') : null;
            if (btn) {
                e.stopImmediatePropagation();
                e.preventDefault();
                updateGate();
            }
        }, true);

        updateGate();
    });

})();
