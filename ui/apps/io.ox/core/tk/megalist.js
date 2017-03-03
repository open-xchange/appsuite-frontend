/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/megalist', [], function () {

    'use strict';

    // draw example list

    var li = $('<li tabindex="-1" role="option" aria-selected="false" aria-checked="false" data-cid=""><i class="fa checkmark" aria-hidden="true"></i></li>');

    $('body').append(
        $('<ul class="megalist checkboxes" role="listbox" aria-multiselectable="true">').append(
            _.range(0, 100).map(function (i) {
                return li.clone().attr('data-cid', i).append($.txt('List option #' + i));
            })
        )
    );

    var $el = $('.megalist'), el = $el[0];

    // the root element during range select
    var rangeStart = 0;

    $el
        .attr('tabindex', -1)
        .find('li:first').attr({ 'tabindex': 1, 'aria-selected': true }).end()
        .focus();

    // DOM EVENTS

    $el
        .on('focusin focusout', function (e) {
            $(this).toggleClass('has-focus', e.type === 'focusin');
        })
        .on('keydown', function (e) {
            switch (e.which) {
                case 13: onEnter(e); break;
                case 32: onSpace(e); break;
                case 35:
                case 36: onHomeEnd(e); break;
                case 38:
                case 40: onCursor(e); break;
                /* no default */
            }
        })
        .on('mousedown', 'li', function (e) {
            var isToggle = e.ctrlKey || e.metaKey || (e.offsetX < 48 && hasCheckboxes());
            trigger(e.currentTarget, isToggle ? 'toggle' : 'select', e);
        })
        .on('select', 'li', function (e) {
            onSelect.call(e.currentTarget, e);
        })
        .on('toggle', 'li', function (e) {
            onToggle.call(e.currentTarget, e);
        })
        .on('enter action', function (e, cid) {
            console.log('selection:' + e.type, cid);
        })
        .on('change', function (e, data) {
            console.log('selection:change', data);
        });

    // HELPER

    var CHECKED = 'aria-checked', CHECKED_true = '[' + CHECKED + '="true"]',
        CHECKED_false = '[' + CHECKED + '="false"]',
        SELECTED = 'aria-selected', SELECTED_true = '[' + SELECTED + '="true"]',
        TABINDEX = 'tabindex', TABINDEX_1 = '[' + TABINDEX + '="1"]';

    function get(arg) {
        return _.isNumber(arg) ? $el.children().eq(arg) : $(arg);
    }

    function getAllChecked() {
        return $el.children().filter(CHECKED_true);
    }

    function getAllSelected() {
        return $el.children().filter(SELECTED_true);
    }

    function hasChecked() {
        return !!el.querySelector(CHECKED_true);
    }

    function hasCheckboxes() {
        return $el.hasClass('checkboxes');
    }

    function trigger(arg, type, e) {
        get(arg).trigger($.Event(type, { shiftKey: e.shiftKey }));
    }

    // EVENT HANDLING

    function onToggle() {
        toggle($(this));
        propagateChange();
    }

    function onSelect(e) {

        var index = $el.children().index(this);

        deselectAll();

        if (e.shiftKey) {
            selectRange(index);
        } else {
            rangeStart = index;
            select(get(index));
        }

        propagateChange();
    }

    function onCursor(e) {

        e.preventDefault();

        var items = $el.children(),
            index = items.index(document.activeElement), item;

        index += e.which === 38 ? -1 : +1;
        if (index < 0 || index >= items.length) return;

        item = get(index);
        focus(item);

        // just focus movement if cmd/ctrl key is pressed
        if (e.ctrlKey || e.metaKey) {
            // clear selection if we're not in multi-selection
            if (!hasChecked()) deselectAll();
            rangeStart = index;
            return;
        }

        trigger(item, 'select', e);
    }

    function onHomeEnd(e) {
        var item = $el.children().eq(e.which === 35 ? -1 : 0);
        focus(item);
        trigger(item, 'select', e);
    }

    function onSpace(e) {
        e.preventDefault();
        trigger(document.activeElement, 'toggle', e);
    }

    function onEnter() {
        $el.trigger('enter', $(document.activeElement).attr('data-cid'));
    }

    // CHANGE STATE

    function toggle(item) {
        var newState = item.attr(CHECKED) !== 'true';
        if (hasCheckboxes()) {
            var count = getAllChecked().length;
            item.attr(CHECKED, newState);
            if (newState || count > 1) item.attr(SELECTED, newState);
            if (newState) $el.children(CHECKED_false + SELECTED_true).attr(SELECTED, false);
        } else {
            item.attr(CHECKED, newState).attr(SELECTED, newState);
        }
    }

    function focus(item) {
        $el.children(TABINDEX_1).attr(TABINDEX, -1);
        item.attr(TABINDEX, 1).focus();
    }

    function select(item) {
        item.attr(SELECTED, true);
    }

    function selectRange(index) {
        var start = Math.min(rangeStart, index), end = Math.max(rangeStart, index);
        $el.children().slice(start, end + 1).attr(CHECKED, true).attr(SELECTED, true);
    }

    function deselectAll() {
        getAllChecked().attr(CHECKED, false);
        getAllSelected().attr(SELECTED, false);
    }

    function toggleCheckboxes(state) {
        $el.toggleClass('checkboxes', state);
    }

    window.toggleCheckboxes = toggleCheckboxes;

    // PROGAPATE CHANGE

    function getCIDs(selector) {
        return $el.children(selector).map(function () { return $(this).attr('data-cid'); }).toArray();
    }

    function propagateChange() {
        var selected = getCIDs(SELECTED_true), checked;
        if (hasCheckboxes()) {
            checked = selected.length > 1 ? selected : [];
        } else {
            checked = getCIDs(CHECKED_true);
        }
        $el.trigger('change', { checked: checked, selected: selected });
    }
});
