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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/util',
    ['io.ox/core/extensions',
     'io.ox/core/date',
     'io.ox/core/api/account',
     'io.ox/core/capabilities',
     'settings!io.ox/mail',
     'settings!io.ox/contacts',
     'gettext!io.ox/core'], function (ext, date, accountAPI, capabilities, settings, contactsSetting, gt) {

    'use strict';

    var that,
        format = _.printf,
        MINUTE = 60 * 1000,
        HOUR = MINUTE * 60,

        ngettext = function (s, p, n) {
            return n > 1 ? p : s;
        },

        fnClickPerson = function (e) {
            e.preventDefault();
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, e.data, e);
            });
        },

        getDateFormated = function (timestamp, options) {
            var opt = $.extend({ fulldate: true, filtertoday: true }, options || {}),
                now = new date.Local(),
                d = new date.Local(timestamp),
                timestr = function () {
                    return d.format(date.TIME);
                },
                datestr = function () {
                    return d.format(date.DATE) + (opt.fulldate ? ' ' + timestr() : '');
                },
                isSameDay = function () {
                    return d.getDate() === now.getDate() &&
                        d.getMonth() === now.getMonth() &&
                        d.getYear() === now.getYear();
                };
            return isSameDay() && opt.filtertoday ? timestr() : datestr();
        },


        // regex: split list at non-quoted ',' or ';'
        rRecipientList = /([^,;"]+|"(\\.|[^"])+")+/,
        // regex: remove delimiters/spaces
        rRecipientCleanup = /^[,;\s]+/,
        // regex: process single recipient
        rRecipient = /^("(\\.|[^"])+"\s|[^<]+)(<[^\>]+\>)$/,
        // regex: remove < > from mail address
        rMailCleanup = /(^<|>$)/g,
        // regex: remove special characters from telephone number
        rTelephoneCleanup = /[^0-9+]/g,
        // regex: used to identify phone numbers
        rNotDigitAndAt = /[^A-Za-z@]/g,
        // regex: clean up display name
        rDisplayNameCleanup = /(^["'\\\s]+|["'\\\s]+$)/g,

        // mail addresses hash
        addresses = {};

    accountAPI.getAllSenderAddresses().done(function (sendAddresses) {
        _(sendAddresses).chain().pluck(1).each(function (address) {
            addresses[address.toLowerCase()] = true;
        });
    });


    that = {

        /**
         * currently registred types
         * @example: { MSISND : '/TYPE=PLMN' }
         * @return {array} list of types
         */
        getChannelSuffixes: (function () {
            //important: used for global replacements so keep this value unique
            var types = { msisdn: contactsSetting.get('msisdn/suffix', '/TYPE=PLMN') };
            return function () {
                return types;
            };
        }()),

        /**
         * identify channel (email or phone)
         * @param  {string} value
         * @param  {boolean} check for activated cap first (optional: default is true)
         * @return {string} channel
         */
        getChannel: function (value, check) {
            //default value
            check = check || typeof check === 'undefined';
            var type = value.indexOf(that.getChannelSuffixes().MSISDN) > -1,
                //no check OR activated cap
                setting = !(check) || capabilities.has('msisdn'),
                //no '@' AND no alphabetic digit AND at least one numerical digit
                phoneval = function () {
                            return value.replace(rNotDigitAndAt, '').length === 0 &&
                                   value.replace(rTelephoneCleanup, '').length > 0;
                        };
            return type || (setting && phoneval()) ? 'phone' : 'email';
        },

        cleanupPhone: function (phone) {
            return phone.replace(rTelephoneCleanup, '');
        },

        parseRecipient: function (s) {
            var recipient = $.trim(s), match, name, target;
            if ((match = recipient.match(rRecipient)) !== null) {
                // case 1: display name plus email address / telephone number
                if (that.getChannel(match[3]) === 'email') {
                    target = match[3].replace(rMailCleanup, '').toLowerCase();
                } else {
                    target = that.cleanupPhone(match[3]);
                }
                name = match[1].replace(rDisplayNameCleanup, '');
            } else {
                // case 2: assume plain email address / telephone number
                if (that.getChannel(recipient) === 'email') {
                    target = recipient.replace(rMailCleanup, '').toLowerCase();
                    name = target.split(/@/)[0];
                } else {
                    name = target = that.cleanupPhone(recipient);
                }
            }
            return [name, target];
        },

        /**
         * remove typesuffix from sender/reciepients
         * @param  {object|string} mail
         * @return {undefined}
         */
        removeChannelSuffix: !capabilities.has('msisdn') ? _.identity :
            function (mail) {
                var types = that.getChannelSuffixes(),
                    //remove typesuffx from string
                    remove = function (value) {
                        _.each(types, function (type) {
                            value = value.replace(new RegExp(type, 'ig'), '');
                        });
                        return value;
                    };
                if (!_.isEmpty(types)) {
                    if (_.isString(mail)) {
                        mail = remove(mail);
                    } else if (_.isObject(mail)) {
                        if (mail.from[0][1])
                            mail.from[0][1] = remove(mail.from[0][1]);
                        if (_.isArray(mail.to)) {
                            _.each(mail.to, function (recipient) {
                                recipient[1] = remove(recipient[1]);
                            });
                        }
                    }
                }
                return mail;
            },

        /**
         * Parse comma or semicolon separated list of recipients
         * Example: '"Doe, Jon" <jon@doe.foo>, "\'World, Hello\'" <hi@dom.tld>, urbi@orbi.tld'
         */
        parseRecipients: function (s) {
            var list = [], match, recipient;
            while ((match = s.match(rRecipientList)) !== null) {
                // look ahead for next round
                s = s.substr(match[0].length).replace(rRecipientCleanup, '');
                // get recipient
                recipient = this.parseRecipient(match[0]);
                //stupid workarround so exchange draft emails without proper mail adresses get displayed correctly
                //look Bug 23983
                var msExchange = recipient[0] === recipient[1];
                // add to list? (stupid check but avoids trash)
                if (msExchange || recipient[1].indexOf('@') > -1 || that.getChannel(recipient[1]) === 'phone') {
                    list.push(recipient);
                }
            }
            return list;
        },

        serializeList: function (data, field) {

            field = field || 'from';
            var list = data[field] || [['', '']],
                i = 0, $i = list.length,
                tmp = $('<div>'), obj, sender;

            for (; i < $i; i++) {
                obj = {
                    display_name: this.getDisplayName(list[i]),
                    email1: String(list[i][1] || '').toLowerCase()
                };
                $('<a>', { href: '#', title: obj.email1 })
                    .addClass('person-link person-' + field)
                    .css('whiteSpace', 'nowrap')
                    .text(_.noI18n(obj.display_name))
                    .data('person', obj)
                    .on('click', obj, fnClickPerson).css('cursor', 'pointer')
                    .appendTo(tmp);

                // add 'on behalf of'?
                if (field === 'from' && 'headers' in data && 'Sender' in data.headers) {
                    sender = this.parseRecipients(data.headers.Sender);
                    // only show if display names differ (otherwise it looks like a senseless duplicate)
                    if (sender[0][0] !== data.from[0][0]) {
                        tmp.prepend(
                            this.serializeList({ sender: sender }, 'sender'),
                            $.txt(_.noI18n(' ')),
                            //#. (From) email1 on behalf of email2. Appears in email detail view.
                            gt('on behalf of'),
                            $.txt(_.noI18n(' '))
                        );
                    }
                }

                if (i < $i - 1) {
                    tmp.append($('<span>').addClass('delimiter')
                        .append($.txt(_.noI18n('\u00A0\u00A0\u2022\u00A0 ')))); // '&nbsp;&nbsp;&bull;&nbsp; '
                }
            }
            return tmp.contents();
        },

        serializeAttachments: function (data, list) {
            var i = 0, $i = list.length, tmp = $(), filename = '', href = '';
            for (; i < $i; i++) {
                filename = list[i].filename || '';
                href = ox.apiRoot + '/mail?' + $.param({
                    action: 'attachment',
                    folder: data.folder_id,
                    id: data.id,
                    attachment: list[i].id,
                    delivery: 'download'
                });
                tmp = tmp.add(
                    $('<a>', { href: href, target: '_blank' })
                    .addClass('attachment-link').text(_.noI18n(filename))
                );
                if (i < $i - 1) {
                    tmp = tmp.add(
                        $('<span>').addClass('delimiter')
                            .append($.txt(_.noI18n('\u00A0\u2022 '))) // '&nbsp;&bull; '
                    );
                }
            }
            return tmp;
        },

        getDisplayName: function (pair) {
            if (!pair) {
                return '';
            }
            var name = pair[0], email = String(pair[1] || '').toLowerCase(),
                display_name = _.isString(name) ? name.replace(rDisplayNameCleanup, '') : '';
            return display_name || email;
        },

        // takes care of special edge-case: no from address
        hasFrom: function (data) {
            return data && _.isArray(data.from) && !!data.from[0][1];
        },

        getFrom: function (data, field) {
            field = field || 'from';
            var list = data[field] || [['', '']],
                dn = that.getDisplayName(list[0]);
            return $('<span>').addClass('person').text(_.noI18n(dn));
        },

        /**
         * Format the Sender field using display name and email
         *
         * @return the email address or a string like "Display Name" <email@address.example>
         */
        formatSender: function (name, address) {
            var args = _(arguments).toArray();
            if (_.isArray(args[0])) {
                name = args[0][0];
                address = args[0][1];
            }
            name = _.isString(name) ? name.replace(rDisplayNameCleanup, '') : '';
            address = $.trim(address || '').toLowerCase();
            return name === '' ? address : '"' + name + '" <' + address + '>';
        },

        getFlag: function (data) {
            return data.color_label || 0;
        },

        getPriority: function (data) {
            // normal?
            if (data.priority === 3) return $();
            var i = '<i class="icon-star"/>',
                stars = $('<span>').append(_.noI18n('\u00A0'), i, i, i);
            return stars.addClass(data.priority < 3 ? 'high' : 'low');
        },

        getAccountName: function (data) {
            // primary account?
            var id = window.unescape(data.id);
            return (/^default0/).test(id) ? gt('Primary account') : (data.account_name || 'N/A');
        },

        getTime: function (timestamp) {
            return getDateFormated(timestamp, { fulldate: false });
        },

        getDateTime: function (timestamp, options) {
            return getDateFormated(timestamp, options);
        },

        getFullDate: function (timestamp) {
            var t = new date.Local(date.Local.utc(timestamp));
            return t.format(date.DATE_TIME);
        },

        getSmartTime: function (timestamp) {
            var now = new Date(),
                zone = now.getTimezoneOffset(),
                time = now.getTime() - zone * 60 * 1000,
                delta = time - timestamp,
                d = new Date(timestamp),
                n = 0;
            // today?
            if (d.getDate() === now.getDate()) {
                if (delta < HOUR) {
                    n = Math.ceil(delta / MINUTE);
                    return '' + format(ngettext('%d minute ago', '%d minutes ago', n), n); /*i18n*/
                } else {
                    n = Math.ceil(delta / HOUR);
                    return '' + format(ngettext('%d hour ago', '%d hours ago', n), n); /*i18n*/
                }
            } else if (d.getDate() === now.getDate() - 1) {
                // yesterday
                return 'Yesterday';
            } else {
                return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
            }
        },

        count: function (data) {
            return _(data).reduce(function (memo, obj) {
                return memo + (obj.thread ? obj.thread.length : 1);
            }, 0);
        },

        isUnseen: function (data) {
            return (data.flags & 32) !== 32;
        },

        isDeleted: function (data) {
            return (data.flags & 2) === 2;
        },

        isSpam: function (data) {
            return (data.flags & 128) === 128;
        },

        isAnswered: function () {
            return _.chain(arguments).flatten().compact().reduce(function (memo, data) {
                return memo || (data.flags & 1) === 1;
            }, false).value();
        },

        isForwarded: function () {
            return _.chain(arguments).flatten().compact().reduce(function (memo, data) {
                return memo || (data.flags & 256) === 256;
            }, false).value();
        },

        byMyself: function (data) {
            return data.from && data.from.length && String(data.from[0][1] || '').toLowerCase() in addresses;
        },

        hasOtherRecipients: function (data) {
            var list = [].concat(data.to, data.cc, data.bcc);
            return 0 < _(list).reduce(function (memo, arr) {
                var email = String(arr[1] || '').toLowerCase();
                return memo + (email && !(email in addresses) ? 1 : 0);
            }, 0);
        },

        getInitialDefaultSender: function () {
            var mailArray = _(settings.get('defaultSendAddress', []));
            return mailArray._wrapped[0];
        },

        getAttachments: (function () {

            var isWinmailDATPart = function (obj) {
                return !('filename' in obj) && obj.attachments &&
                    obj.attachments.length === 1 && obj.attachments[0].content === null;
            };

            return function (data) {

                var i, $i, obj, dat, attachments = [],
                mail = { id: data.id, folder_id: data.folder_id };

                // get nested messages
                for (i = 0, $i = (data.nested_msgs || []).length; i < $i; i++) {
                    obj = data.nested_msgs[i];
                    // is wrapped attachment? (winmail.dat stuff)
                    if (isWinmailDATPart(obj)) {
                        dat = obj.attachments[0];
                        attachments.push(
                            _.extend({}, dat, { mail: mail, title: obj.filename || '' })
                        );
                    } else {
                        attachments.push({
                            id: obj.id,
                            content_type: 'message/rfc822',
                            filename: obj.filename ||
                                _.ellipsis((obj.subject || '').replace(/\s+/g, ' '), 50), // remove consecutive white-space
                            title: obj.filename || obj.subject || '',
                            mail: mail,
                            parent: data.parent || mail,
                            nested_message: _.extend({}, obj, { parent: mail })
                        });
                    }
                }

                // get non-inline attachments
                for (i = 0, $i = (data.attachments || []).length; i < $i; i++) {
                    obj = data.attachments[i];
                    if (obj.disp === 'attachment') {
                        attachments.push(
                            _.extend(obj, { mail: mail, title: obj.filename || '', parent: data.parent || mail })
                        );
                    }
                }

                return attachments;
            };
        }())
    };
    return that;
});
