/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
*
* © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

define('io.ox/backbone/mini-views/listutils', [], function () {

'use strict';

var appendIconText = function (target, text, type, activeColor) {
    if (type === 'color') {
        if (_.device('smartphone')) {
            return $(target).addClass('widget-color-' + activeColor).append($('<i class="fa fa-tint">').css('font-size', '20px'));
        } else {
            return target.text(text);
        }
    } else {
        if (_.device('smartphone')) {
            var iconClass = (type === 'edit' ? 'fa fa-pencil' : 'fa fa-power-off');
            return $(target).append($('<i>').addClass(iconClass).css('font-size', '20px'));
        } else {
            return target.text(text);
        }
    }
},
    widgetTitle = function (title) {
        return $('<span class="widget-title pull-left">').text(title);
    },
    widgetControlls = function () {
        return $('<div class="widget-controls">');
    },
    controlsDelete = function (title, label, id) {
        var control = id !== 0 ?
        // trash icon
        $('<a class="remove">').attr({
            href: '#',
            tabindex: 1,
            role: 'button',
            title: title,
            'data-action': 'delete',
            'aria-label': title + ', ' + label
        })
        .append($('<i class="fa fa-trash-o">')) :
    // empty dummy
        $('<a class="remove" style="display: none">').attr({
            href: '#',
            tabindex: -1,
            role: 'button',
            title: title,
            'aria-label': title + ', ' + label
        })
        .append($('<i class="fa fa-trash-o" >'));
        return control;
    },
    controlsEdit = function (title, label, action) {
        return $('<a class="action">').text(label).attr({
            href: '#',
            tabindex: 1,
            role: 'button',
            title: label,
            'data-action': action ? action : 'edit',
            'aria-label': title + ', ' + label
        });
    },
    controlsToggle = function (label) {
        var label = label ? label : '';
        return $('<a class="action">').text(label).attr({
            href: '#',
            tabindex: 1,
            role: 'button',
            'data-action': 'toggle'
        });
    },
    dragHandle = function (title, label, statusClass) {
        return $('<a>').addClass('drag-handle ' + statusClass)
        .attr({
            href: '#',
            'title': title,
            'aria-label': label,
            role: 'button',
            tabindex: 1
        })
        .append($('<i class="fa fa-bars">'))
        .on('click', $.preventDefault);
    },
    controlProcessSub = function (title, label, faClass) {
        return $('<a>').append($('<i/>').addClass('fa ' + faClass)).attr({
            title: label,
            href: '#',
            role: 'button',
            'data-action': 'toogleProcessSub',
            tabindex: 1,
            'aria-label': title + ', ' + label
        });
    };

return {
        appendIconText: appendIconText,
        widgetTitle: widgetTitle,
        widgetControlls: widgetControlls,
        controlsDelete: controlsDelete,
        controlsEdit: controlsEdit,
        controlsToggle: controlsToggle,
        dragHandle: dragHandle,
        controlProcessSub: controlProcessSub
    };
});
