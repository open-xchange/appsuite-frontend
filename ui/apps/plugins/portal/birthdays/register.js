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

define('plugins/portal/birthdays/register', [
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'gettext!plugins/portal',
    'settings!io.ox/core',
    'less!plugins/portal/birthdays/style'
], function (ext, api, util, gt, settings) {

    'use strict';

    var WEEKS = 12,
        sidepopup;

    function unifySpelling(name) {
        // lowercase & transform umlauts
        return String(name).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    }

    function cid(name, birthday) {
        return unifySpelling(name) + ':' + birthday.format('YYYYMMDD');
    }

    function markDuplicate(name, birthday, hash) {
        hash[cid(name, birthday)] = true;
    }

    function isDuplicate(name, birthday, hash) {
        return cid(name, birthday) in hash;
    }

    // use same code to get the date (see bug 50414)
    function getBirthday(contact) {
        // birthday comes along in utc, so moment.utc(t); not moment(t).utc(true)
        return moment.utc(contact.birthday).startOf('day');
    }

    ext.point('io.ox/portal/widget/birthdays').extend({

        title: gt('Birthdays'),

        initialize: function (baton) {
            api.on('update create delete', function () {
                //refresh portal
                require(['io.ox/portal/main'], function (portal) {
                    var portalApp = portal.getApp(),
                        portalModel = portalApp.getWidgetCollection()._byId[baton.model.id];
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });

            });
        },

        load: function (baton) {
            var start = moment().utc(true).startOf('day').subtract(1, 'day');
            return api.birthdays({
                start: start.valueOf(),
                end: start.add(WEEKS, 'weeks').valueOf(),
                right_hand_limit: 25
            }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {
            var $list = $('<ul class="content list-unstyled io-ox-portal-birthdays" tabindex="0">'),
                hash = {},
                contacts = baton.data,
                numOfItems = _.device('smartphone') ? 5 : 8;

            // ignore broken birthdays
            contacts = _(contacts).filter(function (contact) {
                // null, undefined, empty string
                // 0 is valid (1.1.1970)
                return _.isNumber(contact.birthday);
            });

            if (contacts.length === 0) {
                $list.append(
                    $('<li class="line no-padding">').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                $list.addClass('pointer')
                    .attr({
                        'role': 'button',
                        'aria-label': gt('Press [enter] to jump to complete list of Birthdays.')
                    });
                _(contacts.slice(0, numOfItems)).each(function (contact) {
                    //just to be sure hours are the same
                    var birthday = getBirthday(contact),
                        birthdayText = '',
                        //it's not really today, its today in the year of the birthday
                        today = moment().utc(true).startOf('day').year(birthday.year()),
                        name = util.getFullName(contact);
                    if (birthday.isSame(today, 'day')) {
                        //today
                        birthdayText = gt('Today');
                    } else if (birthday.diff(today, 'day') === 1) {
                        //tomorrow
                        birthdayText = gt('Tomorrow');
                    } else if (birthday.diff(today, 'day') === -1) {
                        //yesterday
                        birthdayText = gt('Yesterday');
                    } else {
                        birthdayText = util.getBirthday(birthday);
                    }

                    if (!isDuplicate(name, birthday, hash)) {
                        $list.append(
                            $('<li class="item">').append(
                                api.pictureHalo(
                                    $('<div class="picture">').text(util.getInitials(contact)),
                                    contact,
                                    { width: 32, height: 32, fallback: false }
                                ),
                                $('<div class="bold ellipsis">').text(name).prepend(
                                    birthday.isSame(today, 'day') ? $('<div class="cake">').append('<i class="fa fa-birthday-cake">') : $()
                                ),
                                $('<div class="accent">').text(birthdayText)
                            )
                        );
                        markDuplicate(name, birthday, hash);
                    }
                });
            }

            this.append($list);
        },

        draw: function (baton) {

            var hash = {}, $list;

            $list = $('<div class="io-ox-portal-birthdays">').append(
                $('<h1>').text(gt('Birthdays'))
            );

            if (baton.data.length === 0) {
                $list.append(
                    $('<div>').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                // Don't use customLocations if users can overwrite it. Those are only supposed to be changed by administrators, in which case they can be trusted
                // add buy-a-gift
                var url = !settings.isConfigurable('customLocations/buy-a-gift') && settings.get('customLocations/buy-a-gift') || 'http://www.amazon.com/';
                if (url !== 'none' && url !== '') {
                    $list.append(
                        $('<div class="buy-a-gift">').append(
                            $('<a>', { href: url.trim(), target: '_blank', title: gt('External link') }).text(gt('Buy a gift')),
                            $.txt(' '),
                            $('<i class="fa fa-external-link" aria-hidden="true">')
                        )
                    );
                }

                // loop
                _(baton.data).each(function (contact) {

                    var birthday = getBirthday(contact),
                        // we use fullname here to avoid having duplicates like "Jon Doe" and "Doe, Jon"
                        name = util.getFullName(contact),
                        now = moment();

                    if (!isDuplicate(name, birthday, hash)) {

                        var nextBirthday = now.clone().month(birthday.month()).date(birthday.date()),
                            delta = nextBirthday.diff(now, 'day');
                        //avoid negative deltas to not display negative days till birthday (-300 for example)
                        //delta -1 is ok, we display this as yesterday
                        if (delta < -1) {
                            //increase Birthday by one year to be sure it's in the future and calculate again
                            //we don't just do a + 365 days here because we we don't know if it's a leapyear
                            nextBirthday.add(1, 'year');
                            delta = nextBirthday.diff(now, 'day');
                        }
                        /*eslint no-nested-ternary: 0*/
                        delta = delta === 0 ? gt('Today') : delta === 1 ? gt('Tomorrow') : delta === -1 ? gt('Yesterday') : gt('In %1$d days', Math.ceil(delta));

                        $list.append(
                            $('<div class="birthday" tabindex="0">').data('contact', contact).append(
                                api.pictureHalo(
                                    $('<div class="picture">'),
                                    contact,
                                    { width: 48, height: 48 }
                                ),
                                $('<div class="name">').text(name),
                                $('<div>').append(
                                    $('<span class="date">').text((birthday.year() === 1 || birthday.year() === 1604) ? birthday.formatCLDR('Md') : birthday.format('l')), $.txt(' '),
                                    $('<span class="distance">').text(delta)
                                )
                            )
                        );
                        markDuplicate(name, birthday, hash);
                    }
                });
                // init sidepopup
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    sidepopup = sidepopup || new dialogs.SidePopup({ modal: false, tabTrap: true });
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
        }
    });

    ext.point('io.ox/portal/widget/birthdays/settings').extend({
        title: gt('Birthdays'),
        type: 'birthdays',
        editable: false,
        unique: true
    });
});
