/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/core/a11y', [], function () {

    'use strict';

    //
    // Focus management
    //

    // fix for role="button"
    $(document).on('keydown', 'a[role="button"]', function (e) {
        if (!/32/.test(e.which) || e.which === 13 && e.isDefaultPrevented()) return;
        e.preventDefault();
        $(this).click();
    });

    // focus folder tree from top-bar on <enter>
    $(document).on('keydown', '#io-ox-topbar .active-app a', function (e) {
        if (e.which === 13) $('.folder-tree:visible .folder.selected').focus();
    });

    $(document).on('keydown.bs.dropdown.data-api', 'ul.dropdown-menu[role="menu"]', dropdownTrapFocus);

    $(document).on('keydown.launchers', 'ul[role="menubar"], ul[role="tablist"], ul[role="toolbar"]', menubarKeydown);

    $(document).on('mousedown', '.focusable, .scrollable[tabindex]', function (e) {
        respondToNonKeyboardFocus(e.currentTarget);
    });

    function respondToNonKeyboardFocus(node) {
        node = $(node);
        if (node.is('.scrollable[tabindex]')) {
            node.css('box-shadow', 'none').on('blur', removeBoxShadow);
        } else if (node.is('.focusable')) {
            node.css('outline', 0).on('blur', removeOutline);
        }
    }

    function removeOutline() {
        $(this).css('outline', '');
    }

    function removeBoxShadow() {
        $(this).css('box-shadow', '');
    }

    var fnFocus = $.fn.focus;
    $.fn.focus = function () {
        fnFocus.apply(this, arguments);
        if (document.activeElement === this[0]) respondToNonKeyboardFocus(this[0]);
        return this;
    };

    //
    // Tab trap
    //

    function getTabbable(el) {
        var skip = {},
            items = $(el).find('input, select, textarea, button, a[href], [tabindex]');
        return items
            // radio groups are special
            .filter(function () {
                // just take care of radio buttons
                if (!$(this).is(':radio')) return true;
                // we only need one radio per group
                var name = $(this).attr('name');
                // always have the active/checked element in the list
                if (this === document.activeElement || $(this).is(':checked')) return (skip[name] = true);
                if (skip[name]) return false;
                var group = items.filter('[name="' + $.escape(name) + '"]:radio');
                // wait for active/checked element?
                if (group.index(document.activeElement) > -1 || group.filter(':checked').length) return false;
                return (skip[name] = true);
            })
            .filter(function () {
                // skip tabbable elements of contenteditables
                return !$(this).closest('[contenteditable="true"]').length;
            })
            .filter('[tabindex!="-1"][disabled!="disabled"]:visible');
    }

    function trapFocus(el, e) {
        var items = getTabbable(el);
        if (!items.length) return;
        var index = items.index(document.activeElement),
            catchFirst = e.shiftKey && index === 0,
            catchLast = index === items.length - 1;
        // only jump in if first or last item; radio groups are a problem otherwise
        if (!catchFirst && !catchLast) return;
        e.preventDefault();
        index += (e.shiftKey) ? -1 : 1;
        index = (index + items.length) % items.length;
        items.eq(index).focus();
    }

    function dropdownTrapFocus(e) {

        var dropdown = $(e.target).closest('ul.dropdown-menu'),
            dropdownLinks = dropdown.find('> li > a'),
            firstLink = dropdownLinks.first(),
            lastLink = dropdownLinks.last(),
            isLastLink = $(e.target).is(lastLink),
            isFirstLink = $(e.target).is(firstLink);

        // do nothing if there is only one link
        if (dropdownLinks.length === 1) return;

        // a11y - trap focus in context menu - prevent tabbing out of context menu
        if ((!e.shiftKey && e.which === 9 && isLastLink) ||
            (e.shiftKey && e.which === 9 && isFirstLink)) {
            return trapFocus(dropdown, e);
        }

        // cursor up (38), page down (34), end (35)
        if (e.which === 38 && isFirstLink || e.which === 34 || e.which === 35) {
            e.stopImmediatePropagation();
            return lastLink.focus();
        }
        // cursor down (40), page up (33), home (36)
        if (e.which === 40 && isLastLink || e.which === 33 || e.which === 36) {
            e.stopImmediatePropagation();
            return firstLink.focus();
        }
        hotkey(e, dropdownLinks);
    }

    function hotkey(e, el) {
        // Typing a character key moves focus to the next node whose title begins with that character
        if (!el.filter(':focus').length) return;
        var nextFocus,
            a = el.map(function () {
                var linkText = $(this).text() || $(this).attr('aria-label');
                if (linkText.substring(0, 1).toLowerCase() === String.fromCharCode(e.which).toLowerCase()) return $(this);
            });
        if (!a.length) return; else if (a.length === 1) return a[0].focus();
        _.find(a, function (el, idx) {
            if (el.is(':focus') && (idx >= 0 && idx < a.length - 1)) nextFocus = a[idx + 1];
        });
        (nextFocus || a[0]).focus();
    }

    function cursorHorizontalKeydown(e, el) {
        if (!/(37|39)/.test(e.which)) return;
        var idx = el.index(el.filter(':focus'));
        if (e.which === 37) idx--; else idx++;
        if (idx < 0) idx = el.length - 1;
        if (idx === el.length) idx = 0;
        return el.eq(idx).focus();
    }

    function menubarKeydown(e) {
        if (e.which === 9 || e.which === 16 && e.shiftKey) return;
        if (e.which === 32) $(e.target).click(); // space
        var links = $(e.currentTarget).find('> li > a');
        cursorHorizontalKeydown(e, links);
        hotkey(e, links);
    }

    return {
        getTabbable: getTabbable,
        trapFocus: trapFocus,
        dropdownTrapFocus: dropdownTrapFocus,
        menubarKeydown: menubarKeydown
    };
});
