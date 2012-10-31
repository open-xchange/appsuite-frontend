/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/birthdays/register',
    ['io.ox/core/extensions', 'io.ox/contacts/api', 'io.ox/core/date', 'io.ox/contacts/util', 'gettext!plugins/portal', 'less!plugins/portal/birthdays/style.css'], function (ext, api, date, util, gt) {
    'use strict';
    ext.point("io.ox/portal/widget").extend({
        id: 'birthdays',
        index: 950,
        title: gt('Next birthdays'),
        load: function () {
            var start = _.now(),
                end = start + 30 * 24 * 60 * 60 * 1000;
            return api.birthdays(start, end);
        },
        draw: function (contacts) {
            var $list = $('<ul class="io-ox-portal-birthdays">');
            
            $('<h2>').text(gt('Upcoming birthdays')).appendTo(this);
            $list.appendTo(this);

            var duplicates = [];
            if (contacts.length === 0) {
                $('<li>').text(gt('No birthdays within the next 2 weeks.')).appendTo($list);
            }
            _(contacts).each(function (contact) {
                var birthday = new date.Local(date.Local.utc(contact.birthday)).format(date.DATE),
                    name = util.getDisplayName(contact);
                if (! _(duplicates).include(name)) {
                    $('<li>').text(gt('%1$s on %2$s', name, birthday)).appendTo($list);
                    duplicates.push(name);
                }
            });
            return $.Deferred().resolve();
        },
        preview: function () {
            var $list = $('<ul class="io-ox-portal-birthdays">'),
                start = _.now(),
                end = start + 14 * 24 * 60 * 60 * 1000;

            $list.append($('<li>').text(gt('No birthdays within the next 2 weeks.')));

            api.birthdays(start, end).done(function (data) {
                var duplicates = [];
                if (data.length > 0) {
                    $list.empty();
                }
                _(data).each(function (contact) {
                    var birthday = new date.Local(date.Local.utc(contact.birthday)).format(date.DATE),
                        name = util.getDisplayName(contact);
                    if (! _(duplicates).include(name)) {
                        $('<li>').text(gt('%1$s on %2$s', name, birthday)).appendTo($list);
                        duplicates.push(name);
                    }
                });
            });
            return $list;
        }
    });
});