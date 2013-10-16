/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/view-main',
    ['io.ox/core/extensions',
     'io.ox/backbone/views',
     'io.ox/calendar/edit/template'
    ], function (ext, views) {

    'use strict';

    var CommonView = views.point('io.ox/calendar/edit/section').createView({
        tagName: 'div',
        className: 'io-ox-calendar-edit container-fluid default-content-padding',
        render: function () {
            var self = this;
            var rows = [];
            var rowPerExtensionId = {};

            if (_.device('smartphone')) {
                ext.point('io.ox/calendar/edit/section/buttons').disable('save');
                ext.point('io.ox/calendar/edit/section/buttons').disable('discard');
            }

            ext.point('io.ox/calendar/edit/section/header').invoke('draw', self.$el, self.baton);

            this.point.each(function (extension) {
                var row = null;
                if (extension.nextTo) {
                    row = rowPerExtensionId[extension.nextTo];
                    if (!row) {
                        row = [];
                        rows.push(row);
                    }
                } else {
                    row = [];
                    rows.push(row);
                }
                rowPerExtensionId[extension.id] = row;
                row.push(extension);
            });
            _(rows).each(function (row) {
                var $rowNode = $('<div class="row-fluid">').appendTo(self.$el);
                _(row).each(function (extension) {
                    $rowNode.addClass(extension.rowClass || '');
                    extension.invoke('draw', $rowNode, self.baton);
                });
            });

            if (_.device('smartphone')) {
                ext.point('io.ox/calendar/edit/bottomToolbar').invoke('draw', self.$el, self.baton);
            }
            return this;
        }
    });

    return CommonView;
});
