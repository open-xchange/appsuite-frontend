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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view', [
    'io.ox/core/extensions',
    'io.ox/find/view-searchbox',
    'io.ox/find/view-facets',
    'gettext!io.ox/core',
    'less!io.ox/find/style'
], function (ext, AutocompleteView, FacetView, gt) {

    'use strict';

    /**
     * view
     *     view-searchbox
     *         view-tokenfield
     *             view-token
     *     view-facets
     */

    var FindView = Backbone.View.extend({

        events: {
            'focusin .token-input': 'show',
            // when a user clicks the cancel button the focus is still in the search field. Without the keydown handler the search field would not expand because there is no focusin event
            'keydown': 'onKeydown',
            'focusout': 'smartCancel',
            // subview buttons
            'click .action-cancel': 'cancel',
            'keydown .action-cancel': 'cancel',
            // facets
            'click .action-options': 'onToggle'
        },

        classes: {
            active: 'active',
            userchange: 'changed-by-user'
        },

        /**
         *  -> left: view-searchbox
         *      -> input: view-tokenfield
         *          -> token: view-token
         *  -> right: view-facets
         */

        initialize: function (options) {
            var props = {
                app: options.app,
                // could be external view (inplace) or search view (standalone)
                win: options.app.getWindow(),
                model: options.model,
                baton: ext.Baton({
                    app: options.app,
                    model: options.model,
                    view: this,
                    $: this.$el
                })
            };
            props.baton.model = props.model;

            // props
            _.extend(this, props);

            // TODO: legacy?
            _.extend(this, {
                active: false,
                lastFocus: '',
                selectors: {
                    facets: '.search-facets:first',
                    facetsadv: '.search-facets-advanced'
                }
            });

            // field stub already rendered
            this.setElement($('.io-ox-find[data-app="' + this.app.get('parent').id + '"]'));

            // shortcuts
            this.ui = {
                searchbox: undefined,
                facets: undefined,
                field: this.$el.find('.search-field'),
                actions: this.$el.find('.action')
            };

            // create empty view
            this.ui.searchbox = new AutocompleteView(_.extend(props, { parent: this }));
            this.ui.facets = new FacetView(_.extend(props, { parent: this }));

            this.listenTo(options.app, 'view:disable', this.disable);
            this.listenTo(options.app, 'view:enable', this.enable);
        },

        disable: function () {
            // only real change. We want to avoiud screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === true) return;
            this.$el.toggleClass('disabled', true);
            this.ui.actions.prop('disabled', true);
            this.ui.field.prop('disabled', true);
            this.ui.field.find('input.token-input.tt-input').removeAttr('tabindex');
            this.$el.find('input.form-control.tokenfield').trigger('aria-live-update', gt('Search function not supported in this folder'));
        },

        enable: function () {
            // only real change. We want to avoiud screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === false) return;
            this.$el.toggleClass('disabled', false);
            this.ui.actions.prop('disabled', false);
            this.ui.field.prop('disabled', false);
            this.ui.field.find('input.token-input.tt-input').attr('tabindex', 0);
            this.$el.find('input.form-control.tokenfield').trigger('aria-live-update', '');
        },

        render: function () {
            this.ui.searchbox.render().$el.append(
                this.ui.facets.render().$el
            );

            // ensure tooltip get's hidden
            this.listenTo(this.ui.facets, 'open close', function () {
                this.$('.action-options').tooltip('hide');
            }.bind(this));

            return this;
        },

        onToggle: function (e) {
            $(e.target).focus();
            this.ui.facets.toggle();
        },

        onKeydown: function (e) {
            // don't open on tab
            if (this.isActive() || e.which === 9) return;
            this.show();
        },

        show: function () {
            this.trigger('focusin');
            if (this.isActive()) return;
            // css switch-class
            this.$el.addClass(this.classes.active);
            // bubble
            this.ui.searchbox.show();
            // loose coupling
            this.trigger('show');
        },

        // collapse (keep focus)
        hide: function () {
            if (!this.isActive() || !this.isEmpty()) return;
            // css switch-class
            this.$el.removeClass(this.classes.active);
            // bubble
            this.ui.searchbox.hide();
            this.ui.facets.hide();
            // loose coupling
            this.trigger('hide');
        },

        // reset fields (keep focus)
        reset: function () {
            if (!this.isActive()) return;
            // model reset
            this.model.reset();
            // view reset
            this.ui.searchbox.reset();
            this.ui.facets.reset();
            // remove flags
            this.$el.removeClass(this.classes.userchange);
            // throw event
            this.trigger('reset');
        },

        cancel: function (e) {
            if (e && !(e.type === 'click' || /13|32/.test(e.which))) return;

            this.reset();
            this.hide();
            // move focus
            this.trigger('cancel');
        },

        userchange: function () {
            this.$el.addClass(this.classes.userchange);
            this.setFocus();
        },

        hasChanged: function () {
            return this.$el.hasClass(this.classes.userchange);
        },

        // on focusout
        smartCancel: function () {
            var self = this;
            this.app.trigger('focusout');
            // ensures click event in toolbar resolves before cancel is executed
            _.delay(function () {
                if (!self.hasFocus() && self.isEmpty() && !self.hasChanged()) self.cancel();
            }, 150);
        },

        setFocus: function () {
            // focus search field
            return this.ui.searchbox.setFocus();
        },

        isActive: function () {
            return this.$el.hasClass(this.classes.active);
        },

        isEmpty: function () {
            return this.ui.searchbox.isEmpty();
        },

        // hint: defer call in case it's used withing focus event stack
        hasFocus: function () {
            var node = $(document.activeElement);
            return !!node.closest('.io-ox-find, .smart-dropdown-container.facets').length;
        }
    });

    return FindView;
});
