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
    ['io.ox/core/extensions',
     'io.ox/contacts/api',
     'io.ox/core/date',
     'io.ox/contacts/util',
     'gettext!plugins/portal',
     'less!plugins/portal/birthdays/style.css'], function (ext, api, date, util, gt) {

    'use strict';

    var WEEKS = 4,
        RANGE = WEEKS * 7 * 24 * 60 * 60 * 1000,
        sidepopup;

    ext.point("io.ox/portal/widget").extend({
        id: 'birthdays',
        index: 950,
        title: gt('Next birthdays'),
        load: function () {
            var start = _.now(),
                end = start + RANGE;
            return api.birthdays(start, end);
        },
        draw: function (contacts) {

            var duplicates = {}, $list;

            $list = $('<div class="io-ox-portal-birthdays">').append(
                $('<h1>').text(gt('Next birthdays'))
            );
            
            if (contacts.length === 0) {
                $list.append(
                    $('<div>').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                // add buy-a-gift link
                $list.append(
                    $('<div class="buy-a-gift">').append(
                        $('<i class="icon-gift">'), $.txt(' '),
                        $('<a href="http://www.amazon.de/" target="_blank">').text(gt('Buy a gift'))
                    )
                );
                // loop
                _(contacts).each(function (contact) {
                    var birthday = new date.Local(date.Local.utc(contact.birthday)).format(date.DATE),
                        name = util.getDisplayName(contact);
                    if (!(name in duplicates)) {
                        $list.append(
                            $('<div class="birthday">').data('contact', contact).append(
                                api.getPicture(contact, { width: 48, height: 48, scaleType: 'cover' }).addClass('picture'),
                                $('<div class="name">').text(_.noI18n(name)),
                                $('<div class="date">').text(_.noI18n(birthday))
                            )
                        );
                        duplicates[name] = true;
                    }
                });
                // init sidepopup
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    sidepopup = sidepopup || new dialogs.SidePopup({ modal: false });
                    sidepopup.delegate($list, '.birthday', function (popup, e, target) {
                        var data = target.data('contact');
                        require(['io.ox/contacts/view-detail'], function (view) {
                            api.get(api.reduce(data)).done(function (data) {
                                popup.append(view.draw(data));
                            });
                        });
                    });
                });
            }
            this.append($list);
            return $.Deferred().resolve();
        },
        preview: function () {
            var $list = $('<ul class="io-ox-portal-birthdays">'),
                start = _.now(),
                end = start + RANGE;

            $list.append($('<li>').text(gt('No birthdays within the next %1$d weeks', WEEKS)));

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