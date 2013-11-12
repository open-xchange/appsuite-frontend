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

define('io.ox/core/tk/list',
    ['io.ox/core/tk/list-selection',
     'io.ox/core/extensions',
     'gettext!io.ox/core'
    ], function (Selection, ext) {

    'use strict';

    var keyEvents = {
        13: 'enter',
        27: 'escape',
        32: 'space',
        37: 'cursor:left',
        38: 'cursor:up',
        39: 'cursor:right',
        40: 'cursor:down'
    };

    var ListView = Backbone.View.extend({

        tagName: 'ul',
        className: 'list-view',

        // a11y: use role=option and aria-selected here; no need for "aria-posinset" or "aria-setsize"
        // see http://blog.paciellogroup.com/2010/04/html5-and-the-myth-of-wai-aria-redundance/
        scaffold: $('<li class="list-item selectable" tabindex="-1" role="option" aria-selected="false">'),

        events: {
            'focus': 'onFocus',
            'focus .list-item': 'onItemFocus',
            'blur .list-item': 'onItemBlur',
            'keydown .list-item': 'onItemKeydown',
            'scroll': 'onScroll',
        },

        onFocus: function () {

        },

        onItemFocus: function () {
            this.$el.removeAttr('tabindex').addClass('has-focus');
        },

        onItemBlur: function () {
            this.$el.attr('tabindex', 1).removeClass('has-focus');
        },

        onItemKeydown: function (e) {
            if (keyEvents[e.which]) this.trigger(keyEvents[e.which], e);
        },

        onScroll: _.debounce(function () {

            if (this.isBusy) return;

            var height = this.$el.height(),
                scrollTop = this.$el.scrollTop(),
                scrollHeight = this.$el.prop('scrollHeight'),
                self = this;

            if ((scrollTop + height) < (scrollHeight - 50)) return;

            this.busy().fetch().always(function () {
                self.idle();
            });

        }, 100),

        initialize: function (options) {
            this.ref = this.ref || options.ref;
            this.selection = new Selection(this);
            this.model = options.model || new Backbone.Model();
            this.isBusy = false;
        },

        setCollection: function (collection) {
            // remove listeners
            this.stopListening(this.collection);
            this.collection = collection;
            this.listenTo(collection, {
                add: this.onAdd,
                change: this.onChange,
                remove: this.onRemove,
                reset: this.onReset
            });
            return this;
        },

        busy: function () {
            if (this.isBusy) return;
            this.$el.append(
                $('<li class="list-item busy-indicator"><i class="icon-refresh icon-spin"></i></div>')
            );
            this.isBusy = true;
            return this;
        },

        idle: function () {
            if (!this.isBusy) return;
            this.$el.find('.list-item.busy-indicator').remove();
            this.isBusy = false;
            return this;
        },

        filter: function () {
            return true;
        },

        fetch: function () {
            return $.when();
        },

        onReset: function () {
            this.idle();
            this.$el.empty().append(
                this.collection
                .map(this.renderListItem, this)
            );
        },

        onAdd: function (model) {
            this.idle();
            var index = model.get('index'),
                children = this.$el.children(),
                li = this.renderListItem(model);
            if (index < children.length) {
                // insert
                children.eq(index - 1).after(li);
            } else {
                // fast append - used by initial reset when list is empty
                this.$el.append(li);
            }
        },

        onRemove: function (model) {
            this.$el.find('li[data-cid="' + model.cid + '"]').remove();
        },

        onChange: function (model) {
            var li = this.$el.find('li[data-cid="' + model.cid + '"]'),
                data = model.toJSON(),
                baton = ext.Baton({ data: data, model: model });
            // filter?
            if (!this.filter(model)) return li.addClass('hidden');
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li.removeClass('hidden').empty(), baton);
        },

        render: function () {
            this.$el.attr({
                'aria-multiselectable': true,
                'data-ref': this.ref,
                'role': 'listbox',
                'tabindex': 1
            });
            return this;
        },

        renderListItem: function (model) {
            var li = this.scaffold.clone(),
                data = model.toJSON(),
                baton = ext.Baton({ data: data, model: model });
            // add cid and full data
            li.attr('data-cid', _.cid(data));
            // filter?
            if (!this.filter(model)) return li.addClass('hidden');
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li, baton);
            return li;
        }
    });

    return ListView;
});
