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
    // - help: link to online help article
    // - keyboard: close popup on <escape>
    // - maximize: popup uses full height; if given as number maximize but use that limit (useful on large screens)
    // - point: extension point id to render content
    // - title: dialog title
    // - width: dialog width

    var ModalDialogView = ExtensibleView.extend({

        className: 'modal flex',

        events: {
            'click [data-action]': 'onAction',
            'keydown input:text, input:password': 'onKeypress',
            'keydown': 'onEscape'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // ensure options
            options = _.extend({ container: 'body', keyboard: true }, options);
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
            // add structure now
            var title_id = _.uniqueId('title');
            this.$el
                .toggleClass('maximize', options.maximize)
                .attr({ tabindex: -1, role: 'dialog', 'aria-labelledby': title_id })
                .append(
                    $('<div class="modal-dialog">').width(options.width).append(
                        $('<div class="modal-content">').append(
                            $('<div class="modal-header">').append(
                                $('<h4 class="modal-title">').attr('id', title_id).text(options.title || '\u00A0')
                            ),
                            this.$body = $('<div class="modal-body">'),
                            $('<div class="modal-footer">')
                        )
                    )
                );
            // apply max height if maximize is given as number
            if (_.isNumber(options.maximize)) this.$('.modal-dialog').css('max-height', options.maximize);
            // add help icon?
            if (options.help) {
                require(['io.ox/backbone/mini-views/help'], function (HelpView) {
                    this.$('.modal-header').addClass('help').append(
                        new HelpView({ href: options.help }).render().$el
                    );
                }.bind(this));
            }
        },

        render: function () {
            return this.invoke('render', this.$body);
        },

        open: function () {
            var o = this.options;
            this.render().$el.appendTo(o.container);
            this.trigger('before:open');
            // keyboard: false to support preventDefault on escape key
            this.$el.modal({ keyboard: false }).modal('show');
            this.trigger('open');
            // set initial focus
            this.previousFocus = $(document.activeElement);
            var elem = this.$(o.focus);
            if (elem.length) {
                // dialog might be busy, i.e. elements are invisible so focus() might not work
                this.activeElement = elem[0];
                elem[0].focus();
            }
            return this;
        },

        close: function () {
            this.trigger('before:close');
            this.$el.modal('hide');
            this.trigger('close');
            if (this.previousFocus) this.previousFocus.focus();
            this.$el.remove();
            return this;
        },

        disableFormElements: function () {
            // disable all form elements; mark already disabled elements via CSS class
            this.$(':input').each(function () {
                if ($(this).attr('data-action') === 'cancel') return;
                $(this).toggleClass('disabled', $(this).prop('disabled')).prop('disabled', true);
            });
        },

        enableFormElements: function () {
            // enable all form elements
            this.$(':input').each(function () {
                $(this).prop('disabled', $(this).hasClass('disabled')).removeClass('disabled');
            });
        },

        busy: function (withAnimation) {
            this.disableFormElements();
            this.activeElement = this.activeElement || document.activeElement;
            if (withAnimation) {
                this.$body.addClass('invisible');
                this.$('.modal-content').busy();
            } else {
                this.$body.css('opacity', 0.50);
            }
            this.$el.focus();
            return this;
        },

        idle: function () {
            this.enableFormElements();
            this.$('.modal-content').idle();
            this.$body.removeClass('invisible').css('opacity', '');
            if ($.contains(this.el, this.activeElement)) $(this.activeElement).focus();
            this.activeElement = null;
            return this;
        },

        build: function (fn) {
            fn.call(this);
            return this;
        },

        // Add a button
        //
        // options:
        // - placement: 'left' or 'right' (default)
        // - className: 'btn-primary' (default) or 'btn-default'
        // - label: Button label
        // - action: Button action
        //
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
        },

        onEscape: function (e) {
            if (e.which !== 27) return;
            if (e.isDefaultPrevented()) return;
            this.close();
        }
    });

    /*

    Just for debugging:

    require(['io.ox/backbone/views/modal'], function (ModalDialog) {
        new ModalDialog({ enter: 'woohoo', focus: '.foo', help: 'xmpl', point: 'modal/xmpl', maximize: true, title: 'Example' })
        .extend({
            default: function () {
                this.append(
                    $('<div class="form-group">').append(
                        $('<label>').text('Label'),
                        $('<input type="text" class="form-control foo" tabindex="1">')
                    )
                );
            },
            text: function () {
                this.append(
                    $('<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>')
                );
            }
        })
        .addCancelButton()
        .addCloseButton()
        .addAlternativeButton()
        .on('all', _.inspect)
        .open();
    });

    */

    return ModalDialogView;
});
