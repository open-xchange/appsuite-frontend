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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/list-control', ['io.ox/core/tk/list', 'io.ox/core/extensions'], function (list, ext) {

    'use strict';

    function storeSize(app, size, type) {
        if (size === undefined) {
            app.settings.remove('listview/' + type + '/' + _.display());
        } else {
            app.settings.set('listview/' + type + '/' + _.display(), size);
        }
        app.settings.save();
    }

    var ListViewControl = Backbone.View.extend({

        className: 'abs list-view-control',

        events: {
            'mousedown .resizebar:not(.vertical)': 'onResize',
            'mousedown .resizebar.vertical': 'onVerticalResize'
        },

        onResize: function (e) {
            e.preventDefault();
            var left = this.$el.parent(),
                right = left.siblings('.rightside'),
                base = e.pageX - left.width(),
                total = left.width() + right.width(),
                min = getLimit(ListViewControl.minWidth, total),
                max = getLimit(ListViewControl.maxWidth, total),
                app = this.listView.app,
                width;

            $(document).on({
                'mousemove.resize': function (e) {
                    width = Math.max(min, Math.min(e.pageX - base, max));
                    left.css('width', width);
                    right.css('left', width);
                },
                'mouseup.resize': function () {
                    $(this).off('mousemove.resize mouseup.resize');
                    storeSize(app, width, 'width');
                }
            });
        },

        onVerticalResize: function (e) {
            e.preventDefault();
            var left = this.$el.parent(),
                right = left.siblings('.rightside'),
                base = e.pageY - left.height(),
                total = left.height() + right.height(),
                min = getLimit(ListViewControl.minHeight, total),
                max = getLimit(ListViewControl.maxHeight, total),
                app = this.listView.app,
                height;
            $(document).on({
                'mousemove.resize': function (e) {
                    height = Math.max(min, Math.min(e.pageY - base, max));
                    left.css('height', height);
                    right.css('top', height);
                },
                'mouseup.resize': function () {
                    $(this).off('mousemove.resize mouseup.resize');
                    storeSize(app, height, 'height');
                }
            });
        },

        resizable: function () {
            // ignore touch devicess
            if (_.device('touch')) return;
            this.$el.append('<div class="resizebar">');
            this.$el.append('<div class="resizebar vertical">');
        },

        initialize: function (options) {
            this.listView = options.listView;
            this.id = options.id || 'default';
            this.options = options;
        },

        render: function () {
            // aria-hidden used to allow sr to navigate to list itself via role 'navigation'
            var top = $('<div class="toolbar generic-toolbar top" role="toolbar" aria-hidden="true">'),
                topPoint = ext.point(this.id + '/list-view/toolbar/top'),
                bottom = $('<div class="toolbar generic-toolbar visual-focus bottom" role="toolbar">'),
                bottomPoint = ext.point(this.id + '/list-view/toolbar/bottom'),
                baton = new ext.Baton({ view: this, app: this.options.app });

            if (topPoint.list().length) {
                this.$el.addClass('toolbar-top-visible');
                topPoint.invoke('draw', top, baton);
            }

            if (bottomPoint.list().length) {
                this.$el.addClass('toolbar-bottom-visible');
                bottomPoint.invoke('draw', bottom, baton);
            }

            // add landmark role
            this.$el.attr({
                'role': 'navigation'
            }).append(top, this.listView.render().$el.addClass('abs'), bottom);

            return this;
        }
    });

    // Limits for manual resizing. All values are in pixels.
    // Negative values define the limit in terms of the .rightside element,
    // e.g. a maximum of -10 means the .rightside element has a minimum of 10.
    // Instead of a number, any value can be a function which returns a number.
    // The function will then be called at the start of each resize.
    // TODO: Use {min,max}-{width,height} CSS properties of the elements,
    // since this stuff actually belongs in a theme.
    ListViewControl.minWidth = 270;
    ListViewControl.maxWidth = -250;
    ListViewControl.minHeight = 150;
    ListViewControl.maxHeight = -100;

    function getLimit(limit, total) {
        if (typeof limit === 'function') limit = limit();
        if (limit < 0) limit += total;
        return limit;
    }

    return ListViewControl;
});
