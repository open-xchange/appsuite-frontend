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
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
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
        widgetControlls: function () {
            console.warn('This is only user for old lists. Please use "io.ox/backbone/mini-views/settings-list-view" or "listutils.makeControls" instead.');
            return $('<div class="widget-controls">');
        },
        makeControls: function () {
            return $('<div class="list-item-controls">');
        },
        controlsDelete: function (opt) {
            opt = _.extend({
                href: '#',
                role: 'button',
                'data-action': 'delete',
                title: gt('Delete')
            }, opt);
            return $('<a class="remove">')
                .attr(opt)
                .append($('<i class="fa fa-trash-o" aria-hidden="true">'));
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
        dragHandle: function (title, statusClass) {
            return $('<a href="#" tabindex="-1" role="button" aria-hidden="true">').addClass('drag-handle ' + statusClass).attr('title', title).append(
                    $('<i class="fa fa-bars" aria-hidden="true">')
                ).on('click', $.preventDefault);
        },
        controlProcessSub: function (opt) {
            opt = _.extend({
                href: '#',
                role: 'button',
                'data-action': 'toggle-process-subsequent',
                title: gt('Process subsequent rules')
            }, opt);
            return $('<a>').append($('<i>').addClass('fa ' + opt.faClass)).attr(_.omit(opt, 'faClass'));
        },
        drawError: function (account) {
            if (!account || !account.get('hasError')) return '';

            return $('<div class="error-message">').text(account.get('error'));
        }
    };
});
