/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 */

define('plugins/portal/birthdays/register',
    ['io.ox/core/extensions',
     'io.ox/contacts/api',
     'io.ox/core/date',
     'io.ox/contacts/util',
     'gettext!plugins/portal',
     'settings!io.ox/core',
     'less!plugins/portal/birthdays/style'
    ], function (ext, api, date, util, gt, settings) {

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

    ext.point('io.ox/portal/widget/birthdays').extend({

        title: gt('Birthdays'),

        load: function (baton) {
            var start = new date.UTC().setHours(0, 0, 0, 0).getTime() - date.DAY,
                end = start + WEEKS * date.WEEK;
            return api.birthdays({ start: start, end: end, right_hand_limit: 25 }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            var $list = $('<ul class="content list-unstyled" tabindex="1" role="button" aria-label="' +  gt('Press [enter] to jump to complete list of Birthdays.') + '">'),
                hash = {},
                contacts = baton.data,
                numOfItems = _.device('small') ? 5 : 15;

            // ignore broken birthdays
            contacts = _(contacts).filter(function (contact) {
                // null, undefined, empty string, 0 (yep 1.1.1970).
                return !!contact.birthday;
            });

            if (contacts.length === 0) {
                $list.append(
                    $('<li class="line">').text(gt('No birthdays within the next %1$d weeks', WEEKS))
                );
            } else {
                $list.addClass('pointer');
                _(contacts.slice(0, numOfItems)).each(function (contact) {
                    //just to be sure hours are the same
                    var birthday = new date.UTC(contact.birthday).setHours(0, 0, 0, 0),
                        birthdayText = '',
                        //it's not really today, its today in the year of the birthday
                        today = new date.UTC().setHours(0, 0, 0, 0).setYear(birthday.getYear()),
                        name = util.getFullName(contact);

                    if (birthday.getTime() === today.getTime()) {
                        //today
                        birthdayText = gt('Today');
                    } else if (birthday.getTime() === today.getTime() + date.DAY) {
                        //tomorrow
                        birthdayText = gt('Tomorrow');
                    } else if (birthday.getTime() === today.getTime() - date.DAY) {
                        //yesterday
                        birthdayText = gt('Yesterday');
                    } else if (birthday.getYear() === 1) {
                        //Year 0 is special for birthdays without year (backend changes this to 1...)
                        birthdayText = birthday.format(date.DATE_NOYEAR);
                    } else {
                        birthdayText = birthday.format(date.DATE);
                    }

                    if (!isDuplicate(name, birthday, hash)) {
                        $list.append(
                            $('<li class="line">').append(
                                $('<span class="bold">').text(name), $.txt(' '),
                                $('<span class="accent">').text(_.noI18n(birthdayText))
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
                // add buy-a-gift
                var url = $.trim(settings.get('customLocations/buy-a-gift', 'http://www.amazon.com/')),
                    now = new date.Local();
                if (url !== 'none' && url !== '') {
                    $list.append(
                        $('<div class="buy-a-gift">').append(
                            $('<a>', { href: url, target: '_blank', title: gt('External link') }).text(gt('Buy a gift')),
                            $.txt(' '),
                            $('<i class="fa fa-external-link">')
                        )
                    );
                }
                // loop
                _(baton.data).each(function (contact) {
                    var birthday = new date.Local(date.Local.utc(contact.birthday)),
                        // we use fullname here to avoid having duplicates like "Jon Doe" and "Doe, Jon"
                        name = util.getFullName(contact);

                    if (!isDuplicate(name, birthday, hash)) {

                        var nextBirthday = new date.Local().setMonth(birthday.getMonth(), birthday.getDate()),
                            delta = nextBirthday.getDays() - now.getDays();

                        //avoid negative deltas to not display negative days till birthday (-300 for example)
                        //delta -1 is ok, we display this as yesterday
                        if (delta < -1) {
                            //increase Birthday by one year to be sure it's in the future and calculate again
                            //we don't just do a + 365 days here because we we don't know if it's a leapyear
                            nextBirthday.setYear(nextBirthday.getYear() + 1);
                            delta = nextBirthday.getDays() - now.getDays();
                        }
                        delta = delta === 0 ? gt('Today') : delta === 1 ? gt('Tomorrow') : delta === -1 ? gt('Yesterday') : gt('In %1$d days', Math.ceil(delta));

                        $list.append(
                            $('<div class="birthday" tabindex="1">').data('contact', contact).append(
                                api.pictureHalo(
                                    $('<div class="picture">'),
                                    $.extend(contact, { width: 48, height: 48, scaleType: 'cover' })
                                ),
                                $('<div class="name">').text(_.noI18n(name)),
                                $('<div>').append(
                                    $('<span class="date">').text(_.noI18n(birthday.format(birthday.getYear() === 1 ? date.DATE_NOYEAR : date.DATE))), $.txt(' '),
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
