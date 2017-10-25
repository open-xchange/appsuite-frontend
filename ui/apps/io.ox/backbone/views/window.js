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

    var WindowView = DisposableView.extend({

        className: 'floating-window',

        constructor: function (options) {
            this.options = options || {};
            this.title = this.options.title;
            // standard windowmanager windowobject. Used by apps
            this.win = this.options.win;
            this.count = this.options.count || 0;
            DisposableView.prototype.constructor.apply(this, arguments);
            this.$el.on('click', '[data-action="minimize"]', this.onMinimize.bind(this));
            this.$el.on('click', '[data-action="close"]', this.close.bind(this));
            this.$el.on('click', '[data-action="cornered"]', this.changeDisplayStyle.bind(this, 'cornered'));
            this.$el.on('click', '[data-action="centered"]', this.changeDisplayStyle.bind(this, 'centered'));
            this.$el.on('click', '[data-action="sticky"]', this.changeDisplayStyle.bind(this, 'sticky'));
            this.on('dispose', function () { remove(this); });
            this.minimized = false;
            this.opened = false;
            // possible values are: cornered, centered, sticky
            // minimized is saved separately so we know to which style we need to change the window again.
            this.displayStyle = this.options.displayStyle || 'cornered';
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
                                $('<a href="#" data-action="minimize">').attr('title', gt('Minimize')).append(
                                    $('<i class="fa fa-window-minimize" aria-hidden="true">')
                                ),
                                $('<a href="#" data-action="cornered">').append('<i class="fa fa-compress">'),
                                $('<a href="#" data-action="centered">').append('<i class="fa fa-arrows-alt">'),
                                this.options.showStickybutton ? $('<a href="#" data-action="sticky">').append('<i class="fa fa-thumb-tack">') : '',
                                this.options.closable ? $('<a href="#" data-action="close">').append('<i class="fa fa-times">') : ''
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
            this.makeActive();
            return this;
        },

        close: function (e) {
            if (e) {
                e.stopPropagation();
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

        changeDisplayStyle: function (style) {
            if (!style) return;
            this.displayStyle = style;
            // sticky windows push the rest of appsuite to the left. So an indicator class is needed
            $('#io-ox-windowmanager').toggleClass('has-sticky-window', style === 'sticky');
            this.$el.removeClass('cornered centered sticky').addClass(this.displayStyle);
        },

        makeActive: function () {
            var self = this;

            collection.each(function (model) {
                model.get('window').toggle(model.get('window').cid === self.cid);
            });

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
            this.toggle(false);
        },

        toggle: function (state) {
            // already in the correct state. nothing to do
            if (state !== this.minimized) return;

            if (state) this.$el.show();
            this.$el.stop().toggleClass('minimized', !state);
            this.minimized = !state;
            if (state) {
                this.$el.show();
                collection.trigger('show', this);
            } else {
                // little delay to wait for animation
                this.$el.delay(300).queue(function () {
                    $(this).hide();
                    collection.trigger('hide', this);
                });
            }
        },

        setCount: function (count) {
            this.count = count;
            this.$('.floating-header .count').toggle(count > 0).text(count);
            collection.trigger('change:count', this, count);
        }
    });

    var collection = WindowView.collection = new Backbone.Collection();

    function add(window) {
        var model = new Backbone.Model({ id: window.cid, window: window });
        collection.add(model);
    }

    function remove(window) {
        collection.remove(window.cid);
    }

    // use debounce here, to reduce redraws (may happen if multiple edit dialogs are restored)
    collection.on('remove show hide', _.debounce(function () {

        var hasStickyWindows = false;

        // get number of minimized windows
        $('#io-ox-taskbar').empty().append(
            this.map(function (model) {
                var floatingWindow = model.get('window');
                if (!hasStickyWindows && !floatingWindow.minimized) {
                    hasStickyWindows = floatingWindow.displayStyle === 'sticky';
                }
                if (!floatingWindow.minimized) return $();
                return $('<li>').append(
                    $('<button class="taskbar-button" type="button">')
                        .attr('data-cid', floatingWindow.cid)
                        .append(
                            $('<span class="title">').text(floatingWindow.title),
                            $('<span class="count label label-danger">').toggle(floatingWindow.count > 0).text(floatingWindow.count)
                        ),
                    floatingWindow.options.closable ? $('<a role="button" href="#" class="pull-right" data-action="close">').append('<i class="fa fa-times">').on('click', floatingWindow.close.bind(floatingWindow)) : ''
                );
            })
        );
        $('#io-ox-windowmanager').toggleClass('has-sticky-window', hasStickyWindows);
        $('#io-ox-core').toggleClass('taskbar-visible', $('#io-ox-taskbar').children().length > 0);
        updateScrollControllState();
    }, 20));

    collection.on('change:count', function (window, count) {
        $('#io-ox-taskbar').find('[data-cid="' + window.cid + '"] .count').toggle(count > 0).text(count);
    });

    $(document).on('click', '#io-ox-taskbar button', function (e) {
        var cid = $(e.currentTarget).attr('data-cid'),
            model = collection.get(cid);
        model.get('window').makeActive();
    });

    var scrolling = false,
        keepScrolling = true;
        // add controls to taskbar-container
    $('#io-ox-taskbar-container')
        .prepend($('<button type="button" class="taskbar-control control-left">').append('<i class="fa fa-chevron-left">').on('mousedown', scroll)
            .on('mouseup mouseleave', function () {
                scrolling = false;
                keepScrolling = false;
            }))
        .append($('<button type="button" class="taskbar-control control-right">').append('<i class="fa fa-chevron-right">').on('mousedown', { right: true }, scroll)
            .on('mouseup mouseleave', function () {
                scrolling = false;
                keepScrolling = false;
            }));

    function scroll(e) {
        keepScrolling = true;

        var node = $('#io-ox-taskbar'),
            right = e.data && e.data.right,
            distance = 0,
            doScroll = function (dist) {

                // already scrolling, so we're done
                if (scrolling) return;
                scrolling = true;

                // defer is needed because the callback returns instantly, while the animation isn't finished yet
                node.animate({ 'scrollLeft': (right ? '+=' : '-=') + (dist || distance) }, (dist || distance) * 2, 'linear', function () {
                    scrolling = false;
                    updateScrollControllState();
                    // failsave to prevent infinite scrolling
                    if ((right && $('#io-ox-taskbar-container .control-right').prop('disabled')) || (!right && $('#io-ox-taskbar-container .control-left').prop('disabled'))) {
                        keepScrolling = false;
                    }
                    if (keepScrolling) {
                        doScroll(98);
                    }
                });
            };

        // children are sorted right to left
        _(node.children()).each(function (tab, index) {
            // scroll to tab if more than half of the tab (width 90px + margin 8px)is out of the view or if it's the first/last tab
            if (!right && distance === 0 && (index === node.children().length - 1 || $(tab).offset().left - node.offset().left < -49)) {
                distance = node.offset().left - $(tab).offset().left;
            } else if (right && (index === 0 || tab.getBoundingClientRect().right - node[0].getBoundingClientRect().right > 49)) {
                distance = tab.getBoundingClientRect().right - node[0].getBoundingClientRect().right;
            }
        });

        if (distance === 0) {
            return;
        }

        doScroll();
    }

    function updateScrollControllState() {
        var node = $('#io-ox-taskbar');
        $('#io-ox-taskbar-container .control-left').prop('disabled', node.scrollLeft() === 0);
        $('#io-ox-taskbar-container .control-right').prop('disabled', node.scrollLeft() === node[0].scrollWidth - node.width());
    }

    $(window).on('resize', _.debounce(updateScrollControllState, 50));

    return WindowView;

});
