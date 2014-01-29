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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/util',
    ['io.ox/core/extensions',
     'io.ox/core/date',
     'io.ox/core/util',
     'io.ox/core/api/account',
     'io.ox/core/capabilities',
     'settings!io.ox/mail',
     'settings!io.ox/contacts',
     'gettext!io.ox/core'
    ], function (ext, date, util, accountAPI, capabilities, settings, contactsSetting, gt) {

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
            if (!_.isNumber(timestamp))
                return gt('unknown');
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

        trimAddress = function (address) {
            address = $.trim(address || '');
            // apply toLowerCase only for mail addresses, don't change phone numbers
            return address.indexOf('@') > -1 ? address.toLowerCase() : address;
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
            value = String(value || '');
            check = check || typeof check === 'undefined';
            var type = value.indexOf(that.getChannelSuffixes().msisdn) > -1,
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
                name = util.unescapeDisplayName(match[1]);
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
                    } else if (_.isArray(mail)) {
                        //array of nested mails
                        _.each(mail, function (message) {
                            message = that.removeChannelSuffix(message);
                        });
                    } else if (_.isObject(mail)) {
                        if (mail.from && _.isArray(mail.from[0]) && mail.from[0][1])
                            mail.from[0][1] = remove(mail.from[0][1]);
                        if (_.isArray(mail.to)) {
                            _.each(mail.to, function (recipient) {
                                recipient[1] = remove(recipient[1]);
                            });
                        }
                        ///nestedm mail
                        if (_.isArray(mail.nested_msgs)) {
                            _.each(mail.nested_msgs, function (message) {
                                message = that.removeChannelSuffix(message);
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
                if (obj.email1 !== 'undisclosed-recipients:;') {
                    $('<a>', { href: '#', title: obj.email1, tabindex: 1 })
                        .addClass('person-link person-' + field)
                        .text(_.noI18n(obj.display_name))
                        .data('person', obj)
                        .on('click', obj, fnClickPerson)
                        .appendTo(tmp);
                } else {
                    $('<span>').text(_.noI18n(obj.display_name)).appendTo(tmp);
                }

                // add 'on behalf of'?
                if (field === 'from' && 'headers' in data && 'Sender' in data.headers) {
                    sender = this.parseRecipients(data.headers.Sender);
                    // only show if display names differ (otherwise it looks like a senseless duplicate)
                    if (sender[0][0] !== data.from[0][0] && sender[0][1] !== data.from[0][1]) {
                        tmp.append(
                            $.txt(_.noI18n(' ')),
                            //#. (From) email1 via email2. Appears in email detail view.
                            gt('via'),
                            $.txt(_.noI18n(' ')),
                            this.serializeList({ sender: sender }, 'sender')
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

            if (!_.isArray(pair)) return '';

            var name = pair[0],
                email = String(pair[1] || '').toLowerCase(),
                display_name = util.unescapeDisplayName(name);

            return display_name || email;
        },

        // takes care of special edge-case: no from address
        hasFrom: function (data) {
            return data && _.isArray(data.from) && data.from.length > 0 && !!data.from[0][1];
        },

        getFrom: function (data, field) {
            field = field || 'from';
            var list = data[field] || [['', '']],
                dn = that.getDisplayName(list[0]);
            if (field === 'to' && dn === '') {
                dn = gt('No recipients');
            } else {
                dn = _.noI18n(dn);
            }
            return $('<span class="person">').text(dn);
        },

        /**
         * Format the Sender field using display name and email
         *
         * @return the email address or a string like "Display Name" <email@address.example>
         */
        formatSender: function (name, address, quote) {

            var args = _(arguments).toArray();

            if (_.isArray(args[0])) {
                quote = address;
                name = args[0][0];
                address = args[0][1];
            }

            name = util.unescapeDisplayName(name);
            address = trimAddress(address);

            // short version; just mail address
            if (name === '') return address;
            // long version; display_name plus address
            return (quote === false ? name : '"' + name + '"') + ' <' + address + '>';
        },

        getPriority: function (data) {
            // normal?
            if (data && data.priority === 3) return $();
            var i = '<i class="icon-exclamation"/>',
                indicator = $('<span>').append(_.noI18n('\u00A0'), i, i, i);
            if (data && data.priority < 3) {
                return indicator.addClass('high').attr('title', gt('High priority'));
            } else {
                return indicator.addClass('low').attr('title', gt('Low priority'));
            }
        },

        getAccountName: function (data) {
            // primary account?
            var id = window.unescape(data ? data.id : '');
            return (/^default0/).test(id) ? gt('Primary account') : (data ? data.account_name : 'N/A');
        },

        getTime: function (timestamp) {
            return getDateFormated(timestamp, { fulldate: false });
        },

        getDateTime: function (timestamp, options) {
            return getDateFormated(timestamp, options);
        },

        getFullDate: function (timestamp) {
            if (!_.isNumber(timestamp))
                return gt('unknown');
            var t = new date.Local(timestamp);
            return t.format(date.DATE_TIME);
        },

        getSmartTime: function (timestamp) {
            //FIXME: remove this method later
            //this method is unused, because it brings a lot of problems to manually update the string
            //without the page being reloaded. This might confuse the user and therefore we decided not
            //to use this method any longer. It has not been removed, yet but should so in the future.
            //The following warning is there to inform potential 3rd-party developers about the change.
            console.warn('This method is deprecated and will be removed with 7.6.0 or at any random date later');
            if (!_.isNumber(timestamp))
                return gt('unknown');
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
                    return String(format(ngettext('%d minute ago', '%d minutes ago', n), n)); /*i18n*/
                } else {
                    n = Math.ceil(delta / HOUR);
                    return String(format(ngettext('%d hour ago', '%d hours ago', n), n)); /*i18n*/
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
            return data && data.hasOwnProperty('flags') ? (data.flags & 32) !== 32 : undefined;
        },

        isDeleted: function (data) {
            return data && data.hasOwnProperty('flags') ? (data.flags & 2) === 2 : undefined;
        },

        isSpam: function (data) {
            return data && data.hasOwnProperty('flags') ? (data.flags & 128) === 128 : undefined;
        },

        isAnswered: function () {
            return _.chain(arguments || []).flatten().compact().reduce(function (memo, data) {
                return memo || (data.flags & 1) === 1;
            }, false).value();
        },

        isForwarded: function () {
            return _.chain(arguments || []).flatten().compact().reduce(function (memo, data) {
                return memo || (data.flags & 256) === 256;
            }, false).value();
        },

        //is obj only an attachment of another email
        isAttachment: function (data) {
            return typeof (data || {}).parent !== 'undefined';
        },

        byMyself: function (data) {
            data = data || {};
            return data.from && data.from.length && String(data.from[0][1] || '').toLowerCase() in addresses;
        },

        hasOtherRecipients: function (data) {
            data = data || {};
            var list = [].concat(data.to || [], data.cc || [], data.bcc || []);
            return 0 < _(list).reduce(function (memo, arr) {
                var email = String(arr[1] || '').toLowerCase();
                return memo + (email && !(email in addresses) ? 1 : 0);
            }, 0);
        },

        //deprecated?
        getInitialDefaultSender: function () {
            var mailArray = _(settings.get('defaultSendAddress', []));
            return mailArray._wrapped[0];
        },

        signatures: (function () {
            var htmltags = /(<([^>]+)>)/ig,
                nothing = /.^/,
                general = function (text) {
                    return String(text || '')
                        //replace white-space and evil \r
                        .replace(/(\r\n|\n|\r)/g, '\n')
                        //replace subsequent white-space (except linebreaks)
                        .replace(/[\t\f\v ][\t\f\v ]+/g, ' ')
                        .trim();
                },
                add = function (text, isHTML) {
                    return general(text)
                        //remove html tags (for plaintext emails)
                        .replace(isHTML ? nothing : htmltags, '');
                },
                preview = function (text) {
                    return general(text)
                        //remove ASCII art (intended to remove separators like '________')
                        .replace(/([\-=+*°._!?\/\^]{4,})/g, '')
                        //remove htmltags
                        .replace(htmltags, '')
                        .trim();
                };
            return {
                cleanAdd: function (text, isHTML) {
                    return add(text, !!isHTML);
                },
                cleanPreview: function (text) {
                    return preview(text);
                },
                is: function (text, list, isHTML) {
                    var clean,
                        signatures = _(list).map(function (signature) {
                            //consider changes applied by appsuite
                            clean = add(signature.content, !!isHTML);
                            //consider changes applied by tiny
                            if (clean === '')
                                return '<br>';
                            else {
                                return clean
                                        //replace surrounding white-space (except linebreaks)
                                        .replace(/>[\t\f\v ]+/g, '>')
                                        .replace(/[\t\f\v ]+</g, '<')
                                        //set breaks
                                        .replace(/(\r\n|\n|\r)/g, '<br>');
                            }
                        });
                    return _(signatures).indexOf(text) > - 1;
                }
            };
        })(),

        getAttachments: (function () {

            var isWinmailDATPart = function (obj) {
                return !('filename' in obj) && obj.attachments &&
                    obj.attachments.length === 1 && obj.attachments[0].content === null;
            };

            //remove last element from id (previewing during compose)
            //TODO: there must be a better solution (frank)
            var fixIds = function (data, obj) {
                if (data.parent && data.parent.needsfix) {
                    var tmp = obj.id.split('.');
                    obj.id = obj.id.split('.').length > 1 ? tmp.splice(1, tmp.length).join('.') : obj.id;
                }
            };

            return function (data) {
                data = data || {};
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
                        fixIds(data, obj);
                        attachments.push({
                            id: obj.id,
                            content_type: 'message/rfc822',
                            filename: obj.filename ||
                                _.ellipsis((obj.subject || '').replace(/\s+/g, ' '), {max: 50}), // remove consecutive white-space
                            title: obj.filename || obj.subject || '',
                            mail: mail,
                            parent: data.parent || mail,
                            nested_message: _.extend({}, obj, { parent: mail })
                        });
                    }
                }

                //fix referenced mail
                if (data.parent && mail && mail.folder_id === undefined) {
                    mail.id =  data.parent.id;
                    mail.folder_id = data.parent.folder_id;
                }

                // get non-inline attachments
                for (i = 0, $i = (data.attachments || []).length; i < $i; i++) {
                    obj = data.attachments[i];
                    if (obj.disp === 'attachment') {
                        fixIds(data, obj);
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
