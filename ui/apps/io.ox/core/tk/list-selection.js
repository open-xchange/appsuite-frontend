/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/list-selection', [], function () {

    'use strict';

    var SELECTABLE = '.selectable';

    function Selection(view) {

        this.lastIndex = -1;
        this.view = view;

        var self = this;

        this.view.$el
            // normal click/keybard navigation
            .on('keydown', SELECTABLE, $.proxy(this.onKeydown, this))
            .on(Modernizr.touch ? 'tap' : 'mousedown', SELECTABLE, $.proxy(this.onClick, this))
            // help accessing the list via keyboard if selection is empty
            .on('focus', function () {
                var node = $(this).find('[tabindex="1"]').first();
                if (node.length) node.focus();
            })
            .on('keydown', function (e) {
                if (e.target === this) self.onKeydown(e);
            });
    }

    _.extend(Selection.prototype, {

        // returns array of composite keys (strings)
        get: function () {
            // don't return jQuery's result directly, because it doesn't return a "normal" array (tests might fail)
            return _(this.view.$el.find(SELECTABLE + '.selected')).map(function (node) {
                return $(node).attr('data-cid');
            });
        },

        getItems: function () {
            return this.view.$el.find(SELECTABLE);
        },

        getNode: function (cid) {
            this.getItems().filter('[data-cid="' + cid + '"]');
        },

        getCurrentNode: function () {
            if (this.lastIndex === -1) return;
            return this.getItems().eq(this.lastIndex);
        },

        check: function (nodes) {
            nodes.addClass('selected').attr('aria-selected', true);
        },

        uncheck: function (nodes) {
            nodes.removeClass('selected').attr({ 'aria-selected': false, tabindex: '-1' });
        },

        toggle: function (node) {
            if (node.hasClass('selected')) this.uncheck(node); else this.check(node);
        },

        set: function (list) {

            if (!_.isArray(list)) return;

            var items = this.getItems(), hash = {}, self = this;

            this.clear();

            // convert array to hash, then loop over all DOM nodes once (faster)
            _(list).each(function (item) {
                var cid = typeof item === 'string' ? item : _.cid(item);
                hash[cid] = true;
            });

            items.each(function (index) {
                var node = $(this), cid = node.attr('data-cid');
                if (cid in hash) {
                    self.check(node);
                    self.lastIndex = index;
                }
            });

            if (this.lastIndex > -1) {
                items.eq(this.lastIndex).attr('tabindex', '1');
            }
        },

        triggerChange: _.debounce(function () {
            this.view.trigger('selection:change', this.get());
        }, 100),

        clear: function (items) {
            items = items || this.getItems();
            this.resetTabIndex(items);
            this.resetCheckmark(items);
            this.reset();
        },

        // a collection reset implies a clear
        reset: function () {
            this.lastIndex = -1;
            this.triggerChange();
        },

        add: function (/* cid, node */) {
            // TODO: predefined selection
        },

        remove: function (cid, node) {
            node = node || this.getNode(cid);
            if (!node.is('.selected')) return;
            this.triggerChange();
        },

        isRange: function (e) {
            return e && e.shiftKey;
        },

        isMultiple: function (e) {
            return e && (e.metaKey || e.ctrlKey);
        },

        resetTabIndex: function (items) {
            items.filter('[tabindex="1"]').attr('tabindex', '-1');
        },

        resetCheckmark: function (items) {
            items.filter('.selected').removeClass('selected');
        },

        select: function (index, items, e) {

            var start, end, node;

            items = items || this.getItems();

            if (this.isRange(e)) {
                // range select
                var start = Math.min(index, this.lastIndex),
                    end = Math.max(index, this.lastIndex);
                this.check(items.slice(start, end + 1));
                items.eq(index).attr('tabindex', '1').focus();
            } else {
                // single select
                node = items.eq(index).attr('tabindex', '1').focus();
                if (this.isMultiple(e)) this.toggle(node); else this.check(node);
                this.lastIndex = (items.length + index) % items.length; // support for negative index like -1
            }
        },

        onKeydown: function (e) {

            if (e.which !== 40 && e.which !== 38) return;

            var items = this.getItems(),
                current = $(document.activeElement),
                index = (items.index(current) || 0) + (e.which === 38 ? -1 : +1);

            if (index >= items.length || index < 0) return;

            // prevent default to avoid unwanted scrolling
            e.preventDefault();

            this.resetTabIndex(items);
            this.resetCheckmark(items);

            // jump to top/bottom OR range select / single select
            index = this.isMultiple(e) ? (e.which === 38 ? 0 : -1) : index;
            this.select(index, items, e);
            this.triggerChange();
        },

        onClick: function (e) {

            var items = this.getItems(),
                current = $(e.currentTarget),
                index = items.index(current) || 0,
                previous = this.get();

            this.resetTabIndex(items);
            if (!this.isMultiple(e)) this.resetCheckmark(items);

            // range select / single select
            this.select(index, items, e);
            if (!_.isEqual(previous, this.get())) this.triggerChange();
        }
    });

    return Selection;
});
