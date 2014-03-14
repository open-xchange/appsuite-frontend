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

define('io.ox/mail/navbarViews', ['io.ox/core/extensions',  'gettext!io.ox/mail'], function (ext) {

    'use strict';

    //var pNav = ext.point('io.ox/mail/mobile/navbar');
        //pTool = ext.point('io.ox/mail/mobile/toolbar');

    ext.point('io.ox/mail/mobile/navbar').extend({
        id: 'btn-left',
        index: 100,
        draw: function (baton) {
            this.$el.append(
                $('<div class="navbar-action left">').append(
                    $('<a>').append(
                        $('<i class="fa fa-chevron-left">'),
                        baton.left
                    ).on('tap', function (e) {
                        e.preventDefault();
                        baton.app.pages.goBack();
                    })
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
        draw: function () {
           //noting
        }
    });

    var BarView = Backbone.View.extend({
        tagName: 'div',
        className: 'toolbar-content'
    });


    var NavbarView = BarView.extend({

        left: 'Back',
        right: 'Foo',
        title: 'FooBar',

        initialize: function (opt) {
            console.log('init Navbar', opt);
            this.el = opt.el;
            this.app = opt.app;
            this.left = opt.left;
            this.right = opt.right;
        },

        render: function () {
            this.$el.empty();
            ext.point('io.ox/mail/mobile/navbar').invoke('draw', this, {
                left: this.left,
                right: this.right,
                title: this.title,
                app: this.app
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
        }
    });

    var ToolbarView = BarView.extend({
        initialize: function () {
            console.log('init Toolbar');
        },
        render: function () {
            console.log('rendering Toolbar');
            ext.point('io.ox/mail/mobile/toolbar').invoke('draw', this);
            return this;
        }
    });


    return {
        BarView: BarView,
        NavbarView: NavbarView,
        ToolbarView: ToolbarView
    };

});
