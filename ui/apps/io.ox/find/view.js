/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view', [
    'io.ox/core/extensions',
    'io.ox/find/view-searchbox',
    'io.ox/find/view-facets',
    'less!io.ox/find/style'
], function (ext, AutocompleteView, FacetView) {

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
            'focusin': 'show',
            'focusout': 'smartCancel',
            'keydown .token-input': 'keyDown',
            // subview buttons
            'click .action-cancel': 'cancel'
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

            // shortcuts
            this.ui = {
                container: undefined,
                body: undefined,
                manager: undefined,
                // subviews
                searchbox: undefined,
                facets: undefined
            };

            // field stub already rendered
            this.setElement(this.win.nodes.sidepanel.find('.io-ox-find'));

            // shortcuts
            this.ui.container = this.$el.closest('.window-container');
            this.ui.body = this.ui.container.find('.window-body');
            this.ui.manager = $('#io-ox-windowmanager');

            // create empty view
            this.ui.searchbox = new AutocompleteView(_.extend(props, { parent: this }));
            this.ui.facets = new FacetView(_.extend(props, { parent: this }));

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

        show: function () {
            this.trigger('focusin');
            if (this.isActive()) return;
            this.calculateDimensions();
            // apply margin to next
            this.$el.next().css('margin-top', this.css.body.open);
            // apply dynamic styles
            this.ui.body.css('top', this.css.body.open);
            this.$el.css('top', this.css.el.open);
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
            // keep search field focused
            this.setFocus();
            // remove flags
            this.ui.container.removeClass(this.classes.userchange);
            // throw event
            this.trigger('reset');
        },

        cancel: function () {
            this.reset();
            this.hide();
            // move to next visible tabindexed node
            this.setFocus(this.shifttab ? 'prev' : 'next');
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
                if (!self.hasFocus() && self.isEmpty() && !self.hasChanged()) {
                    self.cancel();
                }
            }, 150);
        },

        // set flag: shift + tab pressed for focusout handler
        keyDown: function (e) {
            this.shifttab = e.shiftKey && e.which === 9;
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

        setFocus: function (target) {
            // focus search field
            if (target !== 'next' && target !== 'prev') return this.ui.searchbox.setFocus();

            // focus next/prev element in tabindex order
            var tabVisible = '[tabindex][tabindex!="-1"]:visible',
                $list = $(tabVisible),
                last = this.$el.closest('.io-ox-find').find(tabVisible).last(),
                index = $list.index(last),
                incr = target === 'next' ? 1 : -1,
                next =  $list.get(index + incr) || $list.get(index - incr) || $();
            _.defer(function () {
                next.focus();
            });
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
            return !!node.closest('.io-ox-find').length;
        }
    });

    return FindView;
});
