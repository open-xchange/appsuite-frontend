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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/list', [
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views/contextmenu-utils',
    'io.ox/core/tk/list-selection',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/extensions'
], function (DisposableView, ContextMenuUtils, Selection, dnd, ext) {

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
        PTR_MAX_PULLDOWN =  300,    // max distance where the PTR node can be dragged to
        PTR_ROTATE_ANGLE =  360;    // total rotation angle of the spinner while pulled down

    // helper
    function NOOP() { return $.when(); }

    var ListView = DisposableView.extend({

        tagName: 'ul',
        className: 'list-view',

        scaffold: $(
            '<li class="list-item">' +
            '<div class="list-item-checkmark">' + $.checkbox() + '</div>' +
            '<div class="list-item-content"></div><div class="list-item-swipe-conent"></div>' +
            '</li>'
        ),

        busyIndicator: $('<li class="busy-indicator" role="presentation"><i class="fa fa-chevron-down" aria-hidden="true"></i></li>'),

        // disabled by default via 'hidden class'
        notification: $('<li class="abs notification hidden" role="presentation"></li>'),

        pullToRefreshIndicator: $(
            '<div class="pull-to-refresh" style="transform: translate3d(0, -70px,0)">' +
            '<div class="spinner slight-drop-shadow" style="opacity: 1">' +
            '<i id="ptr-spinner" class="fa fa-refresh" aria-hidden="true"></i></div></div>'
        ),

        onItemFocus: function () {
            this.toggleFocus(true);
        },

        onItemBlur: function () {
            if (this.mousedown) return;
            this.toggleFocus(false);
        },

        onKeepFocus: function (e) {
            if (e.target !== this.el) return;
            // ignore fake clicks
            if (!e.pageX) return;
            // restore focus
            this.restoreFocus();
        },

        // note: empty function that is overridden in listview.js
        onContextMenu: function () {
            return;
        },

        restoreFocus: function (greedy) {
            // try to find the correct item to focus
            var items = this.getItems(),
                selectedItems = items.filter('.selected');
            if (selectedItems.length === 0) {
                if (greedy) this.selection.select(0, items);
                return;
            }
            if (selectedItems.length === 1) {
                // only one item, just focus that
                selectedItems.focus();
            } else if (selectedItems.filter(document.activeElement).length === 1) {
                // the activeElement is in the list, focus it
                selectedItems.filter(document.activeElement).focus();
            } else {
                // just use the last selected item to focus
                selectedItems.last().focus();
            }
        },

        onItemKeydown: function (e) {
            if (keyEvents[e.which]) this.trigger(keyEvents[e.which], e);
            ContextMenuUtils.macOSKeyboardHandler(e);
            if (e.isKeyboardEvent) this.onContextMenu(e);
        },

        // use throttle instead of debouce in order to respond during scroll momentum
        onScroll: _.throttle(function () {

            if (this.disposed || this.isBusy || !this.loader.collection || this.collection.complete || !this.$el.is(':visible')) return;

            var height = this.$el.outerHeight(),
                scrollTop = this.el.scrollTop,
                scrollHeight = this.el.scrollHeight,
                bottom = scrollTop + height;

            // two competing concepts:
            // a) the user wants to see the end of the list; some users feel better; more orientation. Less load on server.
            // b) powers users hate to wait; never want to see the end of the list. More load on server.
            // we're know using b) by preloading if the bottom edge exceeds 80%
            if (bottom / scrollHeight < 0.80) return;

            // show indicator & fetch next page
            this.addBusyIndicator();
            this.processPaginate();

        }, 20),

        onLoad: function () {
            this.idle();
            // trigger scroll event after initial load
            // takes care of the edge-case that the initial list cannot fill the viewport (see bug 37728)
            if (!this.isComplete()) this.onScroll();
        },

        onComplete: function (complete) {
            this.toggleComplete(complete !== false); // default: true
        },

        // load more data (wraps paginate call)
        processPaginate: function () {
            if (!this.options.pagination || this.isBusy || this.isComplete()) return;
            this.paginate();
        },

        // support for custom keys, e.g. needed to identify threads or folders
        getCompositeKey: function (model) {
            return model.isFolder && model.isFolder() ? 'folder.' + model.get('id') : model.cid;
        },

        // called when the view model changes (not collection models)
        onModelChange: function () {
            if (this.disposed) return;
            this.load();
        },

        empty: function () {
            this.idle();
            this.toggleComplete(false);
            this.getItems().remove();
            delete this.currentLabel;
            this.$('.list-item-label').remove();
            if (this.selection) this.selection.reset();
            this.$el.scrollTop(0);
        },

        renderNotification: function (type, error) {
            var baton = ext.Baton({ app: this.app, options: this.options, listView: this, error: error }),
                point = ext.point(this.ref + '/notification/' + type),
                isEmpty = !this.collection.length,
                $notification = this.$('.notification').attr('role', type === 'error' ? 'alert' : 'presentation').empty();
            if (isEmpty && point.keys().length) {
                point.invoke('draw', $notification, baton);
            }
            $notification.toggleClass('hidden', !isEmpty);
        },

        renderEmpty: function () {
            this.renderNotification('empty');
        },

        renderError: function (error) {
            this.idle();
            this.renderNotification('error', error);
        },

        onReset: function () {
            var self = this;
            this.empty();
            this.collection.each(function (model) {
                self.$el.append(self.renderListItem(model, true));
            });
            this.trigger('reset', this.collection, this.firstReset);
            if (this.firstReset) {
                this.trigger('first-reset', this.collection);
                this.firstReset = false;
            }
            if (this.firstContent && this.collection.length) {
                this.trigger('first-content', this.collection);
                this.firstContent = false;
            }
            this.trigger('listview:reset');
        },

        // bundle draws
        onAdd: function (model) {
            this.queue.add(model).render();
        },

        lastElementOfLabel: function (li) {
            var prev = li.prev(), next = li.next(), label = li.attr('data-label');
            if (prev.attr('data-label') === label) return false;
            if (next.attr('data-label') === label) return false;
            return true;
        },

        onRemove: function (model) {
            var children = this.getItems(),
                cid = this.getCompositeKey(model),
                li = children.filter('[data-cid="' + $.escape(cid) + '"]'),
                isSelected = li.hasClass('selected');

            if (li.length === 0) return;

            // keep scroll position if element is above viewport
            if (li[0].offsetTop < this.el.scrollTop) {
                this.el.scrollTop -= li.outerHeight(true);
            }

            if (this.selection) this.selection.remove(cid, li);

            // remove label if this is the last element of that label
            if (this.options.labels && this.lastElementOfLabel(li)) li.prev().remove();

            li.remove();

            this.trigger('remove-mobile');
            // selection changes if removed item was selected
            if (isSelected) this.selection.triggerChange();

            // simulate scroll event because the list might need to paginate.
            // Unless it's the last one! If we did scroll for the last one, we would
            // trigger a paginate call that probably overtakes the delete request
            if (children.length > 1) {
                // see bug #46319 : handle 'select all' -> 'move'
                _.defer(function () {
                    if (this.disposed) return;
                    this.$el.trigger('scroll');
                }.bind(this));
            }

            // forward event
            this.trigger('remove', model);
        },

        onBatchRemove: function (list) {

            // build hash of all composite keys
            var hash = {};
            _(list).each(function (obj) {
                if (_.isObject(obj)) {
                    var cid = obj.cid || _.cid(obj);
                    hash[cid] = true;
                } else hash[obj] = true;

            });

            // get all DOM nodes
            var items = this.getItems();
            if (items.length === 0) return;

            // get first selected item and its offset
            var selected = items.filter('.selected')[0];

            // get affected DOM nodes and remove them
            items
                .filter(function () {
                    var cid = $(this).attr('data-cid');
                    return !!hash[cid];
                })
                .remove();

            // manage the empty message
            this.renderEmpty();

            if (!selected) return;

            // make sure the first selected item is visible (if out of viewport)
            var top = $(selected).position().top,
                outOfViewport = top < 0 || top > this.el.offsetHeight;
            if (outOfViewport) selected.scrollIntoView();
        },

        onSort: (function () {

            function getIndex(node) {
                // don't use data() here
                return node && parseInt(node.getAttribute('data-index'), 10);
            }

            return function () {
                // needless cause added models not drawn yet (debounced renderListItems)
                if (this.queue.list.length) return;

                var dom, sorted, i, j, length, node, reference, index, done = {}, nodeLabel;

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
                    if (this.options.labels) {
                        nodeLabel = this.getLabel(this.collection.get($(node).attr('data-cid')));
                        $(node).attr('data-label', nodeLabel);
                    }
                    // same element?
                    if (node === reference) {
                        // fast forward "j" if pointing at processed items
                        do { index = getIndex(dom[++j]); } while (done[index]);
                    } else if (reference) {
                        // change position in dom
                        this.el.insertBefore(node, reference);
                    }
                }

                if (this.options.labels) {
                    _.defer(function () {
                        var currentLabel,
                            previousLabel,
                            self = this,
                            items = this.$el.find('.list-item').toArray();

                        items.forEach(function (item) {
                            if ($(item).hasClass('list-item-label')) {
                                currentLabel = $(item).text();
                                // label without appointment || label needs to be updated || label already exists
                                if (!$(item).next().hasClass('appointment') || $(item).next().attr('data-label') !== currentLabel || previousLabel === currentLabel) {
                                    $(item).remove();
                                } else {
                                    previousLabel = currentLabel;
                                }
                            } else {
                                var itemLabel = $(item).attr('data-label');
                                if (itemLabel !== previousLabel) {
                                    currentLabel = itemLabel;
                                    previousLabel = currentLabel;
                                    self.el.insertBefore(self.renderListLabel(itemLabel)[0], item);
                                }
                            }
                        });
                    }.bind(this));
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

            if (this.isPulling && distance <= PTR_MAX_PULLDOWN) {
                this.pullToRefreshTriggerd = false;
                e.preventDefault();
                e.stopPropagation();

                var rotationAngle = (PTR_ROTATE_ANGLE / PTR_MAX_PULLDOWN) * distance,
                    top = -70 + ((70 / PTR_TRIGGER) * distance);

                this.pullToRefreshIndicator
                    .css('-webkit-transform', 'translate3d(0,' + top + 'px,0)');

                $('#ptr-spinner').css('-webkit-transform', 'rotateZ(' + rotationAngle + 'deg)');

                this.selection.isScrolling = true;

                if ((currentY - this.pullToRefreshStartY) >= PTR_TRIGGER) {
                    this.pullToRefreshTriggerd = true;
                }
            } else if (this.isPulling && distance >= PTR_MAX_PULLDOWN) {
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
                this.options.app.trigger('pull-to-refresh', this);

                e.preventDefault();
                e.stopPropagation();


            } else if (this.isPulling) {
                // threshold was not reached, just remove the ptr indicator
                this.removePullToRefreshIndicator(true);
                e.preventDefault();
                e.stopPropagation();
            }
            // reset everything
            this.selection.isScrolling = false;
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
                    if (self.disposed) return;
                    self.pullToRefreshIndicator.removeAttr('style').remove();
                }, 100);

            } else {
                // fancy remove with scale-out animation
                setTimeout(function () {
                    if (self.disposed) return;
                    self.pullToRefreshIndicator.addClass('scale-down');
                    setTimeout(function () {
                        if (self.disposed) return;
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
                index = model.changed.index,
                changedKeys = _.keys(model.changed);

            // change position?
            if (index !== undefined) li.attr('data-index', index);
            // draw via extensions but not if only the index has changed
            if (index === undefined || changedKeys.length > 1) ext.point(this.ref + '/item').invoke('draw', li.children().eq(1).empty(), baton);
            // forward event
            this.trigger('change', model);
        },

        onChangeCID: function (model) {
            var oldModel = model.clone();

            oldModel.set(model.previousAttributes());

            this.$el.find('li[data-cid="' + $.escape(this.getCompositeKey(oldModel)) + '"]').attr('data-cid', this.getCompositeKey(model));
        },

        initialize: function (options) {

            // options
            // ref: id of the extension point that is used to render list items
            // app: application
            // pagination: use pagination (default is true)
            // draggable: add drag'n'drop support
            // swipe: enables swipe handling (swipe to delete etc)
            this.options = _.extend({
                pagination: true,
                draggable: false,
                selection: true,
                scrollable: true,
                swipe: false,
                labels: false
            }, options);

            this.toggleFocus = _.debounce(function (state) {
                if (this.disposed) return;
                this.$el.attr('tabindex', state ? -1 : 0);
                this.$el.toggleClass('has-focus', state);
            }, 10);

            var events = {}, dndEnabled = false, self = this;

            // selection?
            if (this.options.selection) {
                this.selection = new Selection(this, this.options.selection);
                events = {
                    'focus .list-item': 'onItemFocus',
                    'blur .list-item': 'onItemBlur',
                    'click': 'onKeepFocus',
                    'contextmenu': 'onContextMenu',
                    'keydown .list-item': 'onItemKeydown'
                };

                if (_.device('smartphone')) {
                    _.extend(events, {
                        'touchstart': 'onTouchStart',
                        'touchend': 'onTouchEnd',
                        'touchmove': 'onTouchMove'
                    });
                }

                // set special class if not on smartphones (different behavior)
                if (_.device('!smartphone')) this.$el.addClass('visible-selection');
                // enable drag & drop
                dnd.enable({ draggable: true, container: this.$el, selection: this.selection });
                dndEnabled = true;
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

            // enable drag & drop; avoid enabling dnd twice
            if (this.options.draggable && !dndEnabled) {
                dnd.enable({ draggable: true, container: this.$el, selection: this.selection });
            }

            if (this.options.labels) {
                this.filter = function () { return !$(this).hasClass('list-item-label'); };
            }

            this.ref = this.ref || options.ref;
            this.app = options.app;
            this.model = new Backbone.Model();
            this.isBusy = false;
            this.firstReset = true;
            this.firstContent = true;

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
                var timer,
                    scrollPos = 0;
                if (this.selection) {
                    this.selection.isScrolling = false;
                    this.$el.scroll(function () {
                        if (self.$el.scrollTop() !== scrollPos) {
                            self.selection.isScrolling = true;
                            scrollPos = self.$el.scrollTop();
                        }
                        if (timer) clearTimeout(timer);
                        timer = setTimeout(function () {
                            if (self.disposed) return;
                            self.selection.isScrolling = false;
                        }, 500);
                    });
                }
            }

            this.queue = {

                list: [],

                add: function (item) {
                    this.list.push(item);
                    return this;
                },

                render: _.debounce(function () {
                    if (this.disposed) return;
                    this.renderListItems();
                }.bind(this), 10),

                iterate: function (fn) {
                    try {
                        this.list.forEach(fn.bind(self));
                    } catch (e) {
                        if (ox.debug) console.error('ListView.iterate', e);
                    } finally {
                        // use try/finally to ensure the queue get cleared
                        this.list = [];
                    }
                }
            };
        },

        forwardCollectionEvents: function (name) {
            var args = _(arguments).toArray().slice(1);
            args.unshift('collection:' + name);
            this.trigger.apply(this, args);
        },

        setCollection: function (collection) {
            if (!collection) return;
            // remove listeners; make sure this.collection is an object otherwise we remove all listeners
            if (this.collection) this.stopListening(this.collection);
            this.collection = collection;
            this.toggleComplete(this.collection.complete);
            this.toggleExpired(false);
            this.listenTo(collection, {
                // forward events
                'all': this.forwardCollectionEvents,
                // backbone
                'add': this.onAdd,
                'change': this.onChange,
                'change:cid': this.onChangeCID,
                'remove': this.onRemove,
                'reset': this.onReset,
                'sort': this.onSort,
                // load
                'before:load': this.busy,
                'load': this.onLoad,
                'load:fail': this.renderError,
                // paginate
                'before:paginate': this.busy,
                'paginate': this.idle,
                'paginate:fail': this.idle,
                'complete': this.onComplete,
                // reload
                'reload': this.idle,
                'expire': this.onExpire
            });
            this.listenTo(collection, {
                // backbone
                'add': this.renderEmpty,
                'remove': this.renderEmpty,
                'reset': this.renderEmpty
            });
            if (this.selection) this.selection.reset();
            this.trigger('collection:set');
            return this;
        },

        // respond to expire event (usually triggered by the GC)
        onExpire: function () {
            // revert flag since this is an active collection (see bug 54111)
            this.toggleExpired(false);
        },

        toggleExpired: function (flag) {
            this.collection.expired = flag;
        },

        // if true current collection is regarded complete
        // no more items are fetches
        toggleComplete: function (state) {
            if (!this.options.pagination) state = true;
            this.$el.toggleClass('complete', state);
        },

        isComplete: function () {
            return this.collection && this.collection.complete;
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
            // register listener as soon as the first loader is connected
            if (this.options.pagination && !this.loader) {
                // respond to window resize (see bug 37728)
                // make onScroll unique function first (all instance share same function otherwise)
                this.onScroll = this.onScroll.bind(this);
                this.listenToDOM(window, 'resize', this.onScroll);
            }
            this.loader = loader;

            this.load = function (options) {
                // load data
                this.empty();
                loader.load(_.extend(this.model.toJSON(), options));
                this.setCollection(loader.collection);
            };

            this.paginate = function (options) {
                loader.paginate(_.extend(this.model.toJSON(), options));
            };

            this.reload = function (options) {
                loader.reload(_.extend(this.model.toJSON(), options));
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
                    'tabindex': 0
                });
            }
            this.$el.attr('data-ref', this.ref);
            this.addNotification();
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

        getPreviousLabel: function (li) {
            var elem = li;
            while (elem.length > 0 && !elem.hasClass('list-item-label')) elem = elem.prev();
            return elem.text();
        },

        renderListLabel: function (label) {
            return $('<li class="list-item list-item-label" role="presentation">').text(label);
        },

        renderListItem: function (model, drawlabels) {
            var li = this.createListItem(),
                baton = this.getBaton(model),
                node = li.children().eq(1);
            // prepend label if necessary
            if (drawlabels && this.options.labels) {
                var label = this.getLabel(model);
                if (this.currentLabel !== label) {
                    this.$el.append(this.renderListLabel(label));
                    this.currentLabel = label;
                }
            }

            // use button markup if needed (used for a11y if listitems are clickable and open popups etc)
            if (this.options.useButtonMarkup) {
                li.children().wrapAll('<button type="button" class="btn-unstyled">');
            }
            // add cid and full data
            li.attr({ 'data-cid': this.getCompositeKey(model), 'data-index': model.get('index') });
            if (this.options.labels) li.attr('data-label', this.getLabel(model));
            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', node, baton);
            return li;
        },

        renderListItems: function () {

            this.idle();

            // do this line once (expensive)
            var children = this.getItems();

            this.queue.iterate(function (model) {

                var index = model.has('index') ? model.get('index') : this.collection.indexOf(model),
                    li = this.renderListItem(model, false), modelLabel, listLabel;

                // insert or append
                if (index < children.length) {
                    var childAfter = children.eq(index);
                    if (this.options.labels) {
                        modelLabel = this.getLabel(model);
                        listLabel = this.getPreviousLabel(childAfter);
                        if (modelLabel !== listLabel) childAfter = childAfter.prev();
                    }
                    // we need to add the new item to the list of items or we get wrong indices
                    children.splice(index, 0, li);
                    childAfter.before(li);
                    // scroll position might have changed due to insertion
                    if (li[0].offsetTop <= this.el.scrollTop) {
                        this.el.scrollTop += li.outerHeight(true);
                    }
                } else {
                    this.$el.append(li);
                    // we need to add the new item to the list of items or we get wrong indices
                    children.push(li);
                }

                if (this.options.labels) {
                    listLabel = this.getPreviousLabel(li);
                    modelLabel = this.getLabel(model);
                    if (modelLabel !== listLabel) li.before(this.renderListLabel(modelLabel));
                }

                // forward event
                this.trigger('add', model, index);
                // use raw cid here for non-listview listeners (see custom getCompositeKey)
                this.trigger('add:' + model.cid, model, index);

            });

            // needs to be called manually cause drawing is debounced
            this.onSort();
        },

        getBaton: function (model) {
            var data = this.map(model);
            return ext.Baton({ data: data, model: model, app: this.app, options: this.options });
        },

        getBusyIndicator: function () {
            return this.$el.find('.busy-indicator');
        },

        addNotification: function () {
            this.notification.clone().appendTo(this.$el);
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
            this.$('.notification').css('display', 'none');
            this.addBusyIndicator().busy({ immediate: true }).find('i').remove();
            this.isBusy = true;
            return this;
        },

        idle: function (e) {
            // if idle is called as an error callback we should display it (load:fail for example)
            if (e && e.error) {
                require(['io.ox/core/yell'], function (yell) {
                    yell(e);
                });
            }
            if (!this.isBusy) return;
            this.removeBusyIndicator();
            this.isBusy = false;
            this.$('.notification').css('display', '');
            return this;
        },

        getPosition: function () {
            return this.selection.getPosition();
        },

        hasNext: function () {
            if (!this.collection) return false;
            var index = this.getPosition() + 1;
            return index < this.collection.length || !this.isComplete();
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
