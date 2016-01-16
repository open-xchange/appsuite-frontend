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
    // Model Dialog View.
    //
    // options:
    // - async: call busy() instead of close() when invoking an action (except "cancel")
    // - container: parent DOM element of the dialog
    // - enter: this action is triggered on <enter>
    // - focus: set initial focus on this element
    // - help: TBD
    // - keyboard: close popup on <escape>
    // - maximize: popup uses full height
    // - point: extension point id to render content
    // - title: dialog title
    // - width: dialog width

    var ModalDialogView = ExtensibleView.extend({

        className: 'modal flex',

        events: {
            'click [data-action]': 'onAction',
            'keydown input:text, input:password': 'onKeypress'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // ensure options
            options = _.extend({ container: 'body', keyboard: true }, options);
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
            // add structure now
            var title_id = _.uniqueId('title');
            this.$el.attr({ tabindex: -1, role: 'dialog', 'aria-labelledby': title_id }).append(
                $('<div class="modal-dialog">').append(
                    $('<div class="modal-content">').append(
                        $('<div class="modal-header"><h4 class="modal-title"></h4></div>'),
                        this.$body = $('<div class="modal-body">'),
                        $('<div class="modal-footer">')
                    )
                )
            );
            // set title via options
            this.$('.modal-title').attr('id', title_id);
            this.setTitle(options.title);
            // apply custom width
            this.$('.modal-dialog').width(options.width);
            // maximize?
            this.$el.toggleClass('maximize', options.maximize);
        },

        render: function () {
            return this.invoke('draw', this.$body);
        },

        setTitle: function (title) {
            this.$('.modal-title').text(title || '\u00A0');
        },

        open: function () {
            var o = this.options;
            this.render().$el.appendTo(o.container);
            this.$el.modal({ keyboard: o.keyboard }).modal('show');
            this.trigger('open');
            // set initial focus
            this.previousFocus = $(document.activeElement);
            this.$(o.focus).focus();
            return this;
        },

        close: function () {
            this.trigger('close');
            this.$el.modal('hide');
            if (this.previousFocus) this.previousFocus.focus();
            this.$el.remove();
            return this;
        },

        busy: function () {
            // disable all form elements; mark already disabled elements via CSS class
            this.$(':input').each(function () {
                $(this).toggleClass('disabled', $(this).prop('disabled')).prop('disabled', true);
            });
            this.activeElement = $(document.activeElement);
            this.$body.css('opacity', 0.50);
            this.$el.focus();
            return this;
        },

        idle: function () {
            // enable all form elements
            this.$(':input').each(function () {
                $(this).prop('disabled', $(this).hasClass('disabled')).removeClass('disabled');
            });
            this.$body.css('opacity', '');
            if (this.activeElement) this.activeElement.focus();
            return this;
        },

        build: function (fn) {
            fn.call(this);
            return this;
        },

        addButton: function (options) {
            var o = _.extend({ placement: 'right', className: 'btn-primary', label: gt('Close'), action: 'cancel' }, options),
                left = o.placement === 'left', fn = left ? 'prepend' : 'append';
            if (left) o.className += ' pull-left';
            this.$('.modal-footer')[fn](
                $('<button class="btn" tabindex="1">')
                    .addClass(o.className)
                    .attr('data-action', o.action)
                    .text(o.label)
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
            return this.addButton(
                _.extend({ placement: 'left', className: 'btn-default', label: 'Alt', action: 'alt' }, options)
            );
        },

        onAction: function (e) {
            this.invokeAction($(e.currentTarget).attr('data-action'));
        },

        invokeAction: function (action) {
            this.trigger(action);
            if (this.options.async && action !== 'cancel') this.busy(); else this.close();
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
            new ModalDialog({ enter: 'woohoo', focus: '.foo', maximize: true, title: 'Example' })
            .build(function () {
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label>').text('Label'),
                        $('<input type="text" class="form-control foo" tabindex="1">')
                    ),
                    $('<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>')
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
