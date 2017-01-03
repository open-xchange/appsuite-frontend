/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/checks', [
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (api, util, dialogs, settings, gt) {

    function getSender(data) {
        if (!data) return null;
        var replyTo = getReplyTo(data.headers);
        if (replyTo) return replyTo;
        if (_.isEmpty(data.from)) return null;
        return data.from[0];
    }

    function getReplyTo(headers) {
        if (!headers) return null;
        var str = $.trim(headers['Reply-To']);
        if (!str) return null;
        return util.parseRecipient(str);
    }

    function getList(data) {
        if (!data || !data.headers || !_.isString(data.headers['List-Post'])) return '';
        return data.headers['List-Post'].replace(/^<mailto:(.+)>$/i, '$1').toLowerCase();
    }

    return {

        // a message sent via a mailing list contains special mime headers like "list-owner"
        isMailingList: function (data) {
            if (!data || !data.headers) return false;
            for (var id in data.headers) {
                if (/^list-(id|archive|owner)$/i.test(id)) return true;
            }
            return false;
        },

        // ask the user when replying
        replyToMailingList: function (cid, mode) {

            // check setting
            if (!settings.get('confirmReplyToMailingLists', true)) return $.when(mode);

            // we get the original mail to check its headers
            var original = api.pool.get('detail').get(cid);
            if (!original) return $.when(mode);

            // early return if it's not a mailing list
            if (!this.isMailingList(original.toJSON())) return $.when(mode);

            // also if we don't have any other sender
            var sender = getSender(original.toJSON());
            if (!sender) return $.when(mode);

            var def = $.Deferred(),
                list = getList(original.toJSON()),
                listHTML = '<b>' + _.escape(list) + '</b>',
                address = '<b>' + _.escape(util.getDisplayName(sender, { showMailAddress: true })) + '</b>';

            new dialogs.ModalDialog({ easyOut: false, width: 600 })
                .header(
                    $('<h4>').text(gt('Reply to mailing list'))
                )
                .append(
                    $('<p>').html(
                        list ?
                            //#. %1$s and %2$s are both email addresses
                            gt('This message was sent by %1$s via the mailing list %2$s.', address, listHTML) :
                            //#. %1$s is an email addresses
                            gt('This message was sent by %1$s via a mailing list.', address)
                    ),
                    $('<p>').text(
                        gt('Do you want to reply to the sender, to the mailing list, or to all?')
                    )
                )
                .build(function () {
                    this.addAlternativeButton('cancel', gt('Cancel'));
                    this.addPrimaryButton('reply-all', gt('Reply to all'));
                    if (list) this.addPrimaryButton('reply-list', gt('Reply to list'));
                    this.addPrimaryButton('reply', gt('Reply to sender'));
                })
                .on('reply-all', function () {
                    def.resolve('replyall');
                })
                .on('reply-list', function () {
                    def.resolve('reply', { to: [[null, list]] });
                })
                .on('reply', function () {
                    def.resolve('reply');
                })
                .on('cancel', function () {
                    def.reject();
                })
                .show();

            return def;
        }
    };
});
