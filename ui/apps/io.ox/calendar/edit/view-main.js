/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/view-main',
       ['io.ox/core/extensions',
       'io.ox/backbone/views',
       'io.ox/calendar/edit/template'], function (ext, views) {

    'use strict';

    var CommonView = views.point('io.ox/calendar/edit/section').createView({
        tagName: 'div',
        className: 'io-ox-calendar-edit container-fluid',
        render: function () {
            var self = this;
            var rows = [];
            var rowPerExtensionId = {};

            ext.point('io.ox/calendar/edit/section/title').invoke("draw", self.$el, self.baton);
            ext.point('io.ox/calendar/edit/section/buttons').invoke("draw", self.$el, self.baton);

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
                    extension.invoke("draw", $rowNode, self.baton);
                });
            });

            return this;
        }
    });

    return CommonView;
});
