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

define('io.ox/backbone/views/window', ['io.ox/backbone/views/disposable'], function (DisposableView) {

    'use strict';

    var WindowView = DisposableView.extend({

        className: 'floating-window',

        constructor: function (options) {
            this.options = options || {};
            this.title = this.options.title;
            DisposableView.prototype.constructor.apply(this, arguments);
            this.$el.on('click', '[data-action="minimize"]', this.onMinimize.bind(this));
            this.minimized = null;
        },

        render: function () {
            var title_id = _.uniqueId('title');
            this.$el.attr({ tabindex: -1, role: 'dialog', 'aria-labelledby': title_id }).append(
                $('<div class="abs" role="document">').append(
                    this.$header = $('<div class="floating-header abs">').append(
                        $('<h1>').attr('id', title_id).text(this.options.title || '\u00A0'),
                        $('<div class="controls">').append(
                            $('<a href="#" data-action="minimize">').append('<i class="fa fa-window-minimize">')
                        )
                    ),
                    this.$body = $('<div class="floating-body abs">')
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

        close: function () {
            remove(this);
            this.$el.remove();
            return this;
        },

        setTitle: function (title) {
            this.title = title;
            this.$header.find('h1').text(title || '\u00A0');
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
        // get number of minimized windows
        $('#io-ox-taskbar').empty().append(
            this.map(function (model) {
                var window = model.get('window');
                if (!window.minimized) return $();
                return $('<li>').append(
                    $('<button type="button">')
                        .attr('data-cid', window.cid)
                        .text(window.title)
                );
            })
        );
        $('#io-ox-core').toggleClass('taskbar-visible', $('#io-ox-taskbar').children().length > 0);
    });

    $(document).on('click', '#io-ox-taskbar button', function (e) {
        var cid = $(e.currentTarget).attr('data-cid'),
            model = collection.get(cid);
        model.get('window').toggle(true);
    });

    return WindowView;

});
