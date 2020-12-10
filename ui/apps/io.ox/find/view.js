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
            'keydown .action-cancel': 'cancel'
        },

        classes: {
            active: 'io-ox-find-active',
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
            this.setElement(this.win.nodes.sidepanel.find('.io-ox-find'));

            // shortcuts
            this.ui = {
                container: undefined,
                body: undefined,
                manager: undefined,
                // subviews
                searchbox: undefined,
                facets: undefined,
                field: this.$el.find('.search-field'),
                action: this.$el.find('.action-show')
            };

            // shortcuts
            this.ui.container = this.$el.closest('.window-container');
            this.ui.body = this.ui.container.find('.window-body');
            this.ui.manager = $('#io-ox-windowmanager');

            // create empty view
            this.ui.searchbox = new AutocompleteView(_.extend(props, { parent: this }));
            this.ui.facets = new FacetView(_.extend(props, { parent: this }));

            this.listenTo(options.app, 'view:disable', this.disable);
            this.listenTo(options.app, 'view:enable', this.enable);
        },

        disable: function () {
            // only real change. We want to avoiud screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === true) return;
            this.ui.field.prop('disabled', true);
            this.ui.action.prop('disabled', true);
            this.ui.field.find('input.token-input.tt-input').removeAttr('tabindex');
            this.$el.find('input.form-control.tokenfield').trigger('aria-live-update', gt('Search function not supported in this folder'));
        },

        enable: function () {
            // only real change. We want to avoiud screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === false) return;
            this.ui.field.prop('disabled', false);
            this.ui.action.prop('disabled', false);
            this.ui.field.find('input.token-input.tt-input').attr('tabindex', 0);
            this.$el.find('input.form-control.tokenfield').trigger('aria-live-update', '');
        },

        calculateDimensions: function () {
            this.css = {
                body: {
                    closed: this.ui.body.css('top'),
                    open: this.$el.outerHeight() + 'px'
                },
                el: {
                    closed: this.$el.css('top'),
                    open: this.ui.manager.offset().top + 'px'
                }
            };
        },

        render: function () {
            // replaces stub
            this.ui.searchbox.render();
            this.ui.facets.render();
            this.register();
            return this;
        },

        onKeydown: function (e) {
            // don't open on tab
            if (this.isActive() || e.which === 9) return;
            this.show();
        },

        show: function () {
            this.trigger('focusin');
            if (this.isActive()) return;
            this.calculateDimensions();
            // apply margin to next
            this.$el.next().css('margin-top', this.css.body.open);
            // apply dynamic styles
            this.ui.body.css('top', this.css.body.open);
            // css switch-class
            this.ui.container.addClass(this.classes.active);
            // bubble
            this.ui.searchbox.show();
            this.ui.facets.show();
            // loose coupling
            this.trigger('show');
        },

        // collapse (keep focus)
        hide: function () {
            if (!this.isActive() || !this.isEmpty()) return;
            // remove margin-top from next
            this.$el.next().css('margin-top', '');
            // reset dynamic styles
            this.ui.body.css('top', this.css.body.closed);
            this.$el.css('top', this.css.el.closed);
            // css switch-class
            this.ui.container.removeClass(this.classes.active);
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
            this.ui.container.removeClass(this.classes.userchange);
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
            this.ui.container.addClass(this.classes.userchange);
            this.setFocus();
        },

        hasChanged: function () {
            return this.ui.container.hasClass(this.classes.userchange);
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

        _onResize: function (delta) {
            var box = this.$el,
                facets = this.ui.facets.$el.find('ul'),
                tree = this.$el.closest('.window-sidepanel').find('.folder-tree'),
                winbody = this.$el.closest('.window-container').find('.window-body');

            box.outerHeight(box.outerHeight() + delta);
            facets.outerHeight(facets.outerHeight() + delta);
            tree.offset({ top: tree.offset().top + delta });
            if (this.app.isActive()) {
                winbody.offset({ top: winbody.offset().top + delta });
            }
        },

        register: function () {
            this.ui.searchbox.on('resize', _.bind(this._onResize, this));
        },

        setFocus: function () {
            // focus search field
            return this.ui.searchbox.setFocus();
        },

        isActive: function () {
            return this.ui.container.hasClass(this.classes.active);
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
