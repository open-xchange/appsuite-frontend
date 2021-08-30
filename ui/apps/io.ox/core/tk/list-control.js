/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

        // on container resize
        applySizeConstraints: function () {
            // don't save for list layout, doesn't make sense and breaks it for other layouts
            if (this.listView.app.props.get('layout') === 'list') return;
            // do nothing, if element is not visible, can't calculate sizes in this case
            if (!this.$el.is(':visible')) return;

            var left = this.$el.parent(),
                right = left.siblings('.rightside'),
                container = left.parent(),
                isVertical = this.$('.resizebar.vertical').is(':visible');

            if (right.length === 0) return;
            var total = isVertical ?
                    getMinimal(left.height() + right.height(), container.height()) :
                    getMinimal(left.width() + right.width(), container.width()),
                min = getLimit(isVertical ? ListViewControl.minHeight : ListViewControl.minWidth, total),
                max = getLimit(isVertical ? ListViewControl.maxHeight : ListViewControl.maxWidth, total),
                base = isVertical ? left.height() : left.width(),
                size = Math.max(min, Math.min(base, max));

            if ((isVertical && left.height() === size) || (!isVertical && left.width() === size)) return;

            left.css(isVertical ? 'height' : 'width', size);
            right.css(isVertical ? 'top' : 'left', size);

            storeSize(this.listView.app, size, isVertical ? 'height' : 'width');
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
            // there is no right side so there is no need to resize, causes strange behavior, see Bug 38186
            if (right.length === 0) {
                return;
            }
            $(document).on({
                'mousemove.resize': function (e) {
                    // if moved inside of an iframe we need to add the iframe's offset to get the correct coordinates. May happen for mail detail view for example
                    if ($(e.target).is('iframe')) {
                        width = Math.max(min, Math.min($(e.target).offset().left + e.pageX - base, max));
                    } else {
                        width = Math.max(min, Math.min(e.pageX - base, max));
                    }
                    left.css('width', width);
                    right.css('left', width);
                },
                'mouseup.resize': function () {
                    $(this)
                        .off('mousemove.resize mouseup.resize')
                        // trigger generic resize event so that other components can respond to it
                        .trigger('resize');
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
            // there is no right side so there is no need to resize, causes strange behavior, see Bug 38186
            if (right.length === 0) {
                return;
            }
            $(document).on({
                'mousemove.resize': function (e) {
                    height = Math.max(min, Math.min(e.pageY - base, max));
                    left.css('height', height);
                    right.css('top', height);
                },
                'mouseup.resize': function () {
                    $(this)
                        .off('mousemove.resize mouseup.resize')
                        // trigger generic resize event so that other components can respond to it
                        .trigger('resize');
                    storeSize(app, height, 'height');
                }
            });
        },

        resizable: function () {
            // ignore touch devicess
            if (_.device('touch')) return;
            this.$el.append('<div class="resizebar">');
            this.$el.append('<div class="resizebar vertical">');
            var win = this.listView.app.getWindow();
            $(window).on('resize.list-control-' + win.id, _.debounce(this.applySizeConstraints.bind(this), 100));
            win.one('beforequit', function () {
                $(window).off('resize.list-control-' + win.id);
            });
        },

        initialize: function (options) {
            this.listView = options.listView;
            this.id = options.id || 'default';
            this.options = options;
        },

        render: function () {
            var top = $('<ul class="toolbar generic-toolbar top" role="toolbar">'),
                topPoint = ext.point(this.id + '/list-view/toolbar/top'),
                bottom = $('<ul class="toolbar generic-toolbar visual-focus bottom" role="toolbar">'),
                bottomPoint = ext.point(this.id + '/list-view/toolbar/bottom'),
                baton = new ext.Baton({ view: this, app: this.options.app });

            if (topPoint.list().length) {
                this.$el.addClass('toolbar-top-visible');
                topPoint.invoke('draw', top, baton);
            }

            if (bottomPoint.list().length && _.device('!smartphone')) {
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

    function getMinimal() {
        // ignore undefined and 0
        return _.chain(arguments).toArray().compact().min().value();
    }

    return ListViewControl;
});
