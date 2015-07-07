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
     'io.ox/core/tk/list-dnd',
     'io.ox/core/extensions'
    ], function (Selection, dnd, ext) {

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

    // helper
    function NOOP() { return $.when(); }

    var ListView = Backbone.View.extend({

        tagName: 'ul',
        className: 'list-view scrollpane f6-target',

        // a11y: use role=option and aria-selected here; no need for "aria-posinset" or "aria-setsize"
        // see http://blog.paciellogroup.com/2010/04/html5-and-the-myth-of-wai-aria-redundance/
        scaffold: $(
            '<li class="list-item selectable" tabindex="-1" role="option" aria-selected="false">' +
            '<div class="list-item-checkmark"><i class="fa fa-checkmark" aria-hidden="true"/></div>' +
            '<div class="list-item-content"></div>' +
            '</li>'
        ),

        busyIndicator: $('<li class="busy-indicator"><i class="fa fa-chevron-down"/></li>'),

        events: {
            'focus .list-item': 'onItemFocus',
            'blur .list-item': 'onItemBlur',
            'click': 'onKeepFocus',
            'keydown .list-item': 'onItemKeydown',
            'scroll': 'onScroll'
        },

        onItemFocus: function () {
            this.$el.removeAttr('tabindex');
            this.$el.addClass('has-focus');
        },

        onItemBlur: function () {
            if (this.mousedown) {
                return;
            }
            this.$el.attr('tabindex', 1);
            this.$el.removeClass('has-focus');
        },

        onKeepFocus: function (e) {
            if (e.target !== this.el) return;
            // ignore fake clicks
            if (!e.pageX) return;
            // restore focus
            this.getItems().filter('.selected').focus();
        },

        onItemKeydown: function (e) {
            if (keyEvents[e.which]) this.trigger(keyEvents[e.which], e);
        },

        onScroll: _.debounce(function () {

            if (!this.options.pagination || this.isBusy || this.complete) return;

            var height = this.$el.height(),
                scrollTop = this.$el.scrollTop(),
                scrollHeight = this.$el.prop('scrollHeight'),
                tail = scrollHeight - (scrollTop + height);

            // do anything?
            if (tail > height) return;
            // show indicator
            this.addBusyIndicator();
            // really refresh?
            if (tail > 1) return;
            // load more
            this.processPaginate();

        }, 50),

        onComplete: function () {
            this.toggleComplete(true);
        },

        // load more data (wraps paginate call)
        processPaginate: function () {
            if (!this.options.pagination || this.isBusy || this.complete) return;
            this.paginate();
        },

        // support for custom cid attributes
        // needed to identify threads
        getCID: function (model) {
            return model.cid;
        },

        // called when the view model changes (not collection models)
        onModelChange: function () {
            this.load();
        },

        empty: function () {
            this.idle();
            this.toggleComplete(false);
            this.$el.empty();
            this.selection.reset();
            this.$el.scrollTop(0);
        },

        onReset: function () {
            this.empty();
            this.$el.append(
                this.collection.map(this.renderListItem, this)
            );
            this.trigger('reset', this.collection, this.firstReset);
            if (this.firstReset) {
                this.trigger('first-reset', this.collection);
                this.firstReset = false;
            }
        },

        onAdd: function (model) {

            this.idle();

            var index = model.has('index') ? model.get('index') : this.collection.indexOf(model),
                children = this.getItems(),
                li = this.renderListItem(model);

            // insert or append
            if (index < children.length) {
                children.eq(index).before(li);
                // scroll position might have changed due to insertion
                if (li[0].offsetTop <= this.el.scrollTop) {
                    this.el.scrollTop += li.outerHeight(true);
                }
            } else {
                this.$el.append(li);
            }

            // add to selection
            this.selection.add(this.getCID(model), li);

            // forward event
            this.trigger('add', model, index);
        },

        onRemove: function (model) {

            var children = this.getItems(),
                cid = this.getCID(model),
                li = children.filter('[data-cid="' + $.escape(cid) + '"]'),
                isSelected = li.hasClass('selected');

            if (li.length === 0) return;

            // preserve item?
            if (isSelected && this.options.preserve) {
                // note: preserved items are no longer part of the collection, i.e.
                // they won't respond to model changes! They are just visible until
                // the selection is changed by the user
                li.addClass('preserved');
                return;
            }

            // keep scroll position if element is above viewport
            if (li[0].offsetTop < this.el.scrollTop) {
                this.el.scrollTop -= li.outerHeight(true);
            }

            this.selection.remove(cid, li);
            li.remove();

            // selection changes if removed item was selected
            if (isSelected) this.selection.triggerChange();

            // simulate scroll event because the list might need to paginate.
            // Unless it's the last one! If we did scroll for the last one, we would
            // trigger a paginate call that probably overtakes the delete request
            if (children.length > 1) this.$el.trigger('scroll');

            // forward event
            this.trigger('remove', model);
        },

        onSort: (function () {

            function getIndex(node) {
                // don't use data() here
                return node && parseInt(node.getAttribute('data-index'), 10);
            }

            return function () {

                var dom, sorted, i, j, length, node, reference, index, done = {};

                // sort all nodes by index
                dom = this.getItems().toArray();
                sorted = _(dom).sortBy(getIndex);

                // apply sorting (step by step to keep focus)
                // the arrays "dom" and "sorted" always have the same length
                for (i = 0, j = 0, length = sorted.length; i < length; i++) {
                    node = sorted[i];
                    reference = dom[j];
                    // mark as processed
                    done[i] = true;
                    // same element?
                    if (node === reference) {
                        // fast forward "j" if pointing at processed items
                        do index = getIndex(dom[++j]); while (done[index]);
                    } else if (reference) {
                        // change position in dom
                        this.el.insertBefore(node, reference);
                    }
                }
            };
        }()),

        // called whenever a model inside the collection changes
        onChange: function (model) {
            var li = this.$el.find('li[data-cid="' + $.escape(this.getCID(model)) + '"]'),
                baton = this.getBaton(model),
                index = model.changed.index;
            // change position?
            if (index !== undefined) li.attr('data-index', index);
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li.children().eq(1).empty(), baton);
            // forward event
            this.trigger('change', model);
        },

        initialize: function (options) {

            // options
            // ref: id of the extension point that is used to render list items
            // app: application
            // pagination: use pagination (default is true)
            // draggable: add drag'n'drop support
            // preserve: don't remove selected items (e.g. for unseen messages)
            this.options = _.extend({ pagination: true, draggable: false, preserve: false }, options);

            this.ref = this.ref || options.ref;
            this.app = options.app;
            this.selection = new Selection(this);
            this.model = new Backbone.Model();
            this.isBusy = false;
            this.complete = false;
            this.firstReset = true;

            // enable drag & drop
            if (this.options.draggable) dnd.enable({ draggable: true, container: this.$el, selection: this.selection });

            // don't know why but listenTo doesn't work here
            this.model.on('change', _.debounce(this.onModelChange, 10), this);

            // make sure busy & idle use proper this (for convenient callbacks)
            _.bindAll(this, 'busy', 'idle');

            // set special class if not on smartphones (different behavior)
            if (_.device('!smartphone')) this.$el.addClass('visible-selection');
        },

        forwardCollectionEvents: function (name) {
            var args = _(arguments).toArray().slice(1);
            args.unshift('collection:' + name);
            this.trigger.apply(this, args);
        },

        setCollection: function (collection) {
            // remove listeners
            this.stopListening(this.collection);
            this.collection = collection;
            this.toggleComplete(false);
            this.listenTo(collection, {
                // forward events
                'all': this.forwardCollectionEvents,
                // backbone
                'add': this.onAdd,
                'change': this.onChange,
                'remove': this.onRemove,
                'reset': this.onReset,
                'sort': this.onSort,
                // load
                'before:load': this.busy,
                'load': this.idle,
                'load:fail': this.idle,
                // paginate
                'before:paginate': this.busy,
                'paginate': this.idle,
                'paginate:fail': this.idle,
                'complete': this.onComplete,
                // reload
                'reload': this.idle
            });
            this.selection.reset();
            this.trigger('collection:set');
            return this;
        },

        // if true current collection is regarded complete
        // no more items are fetches
        toggleComplete: function (state) {
            if (!this.options.pagination) state = true;
            this.$el.toggleClass('complete', state);
            this.complete = !!state;
        },

        // shows/hides checkboxes
        toggleCheckboxes: function (state) {
            this.$el.toggleClass('hide-checkboxes', state === undefined ? undefined : !state);
        },

        // return alls items of this list
        // the filter is important, as we might have a header
        // although we could use children(), we use find() as it's still faster (see http://jsperf.com/jquery-children-vs-find/8)
        getItems: function () {
            return this.$el.find('.list-item');
        },

        connect: function (loader) {
            // remove listeners
            this.stopListening(this.collection);
            this.collection = loader.getDefaultCollection();
            this.loader = loader;

            this.load = function () {
                // load data
                this.empty();
                loader.load(this.model.toJSON());
                this.setCollection(loader.collection);
            };

            this.paginate = function () {
                loader.paginate(this.model.toJSON());
            };

            this.reload = function () {
                loader.reload(this.model.toJSON());
            };
        },

        load: NOOP,
        paginate: NOOP,
        reload: NOOP,

        render: function () {
            this.$el.attr({
                'aria-multiselectable': true,
                'data-ref': this.ref,
                'role': 'listbox',
                'tabindex': 1
            });
            // fix evil CSS transition issue with phantomJS
            if (_.device('phantomjs')) this.$el.addClass('no-transition');
            return this;
        },

        redraw: function () {
            var point = ext.point(this.ref + '/item'),
                collection = this.collection;
            this.getItems().each(function (index, li) {
                if (index >= collection.length) return;
                var model = collection.at(index),
                    baton = this.getBaton(model);
                point.invoke('draw', $(li).children().eq(1).empty(), baton);
            }.bind(this));
        },

        renderListItem: function (model) {
            var li = this.scaffold.clone(),
                baton = this.getBaton(model);
            // add cid and full data
            li.attr({ 'data-cid': this.getCID(model), 'data-index': model.get('index') });
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li.children().eq(1), baton);
            return li;
        },

        map: _.identity,

        getBaton: function (model) {
            var data = this.map(model);
            return ext.Baton({ data: data, model: model, app: this.app, options: this.options });
        },

        getBusyIndicator: function () {
            return this.$el.find('.busy-indicator');
        },

        addBusyIndicator: function () {
            var indicator = this.getBusyIndicator();
            return indicator.length ? indicator : this.busyIndicator.clone().appendTo(this.$el);
        },

        removeBusyIndicator: function () {
            this.getBusyIndicator().remove();
        },

        busy: function () {
            if (this.isBusy) return;
            this.addBusyIndicator().addClass('io-ox-busy').find('i').remove();
            this.isBusy = true;
            return this;
        },

        idle: function () {
            if (!this.isBusy) return;
            this.removeBusyIndicator();
            this.isBusy = false;
            return this;
        },

        getPosition: function () {
            return this.selection.getPosition();
        },

        hasNext: function () {
            if (!this.collection) return false;
            var index = this.getPosition() + 1;
            return index < this.collection.length || !this.complete;
        },

        next: function () {
            if (this.hasNext()) this.selection.next(); else this.processPaginate();
        },

        hasPrevious: function () {
            if (!this.collection) return false;
            var index = this.getPosition() - 1;
            return index >= 0;
        },

        previous: function () {
            if (this.hasPrevious()) this.selection.previous(); else this.$el.scrollTop(0);
        },

        // set proper focus
        focus: function () {
            var items = this.getItems().filter('.selected').focus();
            if (items.length === 0) this.$el.focus();
        }
    });

    return ListView;
});
