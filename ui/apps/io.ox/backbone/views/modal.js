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

define('io.ox/backbone/views/modal', ['io.ox/backbone/views/extensible', 'io.ox/core/a11y', 'gettext!io.ox/core'], function (ExtensibleView, a11y, gt) {

    'use strict';

    //
    // Modal Dialog View
    //
    // options:
    // - async: call busy() instead of close() when invoking an action (except "cancel")
    // - backdrop: include a backdrop element - default is 'static': backdrop is rendered but non-clickable,
    //       see http://getbootstrap.com/javascript/#modals-options
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
            'click .modal-footer [data-action]': 'onAction',
            'keydown input:text, input:password': 'onKeypress',
            'keydown': 'onKeydown'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // ensure options
            options = _.extend({
                async: false,
                autoClose: true,
                context: {},
                keyboard: true,
                maximize: false,
                smartphoneInputFocus: false,
                autoFocusOnIdle: true
            }, options);
            // ensure correct width on smartphone
            if (_.device('smartphone') && options.width >= 320) {
                options.width = '95%';
                options.maximize = '95%';
            }
            this.context = options.context;
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
            this.autoFocusOnIdle = options.autoFocusOnIdle;
            // add structure now
            var title_id = _.uniqueId('title');
            this.$el
                .toggleClass('maximize', !!options.maximize)
                .attr({ role: 'dialog', 'aria-modal': true, 'aria-labelledby': title_id })
                .append(
                    $('<div class="modal-dialog" role="document">').width(options.width).append(
                        $('<div class="modal-content">').append(
                            this.$header = $('<div class="modal-header">').append(
                                this.$title = $('<h1 class="modal-title">').attr('id', title_id).text(options.title || '\u00A0')
                            ),
                            this.$body = $('<div class="modal-body">'),
                            this.$footer = $('<div class="modal-footer">')
                        )
                    )
                );
            // ensure proper context for the following functions to simplify callback handling
            this.close = close.bind(this);
            this.busy = busy.bind(this);
            this.idle = idle.bind(this);
            // when clicking next to the popup the modal dialog only hides by default. Remove it fully instead, causes some issues otherwise.
            this.$el.on('hidden.bs.modal', this.close);
            // apply max height if maximize is given as number or string
            if (_.isNumber(options.maximize) || _.isString(options.maximize)) this.$('.modal-content').css('max-height', options.maximize);
            // add help icon?
            if (options.help) {
                var helpPlaceholder = $('<a class="io-ox-context-help">');
                this.$header.append(helpPlaceholder);
                require(['io.ox/backbone/mini-views/helplink'], function (HelpLinkView) {
                    var parent = helpPlaceholder.parent();
                    parent.addClass('help');
                    helpPlaceholder.replaceWith(
                        new HelpLinkView({ href: options.help, modal: true }).render().$el
                    );
                });
            }

            if (options.description) this.addDescription(options);

            // scroll inputs into view when smartphone keyboard shows up
            if (_.device('smartphone') && options.smartphoneInputFocus) {
                // make sure scrolling actually works
                this.$el.find('.modal-content').css('overflow-y', 'auto');
                this.listenToDOM(window, 'resize', this.scrollToInput);
            }

            // track focusin
            // keep focus is a prototype function and all listeners will be removed from document with off
            // make it unique by binding to this
            this.keepFocus = this.keepFocus.bind(this);
            this.listenToDOM(document, 'focusin', this.keepFocus);
        },

        scrollToInput: function () {
            if ($(document.activeElement).filter('input[type="email"],input[type="text"],textarea').length === 1) {
                document.activeElement.scrollIntoView();
            }
        },

        keepFocus: function (e) {
            var target = $(e.target);
            // if child is target of this dialog, event handling is done by bootstrap
            if (this.$el.has(target).length) return;

            // we have to consider that two popups might be open
            // so we cannot just refocus the current popup
            var insidePopup = $(e.target).closest('.io-ox-dialog-popup, .io-ox-sidepopup, .mce-window, .date-picker').length > 0;
            // should not keep focus if smart dropdown is open
            var smartDropdown = $('body > .smart-dropdown-container').length > 0;

            // stop immediate propagation to prevent bootstrap modal event listener from getting the focus
            if (insidePopup || smartDropdown) {
                e.stopImmediatePropagation();
            }
        },

        render: function () {
            return this.invoke('render', this.$body);
        },

        open: function () {
            var o = this.options,
                self = this;
            if (o.render !== false) this.render().$el.appendTo('body');
            // remember previous focus
            this.previousFocus = o.previousFocus || $(document.activeElement);
            if (_.device('smartphone')) {
                // rebuild button section for mobile devices
                this.$el.addClass('mobile-dialog');
                this.$footer.rowfluid = $('<div class="row">');
                this.$footer.append(this.$footer.rowfluid);
                this.$buttons = this.$footer.find('button,a.btn');
                _.each(this.$buttons, function (buttonNode) {
                    self.$footer.rowfluid.prepend($(buttonNode).addClass('btn-medium'));
                    $(buttonNode).wrap('<div class="col-xs-12 col-md-3">');
                });
            }

            this.trigger('before:open');
            // keyboard: false to support preventDefault on escape key
            this.$el.modal({ backdrop: o.backdrop || 'static', keyboard: false }).modal('show');
            this.toggleAriaHidden(true);
            this.trigger('open');
            this.setFocus(o);
            // track open instances
            open.add(this);
            return this;
        },

        setFocus: function (o) {
            var self = this;
            // set initial focus
            if (o.focus) {
                var elem = this.$(o.focus);
                if (elem.length) {
                    // dialog might be busy, i.e. elements are invisible so focus() might not work
                    this.activeElement = elem[0];
                    elem[0].focus();
                }
            } else {
                // Defer focus handling and then try to focus in following order:
                // 1: First tababble element in modal body
                // 2: Primary button in footer
                // 3: First tababble element in footer
                _.defer(function () {
                    if (self.disposed) return;
                    self.$el.toggleClass('compact', self.$body.is(':empty'));
                    var focusNode = a11y.getTabbable(self.$body).first();
                    if (focusNode.length === 0) focusNode = self.$footer.find('.btn-primary');
                    if (focusNode.length === 0) focusNode = a11y.getTabbable(self.$footer).first();
                    if (focusNode.length !== 0) focusNode.focus();
                });
            }
        },

        toggleAriaHidden: function () {
            // A11y: This function may be removed in the future (needs more testing)
            //
            // New:
            // Uses new WCAG 1.1 aria-modal on role="dialog" element
            // Old:
            // this.$el.siblings(':not(script,noscript)').attr('aria-hidden', !!state);
        },

        disableFormElements: function () {
            // function may not be run 2 times in a row, "disabled" marker class would be applied to every input, therefore keep track of it
            if (this.formElementsDisabled) return;
            this.formElementsDisabled = true;

            // disable all form elements; mark already disabled elements via CSS class
            this.$(':input').each(function () {
                if ($(this).attr('data-action') === 'cancel' || $(this).attr('data-state') === 'manual') return;
                $(this).toggleClass('disabled', $(this).prop('disabled')).prop('disabled', true);
            });
        },

        enableFormElements: function () {
            this.formElementsDisabled = false;
            // enable all form elements
            this.$(':input').each(function () {
                if ($(this).attr('data-state') === 'manual') return;
                // input elements that have the "disabled" class, were already disabled when disableFormElements was called. Leave them disabled to recreate the previous state and remove the marker class.
                if ($(this).hasClass('disabled')) {
                    $(this).removeClass('disabled');
                    return;
                }
                $(this).prop('disabled', false);
            });
        },

        hideBody: function () {
            this.$('.modal-body').hide();
            this.$('.modal-footer').css('border-top', 0);
            return this;
        },

        hideFooter: function () {
            this.$('.modal-footer').hide();
            return this;
        },

        showFooter: function () {
            this.$('.modal-footer').show();
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
            var o = _.extend({ placement: 'right', className: 'btn-primary', label: gt('Close'), action: 'cancel', disabled: false }, options),
                left = o.placement === 'left', fn = left ? 'prepend' : 'append';
            if (left) o.className += ' pull-left';
            this.$footer[fn](
                $('<button type="button" class="btn">')
                    .addClass(o.className)
                    .attr('data-action', o.action)
                    .prop('disabled', o.disabled)
                    .text(o.label)
            );
            return this;
        },

        addDescription: function (options) {
            if (!options.description) return this;
            var id = _.uniqueId('modal-description-'),
                node = $('<div>').attr('id', id);
            if (typeof options.description === 'object') node.append(options.description);
            else node.text(options.description);
            this.$el.attr('aria-describedby', id);
            this.$body.prepend(node);
            return this;
        },

        // special button (a with href and download attribute)
        // needed for downloads in safari to prevent the Frame load interrupted error
        addDownloadButton: function (options) {
            var o = _.extend({ placement: 'right', className: 'btn-primary', label: gt('Download'), action: 'cancel', href: '#' }, options),
                left = o.placement === 'left', fn = left ? 'prepend' : 'append';
            if (left) o.className += ' pull-left';
            this.$footer[fn](
                $('<a role="button" class="btn">')
                    .addClass(o.className)
                    .attr({
                        'data-action': o.action,
                        href: o.href,
                        download: 'download'
                    })
                    .text(o.label)
            );
            return this;
        },

        addCloseButton: function () {
            return this.addButton();
        },

        addCancelButton: function (options) {
            options = options || {};
            var data = { className: 'btn-default', label: gt('Cancel') };
            if (options.left) data.placement = 'left';
            return this.addButton(data);
        },

        addAlternativeButton: function (options) {
            return this.addButton(
                _.extend({ placement: 'left', className: 'btn-default', label: 'Alt', action: 'alt' }, options)
            );
        },

        addCheckbox: function (options) {
            var o = _.extend({ className: 'pull-left' }, options),
                id = _.uniqueId('custom-');
            this.$footer.prepend(
                $('<div class="checkbox custom">').append(
                    $('<label>').attr('for', id).prepend(
                        $('<input type="checkbox" class="sr-only">')
                            .attr({ 'id': id, 'name': o.action })
                            .prop('checked', o.status),
                        $('<i class="toggle" aria-hidden="true">'),
                        $.txt(o.label || '\u00a0')
                    )
                )
                .addClass(o.className)
            );
            return this;
        },

        onAction: function (e) {
            this.invokeAction($(e.currentTarget).attr('data-action'));
        },

        invokeAction: function (action) {
            // if async we need to make the dialog busy before we trigger the action
            // otherwise we cannot idle the dialog in the action listener
            if (this.options.async && action !== 'cancel') this.busy();
            this.trigger(action);
            // for general event listeners
            this.trigger('action', action);
            // check if already disposed/closed by the action
            if (this.disposed) return;
            // check if this.options is there, if the dialog was closed in the handling of the action this.options is empty and we run into a js error otherwise
            if ((this.options && !this.options.async && this.options.autoClose !== false) || action === 'cancel') this.close();
        },

        onKeypress: function (e) {
            if (e.which !== 13) return;
            if (!this.options.enter) return;
            if (!$(e.target).is('input:text, input:password')) return;
            e.preventDefault();
            this.invokeAction(this.options.enter);
        },

        onKeydown: function (e) {
            this.onEscape(e);
            this.onTab(e);
        },

        onEscape: function (e) {
            if (e.which !== 27) return;
            if (e.isDefaultPrevented()) return;
            if (this.$footer.find('[data-action="cancel"]').length > 0) this.trigger('cancel');
            this.close();
        },

        onTab: function (e) {
            if (e.which !== 9) return;
            a11y.trapFocus(this.$el, e);
        },

        // hide dialog without disposing it
        pause: function () {
            $(document).off('focusin', this.keepFocus);
            if (this.options.render !== false) {
                this.$el.next('.modal-backdrop.in:visible').addBack().hide();
            } else {
                this.$el.prev('.modal-backdrop.in:visible').addBack().hide();
            }
            // use disableFormElements here, so when resuming, the correct disabled status can be set again (resume -> idle -> enableFormElements needs the correct marker classes)
            this.disableFormElements();
            this.toggleAriaHidden(false);
            this.trigger('pause');
        },

        resume: function () {
            $(document).on('focusin', this.keepFocus);
            if (this.options.render !== false) {
                this.$el.next('.modal-backdrop.in:hidden').addBack().show();
            } else {
                this.$el.prev('.modal-backdrop.in:hidden').addBack().show();
            }
            // add marker class again(needed by yells for example)
            $(document.body).addClass('modal-open');
            this.toggleAriaHidden(true);
            this.idle();
            this.trigger('resume');
        }
    });

    function close(e, options) {

        if (!this.$el) return;

        this.trigger('before:close');
        // stop listening to hidden event (avoid infinite loops)
        this.$el.off('hidden.bs.modal');
        if (!e || e.type !== 'hidden') this.$el.modal('hide');
        this.toggleAriaHidden(false);
        this.trigger('close');
        var previousFocus = this.previousFocus;
        this.$el.remove();
        open.remove(this, options);
        if (previousFocus) previousFocus.focus();
        return this;
    }

    function busy(withAnimation) {
        this.disableFormElements();
        this.activeElement = this.activeElement || document.activeElement;
        if (withAnimation) {
            this.$body.addClass('invisible');
            this.$body.parent().busy();
        } else {
            this.$body.css('opacity', 0.50);
        }
        this.$el.focus();
        return this;
    }

    function idle() {
        this.enableFormElements();
        this.$body.parent().idle();
        this.$body.removeClass('invisible').css('opacity', '');
        if (this.autoFocusOnIdle) {
            // try to restore focus (active element is stored in busy function)
            if ($.contains(this.el, this.activeElement)) {
                $(this.activeElement).focus();
                // fallback, to keep focus in the dialog
            } else this.setFocus(this.options);
        }
        this.activeElement = null;
        return this;
    }

    // track open instances

    var open = {

        queue: [],

        add: function (dialog) {
            if (this.queue.indexOf(dialog) > -1) return;
            if (this.queue.length) _(this.queue).last().pause();
            this.queue.push(dialog);
        },

        remove: function (dialog, options) {
            if (options && options.resetDialogQueue) this.queue = [];
            this.queue = _(this.queue).without(dialog);
            if (this.queue.length) _(this.queue).last().resume();
        }
    };

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
