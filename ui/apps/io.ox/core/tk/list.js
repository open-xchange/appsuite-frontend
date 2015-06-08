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

define('io.ox/core/tk/list', [
    'io.ox/backbone/disposable',
    'io.ox/core/tk/list-selection',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/extensions'
], function (DisposableView, Selection, dnd, ext) {

    'use strict';

    var keyEvents = {
        13: 'enter',
        27: 'escape',
        32: 'space',
        37: 'cursor:left',
        38: 'cursor:up',
        39: 'cursor:right',
        40: 'cursor:down'
    },
    // PULL TO REFRESH constants
    PTR_START =           5,    // Threshold when pull-to-refresh starts
    PTR_TRIGGER =       150,    // threshold when refresh is done
    PTR_MAX_PULLDOWM =  300,    // max distance where the PTR node can be dragged to
    PTR_ROTATE_ANGLE =  360;    // total rotation angle of the spinner while pulled down

    // helper
    function NOOP() { return $.when(); }

    var ListView = DisposableView.extend({

        tagName: 'ul',
        className: 'list-view',

        scaffold: $(
            '<li class="list-item">' +
            '<div class="list-item-checkmark"><i class="fa fa-checkmark" aria-hidden="true"/></div>' +
            '<div class="list-item-content"></div><div class="list-item-swipe-conent"></div>' +
            '</li>'
        ),

        busyIndicator: $('<li class="busy-indicator"><i class="fa fa-chevron-down"/></li>'),

        pullToRefreshIndicator: $(
            '<div class="pull-to-refresh" style="transform: translate3d(0, -70px,0)">' +
            '<div class="spinner slight-drop-shadow" style="opacity: 1">' +
            '<i id="ptr-spinner" class="fa fa-refresh"/></div></div>'
        ),

        onItemFocus: function () {
            this.$el.removeAttr('tabindex');
            this.$el.addClass('has-focus');
        },

        onItemBlur: function () {
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

            if (this.isBusy || this.complete || !this.$el.is(':visible')) return;

            var height = this.$el.outerHeight(),
                scrollTop = this.el.scrollTop,
                scrollHeight = this.el.scrollHeight,
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

        onLoad: function () {
            this.idle();
            // trigger scroll event after initial load
            // takes care of the edge-case that the initial list cannot fill the viewport (see bug 37728)
            if (!this.complete) this.onScroll();
        },

        onComplete: function () {
            this.toggleComplete(true);
        },

        // load more data (wraps paginate call)
        processPaginate: function () {
            if (!this.options.pagination || this.isBusy || this.complete) return;
            this.paginate();
        },

        // support for custom keys, e.g. needed to identify threads or folders
        getCompositeKey: function (model) {
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
            if (this.selection) this.selection.reset();
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

            // forward event
            this.trigger('add', model, index);
        },

        onRemove: function (model) {

            var children = this.getItems(),
                cid = this.getCompositeKey(model),
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

            if (this.selection) this.selection.remove(cid, li);
            li.remove();

            this.trigger('remove-mobile');
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
                        do { index = getIndex(dom[++j]); } while (done[index]);
                    } else if (reference) {
                        // change position in dom
                        this.el.insertBefore(node, reference);
                    }
                }
            };
        }()),

        onTouchStart: function (e) {
            if (this.options.noPullToRefresh) return;
            var atTop = this.$el.scrollTop() === 0,
                touches = e.originalEvent.touches[0],
                currentY = touches.pageY,
                currentX = touches.pageX;
            if (atTop) {
                this.pullToRefreshStartY = currentY;
                this.pullToRefreshStartX = currentX;
            }
        },

        onTouchMove: function (e) {

            var touches = e.originalEvent.touches[0],
                currentY = touches.pageY,
                distance = currentY - this.pullToRefreshStartY;

            if (this.pullToRefreshStartY && !this.isPulling && !this.isSwiping) {
                if ((currentY - this.pullToRefreshStartY) >= PTR_START) {
                    e.preventDefault();
                    e.stopPropagation();
                    // mark the list as scrolling, this will prevent selection from
                    // performing cell swipes but only if we are not performing a cell swipe
                    this.selection.isScrolling = true;
                    this.isPulling = true;
                    this.$el.prepend(
                        this.pullToRefreshIndicator
                    );
                }
            }

            if (this.isPulling && distance <= PTR_MAX_PULLDOWM /*&& !this.pullToRefreshTriggerd*/) {
                e.preventDefault();
                e.stopPropagation();

                var rotationAngle = (PTR_ROTATE_ANGLE / PTR_MAX_PULLDOWM) * distance,
                    top = -70 + ((70 / PTR_TRIGGER) * distance);

                this.pullToRefreshIndicator
                    .css('-webkit-transform', 'translate3d(0,' + top +  'px,0)');

                $('#ptr-spinner').css('-webkit-transform', 'rotateZ(' + rotationAngle + 'deg)');

                this.selection.isScrolling = true;

                if ((currentY - this.pullToRefreshStartY) >= PTR_TRIGGER) {
                    this.pullToRefreshTriggerd = true;
                }
            } else if (this.isPulling && distance >= PTR_MAX_PULLDOWM) {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        onTouchEnd: function (e) {
            if (this.pullToRefreshTriggerd) {
                // bring the indicator in position
                this.pullToRefreshIndicator.css({
                    'transition': 'transform 50ms',
                    '-webkit-transform': 'translate3d(0,0,0)'
                });
                // let it spin
                $('#ptr-spinner').addClass('fa-spin');
                // trigger event to do the refresh elsewhere
                ox.trigger('pull-to-refresh', this);

                e.preventDefault();
                e.stopPropagation();
                // reset
                this.selection.isScrolling = false;

            } else {
                if (this.isPulling) {
                    // threshold was not reached, just remove the ptr indicator
                    this.removePullToRefreshIndicator(true);
                    e.preventDefault();
                    e.stopPropagation();
                    this.selection.isScrolling = true;
                }
            }
            // reset everything
            this.pullToRefreshStartY = null;
            this.isPulling = false;
            this.pullToRefreshTriggerd = false;
            this.pullToRefreshStartY = null;
        },

        removePullToRefreshIndicator: function (simple) {
            var self = this;
            // simple remove for unfinished ptr-drag
            if (simple) {
                self.pullToRefreshIndicator.css({
                    'transition': 'transform 50ms',
                    '-webkit-transform': 'translate3d(0,-70px,0)'
                });
                setTimeout(function () {
                    self.pullToRefreshIndicator.removeAttr('style').remove();
                }, 100);

            } else {
                // fancy remove with scale-out animation
                setTimeout(function () {
                    self.pullToRefreshIndicator.addClass('scale-down');
                    setTimeout(function () {
                        self.pullToRefreshIndicator
                            .removeAttr('style')
                            .removeClass('scale-down');
                        $('#ptr-spinner').removeClass('fa-spin');
                        self.pullToRefreshIndicator.remove();
                    }, 100);
                }, 250);
            }
        },

        // called whenever a model inside the collection changes
        onChange: function (model) {
            var li = this.$el.find('li[data-cid="' + $.escape(this.getCompositeKey(model)) + '"]'),
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
            // swipe: enables swipe handling (swipe to delete etc)
            this.options = _.extend({
                pagination: true,
                draggable: false,
                preserve: false,
                selection: true,
                scrollable: true,
                swipe: false
            }, options);

            var events = {};

            // selection?
            if (this.options.selection) {
                this.selection = new Selection(this);
                events = {
                    'focus .list-item': 'onItemFocus',
                    'blur .list-item': 'onItemBlur',
                    'click': 'onKeepFocus',
                    'keydown .list-item': 'onItemKeydown',
                    'touchstart': 'onTouchStart',
                    'touchend': 'onTouchEnd',
                    'touchmove': 'onTouchMove'
                };
                // set special class if not on smartphones (different behavior)
                if (_.device('!smartphone')) this.$el.addClass('visible-selection');
                // enable drag & drop
                dnd.enable({ draggable: true, container: this.$el, selection: this.selection });
                // a11y
                this.$el.addClass('f6-target');
            } else {
                this.toggleCheckboxes(false);
            }

            // scroll?
            if (this.options.scrollable) {
                this.$el.addClass('scrollpane');
            }

            // pagination?
            if (this.options.pagination) {
                events.scroll = 'onScroll';
            }

            // initial collection?
            if (this.options.collection) {
                this.setCollection(this.collection);
                if (this.collection.length) this.onReset();
            }

            // enable drag & drop
            if (this.options.draggable) dnd.enable({ draggable: true, container: this.$el, selection: this.selection });

            this.ref = this.ref || options.ref;
            this.app = options.app;
            this.model = new Backbone.Model();
            this.isBusy = false;
            this.complete = false;
            this.firstReset = true;

            this.delegateEvents(events);

            // don't know why but listenTo doesn't work here
            this.model.on('change', _.debounce(this.onModelChange, 10), this);

            // make sure busy & idle use proper this (for convenient callbacks)
            _.bindAll(this, 'busy', 'idle');

            // set special class if not on smartphones (different behavior)
            if (_.device('!smartphone')) {
                this.$el.addClass('visible-selection');
            }

            // helper to detect scrolling in action, only used by mobiles
            if (_.device('smartphone')) {
                var self = this,
                    timer;
                this.selection.isScrolling = false;
                this.$el.scroll(function () {
                    self.selection.isScrolling = true;
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(function () {
                        self.selection.isScrolling = false;
                    }, 500);
                });
            }

            // respond to window resize (see bug 37728)
            $(window).on('resize.list-view', this.onScroll.bind(this));

            this.on('dispose', function () {
                $(window).off('resize.list-view');
            });
        },

        forwardCollectionEvents: function (name) {
            var args = _(arguments).toArray().slice(1);
            args.unshift('collection:' + name);
            this.trigger.apply(this, args);
        },

        setCollection: function (collection) {
            // remove listeners; make sure this.collection is an object otherwise we remove all listeners
            if (this.collection) this.stopListening(this.collection);
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
                'load': this.onLoad,
                'load:fail': this.idle,
                // paginate
                'before:paginate': this.busy,
                'paginate': this.idle,
                'paginate:fail': this.idle,
                'complete': this.onComplete,
                // reload
                'reload': this.idle
            });
            if (this.selection) this.selection.reset();
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
            var items = this.$el.find('.list-item');
            if (this.filter) items = items.filter(this.filter);
            return items;
        },

        // optional: filter items
        setFilter: function (selector) {
            this.filter = selector;
            var items = this.$el.find('.list-item');
            items.removeClass('hidden');
            if (this.filter) {
                items.not(this.filter).addClass('hidden');
                // we need to have manual control over odd/even because nth-child doesn't work with hidden elements
                items.filter(this.filter).each(function (index) { $(this).addClass(index % 2 ? 'even' : 'odd'); });
            } else {
                items.removeClass('even odd');
            }
        },

        connect: function (loader) {

            // remove listeners; make sure this.collection is an object otherwise we remove all listeners
            if (this.collection) this.stopListening(this.collection);
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

        map: function (model) {
            return model.toJSON();
        },

        render: function () {
            if (this.options.selection) {
                this.$el.attr({
                    'aria-multiselectable': true,
                    'role': 'listbox',
                    'tabindex': 1
                });
            }
            this.$el.attr('data-ref', this.ref);
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

        createListItem: function () {
            var li = this.scaffold.clone();
            if (this.options.selection) {
                // a11y: use role=option and aria-selected here; no need for "aria-posinset" or "aria-setsize"
                // see http://blog.paciellogroup.com/2010/04/html5-and-the-myth-of-wai-aria-redundance/
                li.addClass('selectable').attr({ 'aria-selected': false, role: 'option', 'tabindex': '-1' });
            }
            return li;
        },

        renderListItem: function (model) {
            var li = this.createListItem(),
                baton = this.getBaton(model);
            // add cid and full data
            li.attr({ 'data-cid': this.getCompositeKey(model), 'data-index': model.get('index') });
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li.children().eq(1), baton);
            return li;
        },

        getBaton: function (model) {
            var data = this.map(model);
            return ext.Baton({ data: data, model: model, app: this.app, options: this.options });
        },

        getBusyIndicator: function () {
            return this.$el.find('.busy-indicator');
        },

        addBusyIndicator: function () {
            var indicator = this.getBusyIndicator();
            // ensure the indicator is the last element in the list
            if (indicator.index() < this.$el.children().length) indicator.appendTo(this.$el);
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
