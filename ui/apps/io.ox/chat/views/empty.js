/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/empty', ['io.ox/backbone/views/disposable', 'gettext!io.ox/chat'], function (DisposableView, gt) {

    'use strict';

    return DisposableView.extend({

        render: function () {
            this.$el.append(
                $('<div class="start-chat abs action-button-rounded">').append(
                    $('<div class="center empty-view">').append(
                        $('<button type="button" class="btn btn-link" data-cmd="start-private-chat">').attr('aria-label', gt('Create private chat')).append(
                            $('<i class="fa fa-user" aria-hidden="true">').attr('title', gt('Private chat')),
                            $.txt(gt('Create private chat'))
                        ),
                        $('<button type="button" class="btn btn-link" data-cmd="edit-group-chat">').attr('aria-label', gt('Create group chat')).append(
                            $('<i class="fa fa-group" aria-hidden="true">').attr('title', gt('Group chat')),
                            $.txt(gt('Create group chat'))
                        ),
                        $('<button type="button" class="btn btn-link" data-cmd="edit-group-chat" data-type="channel">').attr('aria-label', gt('Create channel')).append(
                            $('<i class="fa fa-hashtag" aria-hidden="true">').attr('title', gt('Channel')),
                            $.txt(gt('Create channel'))
                        )
                    )
                )
            );
            return this;
        }
    });
});
