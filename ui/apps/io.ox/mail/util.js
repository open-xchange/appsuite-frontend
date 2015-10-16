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

define('io.ox/mail/util', [
    'io.ox/core/extensions',
    'io.ox/core/util',
    'io.ox/core/api/account',
    'io.ox/core/capabilities',
    'settings!io.ox/mail',
    'settings!io.ox/contacts',
    'gettext!io.ox/core'
], function (ext, util, accountAPI, capabilities, settings, contactsSetting, gt) {

    'use strict';

    var that,

        ngettext = function (s, p, n) {
            return n > 1 ? p : s;
        },

        // fnClickPerson = function (e) {
        //     e.preventDefault();
        //     ext.point('io.ox/core/person:action').each(function (ext) {
        //         _.call(ext.action, e.data, e);
        //     });
        // },

        getDateFormated = function (timestamp, options) {

            if (!_.isNumber(timestamp)) return gt('unknown');

            var opt = $.extend({ fulldate: false, filtertoday: true }, options || {}),
                d = moment(timestamp),

                timestr = function () {
                    return d.format('LT');
                },
                datestr = function () {
                    return d.format('l') + (opt.fulldate ? ' ' + timestr() : '');
                },
                isSameDay = function () {
                    return moment().isSame(d, 'day');
                };

            if (opt.filtertoday && isSameDay()) return timestr();

            if (opt.smart) {
                var delta = moment().startOf('day').diff(moment(timestamp).startOf('day'), 'day');
                if (delta === 1) { return gt('Yesterday'); } else if (delta <= 6) { return d.format('dddd'); }
            }

            return datestr();
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
         * @return { array} list of types
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
         * @return { string} channel
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
         * @return { undefined }
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
                        if (mail.from && _.isArray(mail.from[0]) && mail.from[0][1]) {
                            mail.from[0][1] = remove(mail.from[0][1]);
                        }
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
            if (!s) return list;
            while ((match = s.match(rRecipientList)) !== null) {
                // look ahead for next round
                s = s.substr(match[0].length).replace(rRecipientCleanup, '');
                // get recipient
                recipient = this.parseRecipient(match[0]);
                //stupid workarround so exchange draft emails without proper mail adresses get displayed correctly (Bug 23983)
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
                tmp = $('<div>'), obj, email, node, sender;

            for (; i < $i; i++) {

                obj = { display_name: this.getDisplayName(list[i]) };
                email = String(list[i][1] || '').toLowerCase();
                if (email !== 'undisclosed-recipients:;') obj.email = email;
                node = util.renderPersonalName(obj);
                if (obj.email) node.addClass('person-link person-' + field);
                tmp.append(node);

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
                    tmp.append(
                        $('<span class="delimiter">').append($.txt(_.noI18n('\u00A0\u2014 ')))
                    );
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
                            .append($.txt(_.noI18n('\u00A0\u2022 ')))
                    );
                }
            }
            return tmp;
        },

        // pair: Array of display name and email address
        // options:
        // - showDisplayName: Show display name if available
        // - showMailAddress: Always show mail address
        // - reorderDisplayName: "last name, first name" becomes "first name last name"
        getDisplayName: function (pair, options) {

            if (!_.isArray(pair)) return '';

            options = _.extend({
                reorderDisplayName: true,
                showDisplayName: true,
                showMailAddress: false,
                unescapeDisplayName: true
            }, options);

            var name = pair[0], email = String(pair[1] || '').toLowerCase(), display_name = name;

            if (options.unescapeDisplayName === true) {
                display_name = util.unescapeDisplayName(name);
            }

            if (options.showDisplayName === false) return email;

            if (options.reorderDisplayName) {
                display_name = display_name.replace(/^([^,.\(\)]+),\s([^,]+)$/, '$2 $1');
            }

            if (options.showMailAddress && display_name && email) {
                display_name += ' <' + email + '>';
            }

            return display_name || email;
        },

        // takes care of special edge-case: no from address
        hasFrom: function (data) {
            return data && _.isArray(data.from) && data.from.length > 0 && !!data.from[0][1];
        },

        // options.field: Which field to use, e.g. 'from' or 'to'
        // options are also handed over to getDisplayName()
        // returns jquery set
        getFrom: function (data, options) {

            data = data || {};
            options = _.extend({ field: 'from' }, options);

            // get list
            var list = _(data[options.field])
                .chain()
                .map(function (item) {
                    // reduce to display name
                    return that.getDisplayName(item, options);
                })
                .filter(function (name) {
                    // skip empty names
                    return name !== '';
                })
                .value();

            // empty?
            if (list.length === 0) {
                return $().add(
                    $.txt(options.field === 'from' ? gt('Unknown sender') : gt('No recipients'))
                );
            }

            list = _(list).reduce(function (set, name) {
                return set
                    .add(util.renderPersonalName({ name: name }).addClass('person'))
                    .add($.txt(', '));
            }, $());

            // drop last item
            return list.slice(0, -1);
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

        // remove typical "Re: Re: Fwd: Re sequences".
        // keepFirstPrefix <bool> allows to keep the most recent one.
        // that mode is useful in list view to indicate that it's not the original email.
        getSubject: function (data, keepFirstPrefix) {

            var subject = $.trim(_.isString(data) ? data : data.subject);

            if (subject === '') return gt('No subject');

            // remove mailing list stuff (optional)
            if (settings.get('features/cleanSubjects', false)) {
                subject = subject.replace(/\[[^\[]*\]\s*/g, '');
            }

            return keepFirstPrefix ?
                subject.replace(/^((re|fwd|aw|wg):\s?)((re|fwd|aw|wg):\s?)*/i, '$1') :
                subject.replace(/^((re|fwd|aw|wg):\s?)+/i, '');
        },

        getPriority: function (data) {
            // normal?
            if (data && data.priority === 3) return $();
            if (data && data.priority < 3) return $('<span class="high"><i class="fa fa-exclamation"/></span>').attr('title', gt('High priority'));
            return $('<span class="low"><i class="fa fa-minus"/></span>').attr('title', gt('Low priority'));
        },

        getAccountName: function (data) {
            // primary account?
            var id = window.unescape(data ? data.id : '');
            if ((/^default0/).test(id)) return gt('Primary account');
            return (data && data.account_name) || 'N/A';
        },

        getTime: function (timestamp, options) {
            return getDateFormated(timestamp, options);
        },

        getDateTime: function (timestamp, options) {
            options = _.extend({ fulldate: true }, options);
            return getDateFormated(timestamp, options);
        },

        getFullDate: function (timestamp) {
            if (!_.isNumber(timestamp)) return gt('unknown');
            return moment(timestamp).format('l LT');
        },

        getSmartTime: function (timestamp) {
            //FIXME: remove this method later
            //this method is unused, because it brings a lot of problems to manually update the string
            //without the page being reloaded. This might confuse the user and therefore we decided not
            //to use this method any longer. It has not been removed, yet but should so in the future.
            //The following warning is there to inform potential 3rd-party developers about the change.
            var format = _.printf,
                MINUTE = 60 * 1000,
                HOUR = MINUTE * 60;
            console.warn('This method is deprecated and will be removed with 7.6.0 or at any random date later');
            if (!_.isNumber(timestamp)) return gt('unknown');
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

        isToplevel: function (data) {
            return _.isObject(data) && 'folder_id' in data && !('filename' in data);
        },

        isUnseen: function (data) {
            data = _.isObject(data) ? data.flags : data;
            return _.isNumber(data) ? (data & 32) !== 32 : undefined;
        },

        isDeleted: function (data) {
            return data && _.isNumber(data.flags) ? (data.flags & 2) === 2 : undefined;
        },

        isSpam: function (data) {
            return data && _.isNumber(data.flags) ? (data.flags & 128) === 128 : undefined;
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

        isEmbedded: function (data) {
            if (!_.isObject(data)) return false;
            return data.folder_id === undefined && data.filename !== undefined;
        },

        byMyself: function (data) {
            data = data || {};
            return data.from && data.from.length && String(data.from[0][1] || '').toLowerCase() in addresses;
        },

        hasOtherRecipients: function (data) {
            data = data || {};
            var list = [].concat(data.to || [], data.cc || [], data.bcc || []),
                others = _(list).reduce(function (memo, arr) {
                    var email = String(arr[1] || '').toLowerCase();
                    return memo + (email && !(email in addresses) ? 1 : 0);
                }, 0);
            return others > 0;
        },

        //deprecated?
        getInitialDefaultSender: function () {
            var mailArray = _(settings.get('defaultSendAddress', []));
            return mailArray._wrapped[0];
        },

        fixInlineImages: function (data) {
            return data
                .replace(new RegExp('(<img[^>]+src=")' + ox.abs + ox.apiRoot), '$1/ajax')
                .replace(new RegExp('(<img[^>]+src=")' + ox.apiRoot, 'g'), '$1/ajax')
                .replace(/on(mousedown|contextmenu)="return false;"\s?/g, '')
                .replace(/data-mce-src="[^"]+"\s?/, '');
        },

        signatures: (function () {

            var looksLikeHTML = function (text) {
                    return /(<\/?\w+(\s[^<>]*)?>)/.test(text);
                },
                general = function (text) {
                    return String(text || '')
                        // replace white-space and evil \r
                        .replace(/(\r\n|\n|\r)/g, '\n')
                        // replace subsequent white-space (except linebreaks)
                        .replace(/[\t\f\v ][\t\f\v ]+/g, ' ')
                        .trim();
                },
                add = function (text, isHTML) {
                    var clean = general(text);
                    // special entities like '&'/&amp;
                    var $parsed = $('<dummy>').html(clean);
                    if (isHTML) {
                        if (!looksLikeHTML(clean)) {
                            $parsed.text(clean);
                        }
                        return $parsed.html();
                    } else {
                        if (!looksLikeHTML(clean)) {
                            $parsed.text(clean);
                        }
                        $parsed.find('p').replaceWith(function () {
                            return $(this).html() + '\n\n';
                        });
                        $parsed.find('br').replaceWith(function () {
                            return $(this).html() + '\n';
                        });
                        return $parsed.text().trim();
                    }
                },
                preview = function (text) {
                    return general(text)
                        // remove ASCII art (intended to remove separators like '________')
                        .replace(/([\-=+*°._!?\/\^]{4,})/g, '')
                        // remove htmltags
                        .replace(/(<\/?\w+(\s[^<>]*)?>)/g, '')
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
                    var signatures = _(list).map(function (signature) {
                        // consider changes applied by appsuite
                        var clean = add(signature.content, !!isHTML);
                        // consider changes applied by tiny
                        if (clean === '') {
                            return '<br>';
                        } else {
                            return clean
                                // set breaks
                                .replace(/(\r\n|\n|\r)/g, '<br>')
                                // replace surrounding white-space (except linebreaks)
                                .replace(/>[\t\f\v ]+/g, '>')
                                .replace(/[\t\f\v ]+</g, '<')
                                // remove empty alt attribute(added by tiny)
                                .replace(/ alt=""/, '');
                        }
                    });
                    return _(signatures).indexOf(add(text, !!isHTML)) > - 1;
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
                            _.extend({}, dat, { mail: mail, title: obj.filename || '', parent: data.parent || mail })
                        );
                    } else {
                        fixIds(data, obj);
                        attachments.push({
                            id: obj.id,
                            content_type: 'message/rfc822',
                            filename: obj.filename ||
                                // remove consecutive white-space
                                _.ellipsis((obj.subject || '').replace(/\s+/g, ' '), { max: 50 }),
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
                    if (obj.disp === 'attachment' || /^image/.test(obj.content_type)) {
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
