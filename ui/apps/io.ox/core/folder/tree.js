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

define('io.ox/core/folder/tree', ['io.ox/core/folder/view', 'less!io.ox/core/folder/style'], function (FolderView) {

    'use strict';

    var FolderTreeView = Backbone.View.extend({

        className: 'folder-tree bottom-toolbar abs',

        events: {
            'click .selectable': 'onClick',
            'keydown .selectable': 'onKeydown'
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
            switch (e.which) {
            // cursor up/down
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
            this.triggerChange();
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
            return this.$el.find('.selectable');
        },

        triggerChange: function () {
            var id = this.$el.find('.selectable.selected').attr('data-id');
            console.log('change', id);
            this.trigger('change', id);
        },

        initialize: function (options) {
            this.root = options.root;
            this.module = options.module;
            this.$el.attr({ role: 'tree', tabindex: '1' });
            this.$el.data('view', this);
        },

        filter: function (model) {
            var module = model.get('module');
            return module === this.module || (module === 'mail' && (/^default\d+(\W|$)/i).test(model.id));
        },

        render: function () {
            this.$el.append(
                new FolderView({ folder: this.root, headless: true, open: true, tree: this }).render().$el
            );
            return this;
        }
    });

    return FolderTreeView;
});
