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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/categories/train', [
    'io.ox/mail/categories/api',
    'io.ox/core/yell',
    'gettext!io.ox/mail'
], function (api, yell, gt) {

    'use strict';

    function createSenderList(carrier) {
        carrier.senderlist = _.chain(carrier.maillist)
                .map(function (mail) { return mail.from[0][1]; })
                .uniq()
                .value();
        return carrier;
    }

    function createTextLines(carrier) {
        carrier.textlines = {
            success: gt.format(
                //#. successfully moved a message via drag&drop to another mail category (tab)
                //#. %1$d represents the name if the target category
                //#, c-format
                gt.ngettext('Message moved to to category "%1$d".', 'Messages moved to category "%1$d".', carrier.maillist.length),
                _.escape(carrier.options.targetname)
            ),
            question: gt.format(
                //#. ask user to move all messages from the same sender to the mail category (tab)
                //#. %1$d represents a email address
                //#, c-format
                gt.ngettext('Move all messages from %1$d to that category?', 'Move all messages from selected senders to that category?', carrier.senderlist.length),
                '<b>' + _.escape(carrier.senderlist) + '</b>'
            )
        };
        return carrier;
    }

    function createContentString(carrier) {
        carrier.contentstring = $('<tmp>').append(
            $('<div class="content">').append(
                $('<div>').html(carrier.textlines.success),
                $('<div>').html(carrier.textlines.question + '<br>'),
                $('<button role="button" class="btn btn-default btn-primary" data-action="move-all">').text(gt('Move all')),
                $('<button role="button" class="btn btn-default" data-action="cancel">').text(gt('Cancel'))
            )
        ).html();
        return carrier;
    }

    function yellOut(carrier) {
        carrier.node = yell({
            message: carrier.contentstring,
            html: true,
            duration: -1
        })
        .addClass('category-toast')
        .on('click', '.btn', function (e) {
            var action = $(e.target).attr('data-action');
            if (/move-all/.test(action)) api.train(carrier.options).fail(yell);
            yell('close');
        });
        return carrier;
    }

    return {

        open: function (options) {
            var carrier = { maillist: options.data, options: options },
                pipeline = _.pipe(carrier);

            pipeline
                .then(createSenderList)
                .then(createTextLines)
                .then(createContentString)
                .then(yellOut);
        }
    };
});
