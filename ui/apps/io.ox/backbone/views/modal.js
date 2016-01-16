/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/modal', ['io.ox/backbone/views/extensible', 'gettext!io.ox/core'], function (ExtensibleView, gt) {

    'use strict';

    //
    // Extensible view.
    //

    var ModalDialogView = ExtensibleView.extend({

        className: 'modal flex',

        events: {
            'click [data-action]': 'onAction',
            'keydown input:text, input:password': 'onKeypress'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // ensure options
            options = options || {};
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
            // add structure now
            this.$el.attr({ tabindex: -1, role: 'dialog' }).append(
                $('<div class="modal-dialog">').append(
                    $('<div class="modal-content">').append(
                        $('<div class="modal-header"><h4 class="modal-title">Horst</h4></div>'),
                        $('<div class="modal-body">'),
                        $('<div class="modal-footer">')
                    )
                )
            );
            // shortcut
            this.$body = this.$('.modal-body');
            // apply custom width
            if (options.width) this.$('.modal-dialog').width(options.width);
            // respond to window resize
            function onResize() {
                this.trigger('resize');
            }
            $(window).on('resize orientationchange', $.proxy(onResize, this));
            this.on('dispose', function () {
                $(window).off('resize orientationchange', onResize);
            });
        },

        render: function () {
            this.on('resize', this.setMaxHeight.bind(this));
            return this.invoke('draw', this.$body);
        },

        setMaxHeight: function () {
            this.$body.css('max-height', $(window).height() - 160);
        },

        open: function () {
            this.render().$el.appendTo('body');
            this.setMaxHeight();
            this.$el.modal('show');
            // set initial focus
            this.$(this.options.focus).focus();
            return this;
        },

        close: function () {
            this.$el.modal('hide');
            this.$el.remove();
            return this;
        },

        build: function (fn) {
            fn.call(this);
            return this;
        },

        addButton: function (options) {
            options = _.extend({ placement: 'right', className: 'btn-primary', label: gt('Close'), action: 'cancel' }, options);
            var left = options.placement === 'left', fn = left ? 'prepend' : 'append';
            if (left) options.className += ' pull-left';
            this.$('.modal-footer')[fn](
                $('<button class="btn" tabindex="1">')
                    .addClass(options.className)
                    .attr('data-action', options.action)
                    .text(options.label)
            );
            return this;
        },

        addCloseButton: function () {
            return this.addButton();
        },

        addCancelButton: function () {
            return this.addButton({ className: 'btn-default', label: gt('Cancel') });
        },

        addAlternativeButton: function (options) {
            options = _.extend({ placement: 'left', className: 'btn-default', label: 'Alt', action: 'alt' }, options);
            return this.addButton(options);
        },

        onAction: function (e) {
            var action = $(e.currentTarget).attr('data-action');
            this.invokeAction(action);
        },

        invokeAction: function (action) {
            this.trigger(action);
            this.close();
        },

        onKeypress: function (e) {
            if (e.which !== 13) return;
            if (!this.options.enter) return;
            if (!$(e.target).is('input:text, input:password')) return;
            this.invokeAction(this.options.enter);
        }
    });

    ModalDialogView.foo = function () {
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ focus: '.foo', enter: 'woohoo' })
            .build(function () {
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<input type="text" class="form-control foo" tabindex="1">')
                    ),
                    $('<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>')
                );
            })
            .addCancelButton()
            .addCloseButton()
            .addAlternativeButton()
            .on('all', _.inspect)
            .open();
        });
    };

    return ModalDialogView;
});
