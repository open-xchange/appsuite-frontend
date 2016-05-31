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
        widgetIcon: function (type) {
            var icon = $('<i class="widget-icon fa" aria-hidden="true">');
            switch (type) {
                case 'mail':
                    icon.addClass('fa-envelope');
                    break;
                case 'xing':
                    icon.addClass('fa-xing');
                    break;
                case 'twitter':
                    icon.addClass('fa-twitter');
                    break;
                case 'google':
                    icon.addClass('fa-google');
                    break;
                case 'yahoo':
                    icon.addClass('fa-yahoo');
                    break;
                case 'linkedin':
                    icon.addClass('fa-linkedin');
                    break;
                case 'dropbox':
                    icon.addClass('fa-dropbox');
                    break;
                case 'msliveconnect':
                    icon.addClass('fa-windows');
                    break;
                case 'boxcom':
                    // there is no fitting icon for box in fontawesome
                    icon.removeClass('fa');
                    icon.css({
                        'background-image': 'url(apps/themes/default/box_logo36.png)',
                        'background-size': 'cover',
                        height: '14px',
                        width: '14px',
                        'margin-top': '3px'
                    });
                    break;
                default:
                    icon.addClass('fa-circle');
                    break;
            }
            return icon;
        },
        widgetTitle: function (title) {
            return $('<span class="widget-title pull-left">').text(title);
        },
        widgetControlls: function () {
            return $('<div class="widget-controls">');
        },
        controlsDelete: function (opt) {
            opt = _.extend({
                href: '#',
                tabindex: 1,
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
                tabindex: 1,
                role: 'button',
                label: gt('Edit'),
                'data-action': 'edit',
                'aria-label': gt('Edit')
            }, opt);
            return $('<a class="action">').text(opt.label).attr(_.omit(opt, 'label'));
        },
        controlsToggle: function (label) {
            label = label ? label : '';
            return $('<a class="action">').text(label).attr({
                href: '#',
                tabindex: 1,
                role: 'button',
                'data-action': 'toggle'
            });
        },
        dragHandle: function (title, label, statusClass) {
            return $('<a>').addClass('drag-handle ' + statusClass)
            .attr({
                href: '#',
                'title': title,
                'aria-label': label,
                role: 'button',
                tabindex: 1
            })
            .append($('<i class="fa fa-bars" aria-hidden="true">'))
            .on('click', $.preventDefault);
        },
        controlProcessSub: function (opt) {
            opt = _.extend({
                href: '#',
                role: 'button',
                'data-action': 'toggle-process-subsequent',
                tabindex: 1,
                title: gt('Process subsequent rules')
            }, opt);
            return $('<a>').append($('<i>').addClass('fa ' + opt.faClass)).attr(_.omit(opt, 'faClass'));
        },
        drawError: function (account) {
            if (!account || !account.get('hasError')) {
                return '';
            }
            return $('<div class="account-error-message">').text(account.get('error'));
        }
    };
});
