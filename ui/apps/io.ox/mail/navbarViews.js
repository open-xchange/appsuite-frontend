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


define('io.ox/mail/navbarViews',
    ['io.ox/core/extensions',
    'gettext!io.ox/mail',
    'io.ox/mail/mobileToolbarActions'], function (ext) {


    'use strict';

    ext.point('io.ox/mail/mobile/navbar').extend({
        id: 'btn-left',
        index: 100,
        draw: function (baton) {

            if (!baton.left) return;

            this.$el.append(
                $('<div class="navbar-action left">').append(
                    $('<a>').append(
                        $('<i class="fa fa-chevron-left">'),
                        baton.left
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/mobile/navbar').extend({
        id: 'header',
        index: 200,
        draw: function (baton) {
            this.$el.append(
                $('<div class="navbar-title">').text(baton.title)
            );
        }
    });

    ext.point('io.ox/mail/mobile/navbar').extend({
        id: 'btn-right',
        index: 300,

        draw: function (baton) {
            if (!baton.right) return;
            this.$el.append(
                $('<div class="navbar-action right">').append(
                    $('<a>').append(
                        baton.right
                    )
                )
            );
        }
    });

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

        events: {
            'tap .navbar-action.right': 'onRightAction',
            'tap .navbar-action.left': 'onLeftAction'
        },

        initialize: function (opt) {
            this.app = opt.app;
            this.title = (opt.title) ? opt.title : '';
            this.left = (opt.left) ? opt.left : false;
            this.right = (opt.right) ? opt.right : false;
        },

        render: function () {

            this.$el.empty();

            ext.point('io.ox/mail/mobile/navbar').invoke('draw', this, {
                left: this.left,
                right: this.right,
                title: this.title
            });
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
        // TODO change to event based
        setRightAction: function (fn) {
            this.rightAction = fn;
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
        show: function (elem) {
            this.$el.find(elem).show();
            return this;
        },
        hide: function (elem) {
            this.$el.find(elem).hide();
            return this;
        }
    });


    /*
     * Toolbars
     * Will be placed at the bottom of a page to
     * hold one ore more action icons/links
     */
    var ToolbarView = BarView.extend({

        initialize: function (opt) {
            this.app = opt.app;
            this.page = opt.page;
            this.baton = opt.baton || ext.Baton({});
        },
        render: function () {
            this.$el.empty();
            ext.point('io.ox/mail/mobile/toolbar/' + this.page).invoke('draw', this.$el, this.baton);
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
