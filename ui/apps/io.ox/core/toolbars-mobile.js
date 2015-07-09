/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/toolbars-mobile', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    /*
     * Abstract Barview
     * Just a superclass for toolbar and navbar
     * Holds some shared
     */
    var BarView = Backbone.View.extend({
        show: function () {
            this.$el.show();
            return this;
        },
        hide: function () {
            this.$el.hide();
            return this;
        }
    });

    /*
     * Navbars
     * Placed at the top of a page to handle navigation and state
     * Some Navbars will get action buttons as well, inspired by iOS
     */
    var NavbarView = BarView.extend({

        tagName: 'div',

        className: 'toolbar-content',

        /*
         * only buttons which do NOT include the .custom class
         * will trigger the navbars onLeft and onRight events
         * For custom actions and links in navbar one must include
         * the .custom class to prevent the view to kill the clickevent
         * early and spawn a onLeft or onRight action
         */
        events: {
            'tap .navbar-action.right:not(.custom)': 'onRightAction',
            'tap .navbar-action.left:not(.custom)': 'onLeftAction'
        },

        initialize: function (opt) {
            this.title = (opt.title) ? opt.title : '';
            this.left = (opt.left) ? opt.left : false;
            this.right = (opt.right) ? opt.right : false;
            this.baton = opt.baton;// || ext.Baton({ app: opt.app });
            this.extension = opt.extension;
            this.hiddenElements = [];
            this.rendered = false;

        },

        render: function () {

            this.$el.empty();
            this.rendered = true;
            ext.point(this.extension).invoke('draw', this, {
                left: this.left,
                right: this.right,
                title: this.title,
                baton: this.baton
            });

            // hide all hidden elements
            this.$el.find(this.hiddenElements.join()).hide();

            return this;
        },

        setLeft: function ($node) {
            this.left = $node;
            this.render();
            return this;
        },

        setTitle: function (title) {
            this.title = title;
            this.render();
            return this;
        },

        setRight: function ($node) {
            this.right = $node;
            this.render();
            return this;
        },

        onRightAction: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.trigger('rightAction');
        },

        onLeftAction: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.trigger('leftAction');
        },

        hide: function (elem) {
            this.hiddenElements.push(elem);
            this.hiddenElements = _.uniq(this.hiddenElements);
            this.render();
            return this;
        },

        show: function (elem) {
            this.hiddenElements = _.without(this.hiddenElements, elem);
            this.render();
            return this;
        },

        setBaton: function (baton) {
            this.baton = baton;
            this.render();
            return this;
        },

        toggle: function (state) {
            this.$el.toggle(state);
        }
    });

    /*
     * Toolbars
     * Will be placed at the bottom of a page to
     * hold one ore more action icons/links
     */
    var ToolbarView = BarView.extend({

        initialize: function (opt) {
            this.page = opt.page;
            this.baton = opt.baton;// || ext.Baton({ app: opt.app });
            this.extension = opt.extension;
        },
        render: function () {
            this.$el.empty();
            ext.point(this.extension + '/' + this.page).invoke('draw', this.$el, this.baton);
            return this;
        },
        setBaton: function (baton) {
            this.baton = baton;
            this.render();
            return this;
        }
    });

    return {
        BarView: BarView,
        NavbarView: NavbarView,
        ToolbarView: ToolbarView
    };

});
