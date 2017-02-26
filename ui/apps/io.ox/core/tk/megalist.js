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

    $('body').append(
        $('<ul class="megalist" role="listbox" aria-multiselectable="true">').append(
            _.range(0, 20).map(function (i) {
                return $('<li tabindex="-1" role="option" aria-selected="false" aria-checked="false">')
                    .attr('data-cid', i)
                    .text('List option #' + i);
            })
        )
    );

    var $list = $('.megalist'), $items = $list.children();

    // initialize
    $list.children().first().attr({ 'tabindex': 1, 'aria-selected': true });

    // debug
    $list.on('change', function (e, data) {
        console.log('selection change', data);
    });

    // the root element during range select
    var rangeStart = 0;

    $list
        .attr('tabindex', -1)
        .find('li').attr('tabindex', -1).end()
        .find('li:first').attr('tabindex', 0).end()
        .focus();

    // DOM EVENTS

    $list.on('focusin focusout', function (e) {
        $(this).toggleClass('has-focus', e.type === 'focusin');
    });

    $list.on('keydown', function (e) {
        switch (e.which) {
            case 32: onSpace(e); break;
            case 38:
            case 40: onCursor(e); break;
            /* no default */
        }
    });

    $list.on('mousedown', 'li', function (e) {
        trigger(e.currentTarget, e.metaKey ? 'toggle' : 'select', e);
    });

    $list.on('select', 'li', function (e) {
        onSelect.call(e.currentTarget, e);
    });

    $list.on('toggle', 'li', function (e) {
        onToggle.call(e.currentTarget, e);
    });

    // HELPER

    var CHECKED = 'aria-checked', CHECKED_true = '[' + CHECKED + '="true"]',
        SELECTED = 'aria-selected', SELECTED_true = '[' + SELECTED + '="true"]',
        TABINDEX = 'tabindex', TABINDEX_1 = '[' + TABINDEX + '="1"]';

    function get(arg) {
        return _.isNumber(arg) ? $list.children().eq(arg) : $(arg);
    }

    function getAllChecked() {
        return $items.filter(CHECKED_true);
    }

    function getAllSelected() {
        return $items.filter(SELECTED_true);
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

        var index = $items.index(this);

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

        var index = $items.index(document.activeElement), item;

        index += e.which === 38 ? -1 : +1;
        if (index < 0 || index >= $items.length) return;

        item = get(index);
        focus(item);

        // just focus movement if alt is pressed
        if (e.metaKey) {
            // clear selection if we're not in multi-selection
            if (getAllChecked().length === 0) deselectAll();
            rangeStart = index;
            return;
        }

        trigger(item, 'select', e);
    }

    function onSpace(e) {
        e.preventDefault();
        trigger(document.activeElement, 'toggle', e);
    }

    // CHANGE STATE

    function toggle(item) {
        var checked = item.attr(CHECKED) === 'true';
        item.attr(CHECKED, !checked).attr(SELECTED, !checked);
    }

    function focus(item) {
        $list.children(TABINDEX_1).attr(TABINDEX, -1);
        item.attr(TABINDEX, 1).focus();
    }

    function select(item) {
        item.attr(SELECTED, true);
    }

    function selectRange(index) {
        var start = Math.min(rangeStart, index), end = Math.max(rangeStart, index);
        $items.slice(start, end + 1).attr(CHECKED, true).attr(SELECTED, true);
    }

    function deselectAll() {
        getAllChecked().attr(CHECKED, false);
        getAllSelected().attr(SELECTED, false);
    }

    // PROGAPATE CHANGE

    function getCIDs(selector) {
        return $items.filter(selector).map(function () { return $(this).attr('data-cid'); }).toArray();
    }

    function propagateChange() {
        $list.trigger('change', { checked: getCIDs(CHECKED_true), selected: getCIDs(SELECTED_true) });
    }
});
