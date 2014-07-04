/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/selection', [], function () {

    'use strict';

    function Selection(view) {

        this.view = view;

        this.view.$el
            .on('click', '.selectable', $.proxy(this.onClick, this))
            .on('keydown', '.selectable', $.proxy(this.onKeydown, this));
    }

    _.extend(Selection.prototype, {

        get: function () {
            return this.view.$el.find('.selectable.selected').attr('data-id');
        },

        set: function (id) {
            var items = this.getItems(),
                node = items.filter('[data-id="' + $.escape(id) + '"]'),
                index = items.index(node);
            // check if already selected to avoid event loops
            if (index === -1 || node.hasClass('selected')) return;
            this.pick(index, items, { focus: false });
        },

        preselect: function (id) {
            var node = this.getItems().filter('[data-id="' + $.escape(id) + '"]');
            this.check(node);
        },

        onClick: function (e) {

            var items = this.getItems(),
                current = $(e.currentTarget),
                index = items.index(current) || 0;

            // do nothing if already selected
            if (current.hasClass('selected')) return;

            this.resetTabIndex(items, items.eq(index));
            this.resetSelected(items);
            this.pick(index, items);
        },

        onKeydown: function (e) {
            // bubbling?
            if (!$(e.target).hasClass('selectable')) return;
            // cursor up/down
            switch (e.which) {
            case 38:
            case 40:
                this.onCursorUpDown(e);
                break;
            }
        },

        onCursorUpDown: function (e) {

            var items = this.getItems().filter(':visible'),
                current = $(document.activeElement),
                index = (items.index(current) || 0) + (e.which === 38 ? -1 : +1);

            if (index >= items.length || index < 0) return;

            // prevent default to avoid unwanted scrolling
            e.preventDefault();

            this.resetTabIndex(items, items.eq(index));
            this.resetSelected(items);
            this.pick(index, items);
        },

        pick: function (index, items) {
            var node = this.focus(index, items);
            this.check(node);
            this.triggerChange(items);
        },

        resetSelected: function (items) {
            items.filter('.selected').removeClass('selected').attr('aria-selected', false);
        },

        resetTabIndex: function (items, skip) {
            items = items.filter('[tabindex="1"]');
            items.not(skip).attr('tabindex', '-1');
        },

        focus: function (index, items) {
            items = items || this.getItems();
            var node = items.eq(index).attr('tabindex', '1').focus();
            // workaround for chrome's CSS bug:
            // styles of "selected" class are not applied if focus triggers scrolling.
            // idea taken from http://forrst.com/posts/jQuery_redraw-BGv
            if (_.device('chrome')) node.hide(0, function () { $(this).css('display', ''); });
            return node;
        },

        check: function (nodes) {
            nodes.addClass('selected').attr('aria-selected', true);
        },

        uncheck: function (nodes) {
            nodes.removeClass('selected').attr({ 'aria-selected': false, tabindex: '-1' });
        },

        getItems: function () {
            return this.view.$el.find('.selectable');
        },

        triggerChange: _.debounce(function (items) {
            var id = (items || this.getItems()).filter('.selected').attr('data-id');
            // ignore virtual folders
            if (/^virtual/.test(id)) return;
            // trigger change event on view
            console.log('trigger change event', id);
            this.view.trigger('change', id);
        }, 300)
    });

    return Selection;
});
