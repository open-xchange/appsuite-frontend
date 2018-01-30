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

define('io.ox/backbone/views/window', ['io.ox/backbone/views/disposable', 'gettext!io.ox/core'], function (DisposableView, gt) {

    'use strict';

    var easing = [0.1, 0.7, 0.1, 1], // easing function for toolbar animation
        duration = 150; // duration for taskbar show/hide

    var backdrop = $('<div id="floating-window-backdrop">').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        _(collection.filter(function (model) { return !model.get('nonFloating'); })).each(function (model) {
            model.get('window').toggle(false);
        });
        ox.trigger('change:document:title', ox.ui.App.getCurrentApp().get('title'));
        backdrop.hide();
    }).hide();

    var WindowView = DisposableView.extend({

        className: 'floating-window',
        events: {
            'click [data-action="minimize"]': 'onMinimize',
            'click [data-action="close"]': 'close',
            'dblclick .floating-header': 'toggleDisplaystyle'
        },

        constructor: function (options) {
            this.options = options || {};
            this.title = this.options.title;
            // standard windowmanager windowobject. Used by apps
            this.win = this.options.win;
            this.count = this.options.count || 0;
            // dummy windows are windows that start minimized and call a callback function when they are clicked on
            // this is used for restore points to load on demand
            this.dummy = !!this.options.dummyCallback;
            DisposableView.prototype.constructor.apply(this, arguments);
            this.$el.on('click', '[data-action="cornered"]', this.changeDisplayStyle.bind(this, 'cornered'));
            this.$el.on('click', '[data-action="centered"]', this.changeDisplayStyle.bind(this, 'centered'));
            this.$el.on('click', '[data-action="sticky"]', this.changeDisplayStyle.bind(this, 'sticky'));
            this.on('dispose', function () { remove(this); });

            // dummies start minimized
            this.minimized = this.dummy;
            this.opened = false;
            // possible values are: cornered, centered, sticky
            // minimized is saved separately so we know to which style we need to change the window again.
            this.displayStyle = this.options.displayStyle || 'cornered';
            // add dummys before they are opened.
            if (this.dummy) {
                add(this);
                // just trigger show to invoke rendering of the taskbar
                collection.trigger('show');
            }
        },

        render: function () {
            var title_id = _.uniqueId('title');
            this.$el.removeClass('cornered centered sticky')
                .addClass(this.displayStyle)
                .attr({ tabindex: -1, role: 'dialog', 'aria-labelledby': title_id })
                .empty().append(
                    $('<div class="abs floating-window-content" role="document">').append(
                        this.$header = this.$header || $('<div class="floating-header abs">').append(
                            $('<h1>').append(
                                $('<span class="title">').attr('id', title_id).text(this.options.title || '\u00A0'),
                                $('<span class="count label label-danger">').toggle(this.count > 0).text(this.count)
                            ),
                            $('<div class="controls">').append(
                                $('<button type="button" class="btn btn-link" data-action="minimize">').attr('title', gt('Minimize')).append(
                                    $('<i class="fa fa-window-minimize" aria-hidden="true">')
                                ),
                                $('<button type="button" class="btn btn-link" data-action="cornered">').append('<i class="fa fa-compress">'),
                                $('<button type="button" class="btn btn-link" data-action="centered">').append('<i class="fa fa-expand">'),
                                this.options.showStickybutton ? $('<button type="button" class="btn btn-link" data-action="sticky">').append('<i class="fa fa-thumb-tack">') : '',
                                this.options.closable ? $('<button type="button" class="btn btn-link" data-action="close">').append('<i class="fa fa-times">') : ''
                            )
                        ),
                        this.$body = this.$body || $('<div class="floating-body abs">')
                    )
                );
            return this;
        },

        open: function (noRerender) {
            // only open this one time or the window is emptied and rerendered multiple times and also added multiple times to the collection (overwriting itself)
            if (this.opened) return;
            this.opened = true;
            // sometimes it's important that there is no rerender, because of losing event listeners or triggering on remove listeners
            if (!this.$header || !noRerender) this.render();
            $('#io-ox-screens').append(this.$el);
            add(this);
            if (backdrop.parents().length === 0) {
                $('#io-ox-screens').append(backdrop);
            }
            this.makeActive();
            return this;
        },

        close: function (e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (this.win && !this.closing) {
                if (this.win.app) {
                    this.win.app.quit();
                    return this;
                }
                this.closing = true;
                this.win.close();
                return this;
            }

            if (this.disposed) return this;
            this.$el.remove();
            return this;
        },

        changeDisplayStyle: function (style, e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (!style) return;
            this.displayStyle = style;
            // sticky windows push the rest of appsuite to the left. So an indicator class is needed
            $('#io-ox-windowmanager').toggleClass('has-sticky-window', style === 'sticky');
            this.$el.removeClass('cornered centered sticky').addClass(this.displayStyle);
            // calculate animation origin (so window minimizes to the correct position)
            var node = $('#io-ox-taskbar').find('[data-cid="' + this.cid + '"]');
            if (node && node.length > 0) {
                this.$el.css('transform-origin', node.offset().left + node.width() / 2 - this.$el.offset().left + 'px 100%');
            }
            // trigger resize so the new height is correctly calculated
            _.delay(function () {
                $(window).trigger('resize');
            }, 500);
        },

        toggleDisplaystyle: function (e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (this.minimized || this.displayStyle === 'sticky') return;
            this.changeDisplayStyle(this.displayStyle === 'cornered' ? 'centered' : 'cornered');
        },

        makeActive: function (powermove) {
            if (this.dummy) {
                this.dummy = false;
                this.options.dummyCallback();
                return;
            }
            ox.trigger('change:document:title', this.win.app.get('title'));
            var self = this;
            // don't use powermove if there are only minimized windows
            if (powermove && collection.openWindows.length > 0 && this.minimized === true && (!powerMoveWindow || powerMoveWindow.cid !== this.cid)) {
                if (powerMoveWindow) {
                    powerMoveWindow.toggle(false);
                }
                powerMoveWindow = this;
                $('#io-ox-screens').addClass('powermove-window-open');
                this.$el.addClass('powermove');
                this.toggle(true);
                // trigger resize so the new height is correctly calculated
                $(window).trigger('resize');
            } else {
                collection.each(function (model) {
                    // ignore non floating windows, windowmanager handles them
                    if (model.get('nonFloating')) return;

                    model.get('window').toggle(model.get('window').cid === self.cid || (powerMoveWindow && model.get('window').cid === powerMoveWindow.cid));
                });
            }
            // trigger , so the taskbar redraws
            collection.trigger('show', this);
        },

        setTitle: function (title) {
            this.title = title;
            this.$header.find('h1 .title').text(title || '\u00A0');
            return this;
        },

        onMinimize: function (e) {
            e.preventDefault();
            ox.trigger('change:document:title', ox.ui.App.getCurrentApp().get('title'));
            this.toggle(false);
            if (powerMoveWindow) {
                $('#io-ox-screens').removeClass('powermove-window-open');
                powerMoveWindow.$el.removeClass('powermove');
                powerMoveWindow = null;
                // trigger resize so the new height is correctly calculated
                $(window).trigger('resize');
            }
        },

        toggle: function (state) {
            //create true boolean
            state = !!state;
            // already in the correct state. nothing to do
            if (state !== this.minimized) return;

            this.$el.stop().toggleClass('minimized', !state);
            this.minimized = !state;
            if (state) {
                this.$el.show();
                collection.trigger('show', this);
            } else {
                if (powerMoveWindow && powerMoveWindow.cid === this.cid) {
                    $('#io-ox-screens').removeClass('powermove-window-open');
                    powerMoveWindow.$el.removeClass('powermove');
                    powerMoveWindow = null;
                    // trigger resize so the new height is correctly calculated
                    $(window).trigger('resize');
                }
                // little delay to wait for animation
                this.$el.delay(500).queue(function () {
                    $(this).hide();
                });
                collection.trigger('hide', this);
            }
        },

        setCount: function (count) {
            this.count = count;
            this.$('.floating-header .count').toggle(count > 0).text(count);
            collection.trigger('change:count', this, count);
        }
    });

    var collection = WindowView.collection = new Backbone.Collection(),
        handlerAttached = false,
        powerMoveWindow;
    collection.openWindows = [];

    function add(window) {
        var model = new Backbone.Model({ id: window.cid, window: window });
        collection.add(model);
        // attach on add to make sure ox.ui.apps exists (in case this file is loaded early there might be race conditions otherwise)
        attachHandler();
    }

    function attachHandler() {
        if (!handlerAttached) {
            handlerAttached = true;
            // minimize on appchange
            ox.ui.apps.on('launch resume', function (model) {
                if (model && !model.get('floating')) {
                    collection.each(function (m) {
                        if (m.get('nonFloating')) {
                            // if the lauched/resumed app is in the taskbar, make it active, set all others to inactive
                            $('#io-ox-taskbar').find('[data-cid="' + m.cid + '"]').parent().toggleClass('active', m.cid === model.cid);
                            return;
                        }
                        m.get('window').toggle(false);
                    });
                }
            });
        }
    }

    function remove(win) {
        if (powerMoveWindow && (powerMoveWindow.cid === win.cid || !win.minimized)) {
            powerMoveWindow.$el.removeClass('powermove');
            powerMoveWindow = null;
        }
        collection.remove(win.cid);
    }

    // use debounce here, to reduce redraws (may happen if multiple edit dialogs are restored)
    collection.on('remove show hide', _.debounce(function () {

        var hasStickyWindows = false;
        collection.openWindows = [];

        // get number of minimized windows
        $('#io-ox-taskbar').empty().append(
            this.map(function (model) {
                var floatingWindow = model.get('window'),
                    open = !model.get('nonFloating') && !floatingWindow.minimized,
                    title = floatingWindow.title || model.get('title');

                if (!hasStickyWindows && !floatingWindow.minimized) {
                    hasStickyWindows = floatingWindow.displayStyle === 'sticky';
                }
                if (open) collection.openWindows.push(floatingWindow);

                return $('<li>').addClass(open || (floatingWindow.state && floatingWindow.state.visible) ? 'active' : '').append(
                    $('<button class="taskbar-button" type="button">').toggleClass('io-ox-busy', !!(model.get('nonFloating') && (!title || title.trim().length === 0) && !model.titleChanged))
                        .attr('data-cid', floatingWindow.cid || model.cid)
                        .append(
                            $('<span class="title">').text(title),
                            $('<span class="count label label-danger">').toggle(floatingWindow.count > 0).text(floatingWindow.count)
                        )
                        .on('click', function (e) {
                            if (model.get('nonFloating')) {
                                model.launch();
                                return;
                            }
                            floatingWindow.makeActive(e.altKey && window.innerWidth >= 1192);
                        }),
                    floatingWindow.options.closable || model.get('closable') ? $('<button type="button" class="btn btn-link pull-right" data-action="close">').append('<i class="fa fa-times">')
                    .on('click', function (e) {
                        try {
                            if (model.get('nonFloating')) {
                                model.quit();
                                return;
                            }
                        } catch (ex) {
                            // model might have been removed (56913)
                        }
                        floatingWindow.close(e);
                    }) : ''
                );
            })
            // use reverse to keep the source order correct (keep position of existing windows and add new windows on the left)
            .reverse()
        );
        $('#io-ox-windowmanager').toggleClass('has-sticky-window', hasStickyWindows);

        if (collection.size() > collection.openWindows.length) {
            $('#io-ox-screens').velocity({ bottom: '40px' }, duration, easing);
            $('#io-ox-taskbar-container').velocity({ height: '40px' }, duration, easing);
        } else {
            $('#io-ox-screens').velocity({ 'bottom': '0px' }, duration, easing);
            $('#io-ox-taskbar-container').velocity({ 'height': '0px' }, duration, easing);
        }
        // calculate animation origin (so window minimizes to the correct position)
        _(collection.openWindows).each(function (floatwin) {
            var node = $('#io-ox-taskbar').find('[data-cid="' + floatwin.cid + '"]');
            floatwin.$el.css('transform-origin', node.offset().left + node.width() / 2 - floatwin.$el.offset().left + 'px 100%');
        });

        backdrop.toggle(collection.openWindows.length > 0);
        // updateScrollControllState();
    }, 20));

    collection.on('change:count', function (window, count) {
        $('#io-ox-taskbar').find('[data-cid="' + window.cid + '"] .count').toggle(count > 0).text(count);
    });

    // used to add apps that do not use floating windows to the taskbar => office, planningview etc
    var addNonFloatingApp = function (model) {
        if (!model) return;
        model.set('nonFloating', true);
        model.on('quit', function () { remove(model); });
        model.on('change:title', function () {
            var node = $('#io-ox-taskbar').find('[data-cid="' + model.cid + '"]');
            if (node) {
                node.removeClass('io-ox-busy').find('.title').text(model.getTitle());
                model.titleChanged = true;
            }
        });
        collection.add(model).trigger('show', this);
        // attach on add to make sure ox.ui.apps exists (in case this file is loaded early there might be race conditions otherwise)
        attachHandler();
    };

    return {
        WindowView: WindowView,
        windowCollection: collection,
        addNonFloatingApp: addNonFloatingApp
    };

});
