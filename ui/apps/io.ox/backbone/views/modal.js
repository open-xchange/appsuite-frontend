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
            'keydown': 'onKeydown'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // ensure options
            options = _.extend({
                async: false,
                container: 'body',
                context: {},
                keyboard: true,
                maximize: false
            }, options);
            this.context = options.context;
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
            // add structure now
            var title_id = _.uniqueId('title');
            this.$el
                .toggleClass('maximize', !!options.maximize)
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
            // ensure proper context for the following functions to simplify callback handling
            this.close = close.bind(this);
            this.busy = busy.bind(this);
            this.idle = idle.bind(this);
            // when clicking next to the popup the modal dialog only hides by default. Remove it fully instead, causes some issues otherwise.
            this.$el.on('hidden.bs.modal', this.close);
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
            this.$el.siblings().attr('aria-hidden', true);
            this.trigger('open');
            // set initial focus
            this.previousFocus = o.previousFocus || $(document.activeElement);
            var elem = this.$(o.focus);
            if (elem.length) {
                // dialog might be busy, i.e. elements are invisible so focus() might not work
                this.activeElement = elem[0];
                elem[0].focus();
            }
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
                $('<button class="btn" tabindex="0">')
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
            // if async we need to make the dialog busy before we trigger the action
            // otherwise we cannot idle the dialog in the action listener
            if (this.options.async && action !== 'cancel') this.busy();
            this.trigger(action);
            // check if this.options is there, if the dialog was closed in the handling of the action this.options is empty and we run into a js error otherwise
            if ((this.options && !this.options.async) || action === 'cancel') this.close();
        },

        onKeypress: function (e) {
            if (e.which !== 13) return;
            if (!this.options.enter) return;
            if (!$(e.target).is('input:text, input:password')) return;
            this.invokeAction(this.options.enter);
        },

        onKeydown: function (e) {
            this.onEscape(e);
            this.onTab(e);
        },

        onEscape: function (e) {
            if (e.which !== 27) return;
            if (e.isDefaultPrevented()) return;
            this.close();
        },

        onTab: function (e) {
            if (e.which !== 9) return;
            var items, focus, index;
            // tab
            items = this.$el.find('[tabindex][tabindex!="-1"][disabled!="disabled"]:visible');
            if (items.length) {
                e.preventDefault();
                focus = $(document.activeElement);
                index = items.index(focus);
                index += (e.shiftKey) ? -1 : 1;

                if (index >= items.length) {
                    index = 0;
                } else if (index < 0) {
                    index = items.length - 1;
                }
                items.eq(index).focus();
            }
        }
    });

    function close(e) {
        this.trigger('before:close');
        // stop listening to hidden event (avoid infinite loops)
        this.$el.off('hidden.bs.modal');
        if (!e || e.type !== 'hidden') {
            this.$el.modal('hide');
        }
        this.$el.siblings().removeAttr('aria-hidden');
        this.trigger('close');
        if (this.previousFocus) this.previousFocus.focus();
        this.$el.remove();
        return this;
    }

    function busy(withAnimation) {
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
    }

    function idle() {
        this.enableFormElements();
        this.$('.modal-content').idle();
        this.$body.removeClass('invisible').css('opacity', '');
        if ($.contains(this.el, this.activeElement)) $(this.activeElement).focus();
        this.activeElement = null;
        return this;
    }

    /*

    Just for debugging:

    require(['io.ox/backbone/views/modal'], function (ModalDialog) {
        new ModalDialog({ enter: 'woohoo', focus: '.foo', help: 'xmpl', point: 'modal/xmpl', maximize: true, title: 'Example' })
        .extend({
            default: function () {
                this.append(
                    $('<div class="form-group">').append(
                        $('<label>').text('Label'),
                        $('<input type="text" class="form-control foo">')
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
