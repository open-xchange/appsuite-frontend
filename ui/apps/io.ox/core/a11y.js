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
    $(document).on('keydown.role.button', 'a[role="button"]', function (e) {
        if (!/32/.test(e.which) || e.which === 13 && e.isDefaultPrevented()) return;
        e.preventDefault();
        $(this).click();
    });

    // focus folder tree from top-bar on <enter>
    $(document).on('keydown.topbar', '#io-ox-topbar .active-app a', function (e) {
        if (e.which === 13) $('.folder-tree:visible .folder.selected').focus();
    });

    // focus active app from foldertree on <escape> and focus listview on <enter>
    $(document).on('keydown.foldertree', '.folder-tree .folder.selected', function (e) {
        if (!/13|27/.test(e.which)) return;
        if (!$(e.target).is('li')) return;
        var node = $(e.target).closest('.window-container');
        if (node.hasClass('io-ox-mail-window') || node.hasClass('io-ox-files-window')) return;
        if (e.which === 27) $('#io-ox-topbar .active-app a').focus();
        if (e.which === 13) {
            node.find('.list-item.selectable.selected, .list-item.selectable:first, .vgrid-cell.selectable.selected, .vgrid-cell.selectable:first, .vgrid-scrollpane-container, .rightside, .scrollpane.f6-target').first().visibleFocus();
        }
    });

    // Focus foldertree on <escape> when in list-view or vgrid
    $(document).on('keydown.focusFolderTree', '.list-item, .vgrid-scrollpane-container', function (e) {
        if (!/13|27/.test(e.which)) return;
        var node = $(e.target).closest('.window-container');
        if (node.hasClass('io-ox-mail-window') || node.hasClass('io-ox-files-window')) return;
        if (e.which === 27) node.find('.folder-tree .folder.selected').focus();
        if (e.which === 13) node.find('.rightside, .list-item.focusable:first').last().visibleFocus();
    });

    $(document).on('keydown.rightside', '.rightside,.scrollpane.f6-target', function (e) {
        if (e.which !== 27) return;
        var node = $(e.target).closest('.window-container');
        if (node.hasClass('io-ox-mail-window') || node.hasClass('io-ox-files-window')) return;
        node.find('.folder-tree .folder.selected, .list-item.selectable.selected, .vgrid-cell.selectable.selected:first, .vgrid-scrollpane-container').last().focus();
    });

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

    $.fn.visibleFocus = function () {
        return fnFocus.apply(this);
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

    return {
        getTabbable: getTabbable,
        trapFocus: trapFocus
    };
});
