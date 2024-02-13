/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/backbone/mini-views/listutils', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    return {
        appendIconText: function (target, text, type, activeColor) {
            target = $(target);
            // handle smartphones
            if (_.device('smartphone')) {
                var icon = $('<i>').css('font-size', '20px');
                target.empty().append(icon);
                if (type === 'color') {
                    target.addClass('widget-color-' + activeColor);
                    icon.addClass('fa fa-tint');
                } else {
                    icon.addClass(type === 'edit' ? 'fa fa-pencil' : 'fa fa-power-off');
                }
                return target;
            }
            return target.text(text);
        },
        widgetTitle: function (title) {
            console.warn('This is only user for old lists. Please use "io.ox/backbone/mini-views/settings-list-view" or "listutils.makeTitle" instead.');
            return $('<span class="widget-title pull-left">').text(title);
        },
        makeTitle: function (title) {
            return $('<span class="list-item-title">').text(title);
        },
        makeSubTitle: function (title, label) {
            return $('<div class="list-item-subtitle">').append(
                label ? $('<label>').text(label + ':') : $(),
                $('<span>').text(title)
            );
        },
        widgetControlls: function () {
            console.warn('This is only user for old lists. Please use "io.ox/backbone/mini-views/settings-list-view" or "listutils.makeControls" instead.');
            return $('<div class="widget-controls">');
        },
        makeControls: function () {
            return $('<div class="list-item-controls">');
        },
        controlsDelete: function (opt) {
            opt = _.extend({ title: gt('Delete') }, opt);
            return $('<a href="#" role="button" class="remove" data-action="delete">').attr('aria-label', opt.title)
                .append($('<i class="fa fa-trash-o" aria-hidden="true">').attr('title', opt.title));
        },
        controlsEdit: function (opt) {
            opt = _.extend({
                href: '#',
                role: 'button',
                label: gt('Edit'),
                'data-action': 'edit',
                'aria-label': gt('Edit')
            }, opt);
            return $('<a class="action">').text(opt.label).attr(_.omit(opt, 'label'));
        },
        controlsToggle: function (label) {
            label = label ? label : '';
            return $('<a href="#" role="button" data-action="toggle" class="action">').text(label);
        },
        applyToggle: function (label) {
            label = label ? label : '';
            return $('<a href="#" role="button" data-action="apply" class="action">').text(label);
        },
        dragHandle: function (title, statusClass) {
            return $('<a href="#" role="button" aria-pressed="false">').addClass('drag-handle ' + statusClass).attr('title', title).append(
                $('<i class="fa fa-bars" aria-hidden="true">')
            ).on('click', $.preventDefault);
        },
        controlProcessSub: function (opt) {
            opt = _.extend({
                title: gt('Process subsequent rules')
            }, opt);
            return $('<a href="#" role="button" data-action="toggle-process-subsequent" class="action">').attr('title', opt.title).append(
                $('<i class="fa" aria-hidden="true">').addClass(opt.faClass)
            );
        },
        drawError: function (account) {
            if (!account || !account.get('hasError')) return '';

            return $('<div class="error-message">').text(account.get('error'));
        },
        drawWarning: function (text) {
            return $('<div class="warning-message">').text(text);
        }
    };
});
