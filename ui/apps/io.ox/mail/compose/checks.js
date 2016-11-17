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
    'gettext!io.ox/mail'
], function (api, util, dialogs, gt) {

    function getSender(data) {
        if (_.isEmpty(data.from)) return null;
        return data.from[0];
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
        replyToMailingList: function (cid, data) {

            var result = { mode: 'replyall', data: data };

            // we get the original mail to check its headers (data only offers a small subset)
            var original = api.pool.get('detail').get(cid);
            if (!original) return result;

            // early return if it's not a mailing list
            if (!this.isMailingList(original.toJSON())) return result;

            // also if we don't have any other sender
            var sender = getSender(original.toJSON());
            if (!sender) return result;

            var def = $.Deferred(),
                list = '<b>' + _.escape(getList(original.toJSON())) + '</b>',
                address = '<b>' + _.escape(util.getDisplayName(sender)) + '</b>';

            new dialogs.ModalDialog({ easyOut: false })
                .header(
                    $('<h4>').text(gt('Reply to mailing list'))
                )
                .append(
                    $('<p>').html(
                        //#. %1$d is an email addresses
                        list ? gt('This message was sent via the mailing list %1$s.', list) : gt('This message was sent via a mailing list.')
                    ),
                    $('<p>').html(
                        //#. %1$d is an email addresses
                        gt('Do you really want to reply all or just %1$s?', address)
                    )
                )
                .addPrimaryButton('reply', gt('Reply to sender'))
                .addButton('reply-all', gt('Reply All'))
                .on('reply', function () {
                    data.to = [sender];
                    data.cc = [];
                    result.mode = 'reply';
                    def.resolve(result);
                })
                .on('reply-all', function () {
                    def.resolve(result);
                })
                .show();

            return def;
        }
    };
});
