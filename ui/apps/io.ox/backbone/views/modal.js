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
            'click [data-action]': 'onAction'
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
            return this.invoke('draw', this.$('.modal-body'));
        },

        open: function () {
            this.render().$el.appendTo('body');
            this.setMaxHeight();
            this.$el.modal('show');
            return this;
        },

        close: function () {
            this.$el.modal('hide');
            this.$el.remove();
            return this;
        },

        addButton: function (options) {
            options = _.extend({ placement: 'right', className: 'btn-primary', label: gt('Close'), action: 'cancel' }, options);
            var fn = options.placement === 'left' ? 'prepend' : 'append';
            this.$('.modal-footer')[fn](
                $('<button class="btn" tabindex="1">')
                    .addClass(options.className)
                    .addClass('pull-' + options.placement)
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
            this.trigger(action);
            if (action === 'cancel') this.close();
        },

        setMaxHeight: function () {
            this.$('.modal-body').css('max-height', $(window).height() - 160);
        }
    });

    return ModalDialogView;
});
