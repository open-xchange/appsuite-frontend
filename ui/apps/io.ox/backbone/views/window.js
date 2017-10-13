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
            this.$el.on('click', this.makeActive.bind(this));
            this.$el.on('click', '[data-action="close"]', this.close.bind(this));
            this.$el.on('click', '[data-action="cornered"]', this.changeDisplayStyle.bind(this, 'cornered'));
            this.$el.on('click', '[data-action="centered"]', this.changeDisplayStyle.bind(this, 'centered'));
            this.$el.on('click', '[data-action="sticky"]', this.changeDisplayStyle.bind(this, 'sticky'));
            this.on('dispose', function () { remove(this); });
            this.minimized = null;
            // possible values are: cornered, centered, sticky
            // minimized is saved separately so we know to which style we need to change the window again.
            this.displayStyle = this.options.displayStyle || 'cornered';
            // new windows are active by default
            this.makeActive();
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
                                $('<a href="#" data-action="cornered">').append('<i class="fa fa-window-restore">'),
                                $('<a href="#" data-action="centered">').append('<i class="fa fa-window-maximize">'),
                                $('<a href="#" data-action="sticky">').append('<i class="fa fa-thumb-tack">'),
                                this.options.closable ? $('<a href="#" data-action="close">').append('<i class="fa fa-window-close">') : ''
                            )
                        ),
                        this.$body = this.$body || $('<div class="floating-body abs">')
                    )
                );
            return this;
        },

        open: function () {
            $('#io-ox-screens').append(this.render().$el);
            add(this);
            this.toggle(true);
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

        makeActive: function (e) {
            if (e) {
                e.stopPropagation();
            }
            var self = this;
            collection.each(function (model) {
                model.get('window').$el.toggleClass('active', model.get('window').cid === self.cid);
            });
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

    collection.on('remove show hide', function () {

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
                            $('<span class="count label label-danger">').toggle(floatingWindow.count > 0).text(floatingWindow.count),
                            floatingWindow.options.closable ? $('<a role="button" href="#" class="pull-right" data-action="close">').append('<i class="fa fa-window-close">').on('click', floatingWindow.close.bind(floatingWindow)) : ''
                        )
                );
            })
        );
        $('#io-ox-windowmanager').toggleClass('has-sticky-window', hasStickyWindows);
        $('#io-ox-core').toggleClass('taskbar-visible', $('#io-ox-taskbar').children().length > 0);
    });

    collection.on('change:count', function (window, count) {
        $('#io-ox-taskbar').find('[data-cid="' + window.cid + '"] .count').toggle(count > 0).text(count);
    });

    $(document).on('click', '#io-ox-taskbar button', function (e) {
        var cid = $(e.currentTarget).attr('data-cid'),
            model = collection.get(cid);
        model.get('window').toggle(true);
    });

    return WindowView;

});
