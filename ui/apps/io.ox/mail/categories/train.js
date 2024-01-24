/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/categories/train', [
    'io.ox/mail/categories/api',
    'io.ox/core/yell',
    'gettext!io.ox/mail'
], function (api, yell, gt) {

    'use strict';

    return {

        open: function (options) {

            var addresses = options.data,
                category = options.targetname;

            yell({
                duration: -1,
                message: $('<div class="content category-toast">').append(
                    $('<p>').text(getSuccessMessage(addresses, category)),
                    $('<p>').append(getQuestion(addresses)),
                    $('<button type="button" class="btn btn-default" data-action="move-all">').text(gt('Move all messages')).on('click', function () {
                        api.train(options).fail(yell);
                        yell('close');
                    })
                ),
                type: 'success',
                focus: true
            });
        }
    };

    function getSuccessMessage(addresses, category) {
        // do not use "gt.ngettext" for plural without count
        return (addresses.length === 1) ?
            //#. successfully moved a message via drag&drop to another mail category (tab)
            //#. %1$s represents the name of the target category
            gt('Message moved to category "%1$s".', category) :
            //#. %1$s represents the name of the target category
            gt('Messages moved to category "%1$s".', category);
    }

    function getQuestion(addresses) {
        var uniquelist = getSenderList(addresses);
        // do not use "gt.ngettext" for plural without count
        var pattern = (uniquelist.length === 1) ?
            //#. ask user to move all messages from the same sender to the mail category (tab)
            //#. %1$s represents a single email address (non-essential information: can be left out)
            gt('Do you want to move all messages from %1$s to that category?') :
            gt('Do you want to move all messages from selected senders to that category?');
        return _.noI18n.assemble(pattern, function () { return $('<b>').text(uniquelist); }, $.txt);
    }

    function getSenderList(addresses) {
        return _(addresses)
            .chain()
            .map(function (mail) { return mail.from[0][1]; })
            .uniq()
            .value();
    }
});
