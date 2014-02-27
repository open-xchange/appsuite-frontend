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

    var ListViewControl = Backbone.View.extend({

        className: 'abs list-view-control',

        events: {
            'mousedown .resizebar': 'onResize'
        },

        onResize: function (e) {
            e.preventDefault();
            var left = this.$el.parent(),
                right = left.siblings('.rightside'),
                base = e.pageX - left.width(),
                limitX = $(document).width() - 250;
            $(document).on({
                'mousemove.resize': function (e) {
                    var width = Math.max(250, Math.min(e.pageX, limitX) - base);
                    left.css('width', width);
                    right.css('left', width);
                },
                'mouseup.resize': function () {
                    $(this).off('mousemove.resize mouseup.resize');
                }
            });
        },

        resizable: function () {
            // ignore touch devicess
            if (_.device('touch')) return;
            this.$el.append('<div class="resizebar">');
        },

        initialize: function (options) {
            this.listView = options.listView;
            this.id = options.id || 'default';
            this.options = options;
        },

        render: function () {

            var top = $('<nav class="toolbar top">'),
                topPoint = ext.point(this.id + '/list-view/toolbar/top'),
                bottom = $('<nav class="toolbar bottom">'),
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

            this.$el.append(top, this.listView.render().$el.addClass('abs'), bottom);

            return this;
        }
    });

    return ListViewControl;
});
