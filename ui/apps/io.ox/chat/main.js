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

define('io.ox/chat/main', [
    'io.ox/backbone/views/window',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'less!io.ox/chat/style'
], function (WindowView, contactsAPI, contactsUtil) {

    'use strict';

    var window = new WindowView({ title: 'OX Chat' }).open(),
        user = ox.rampup.user;

    window.$body.addClass('ox-chat').append(
        $('<div class="leftside abs">').append(
            $('<div class="header">').append(
                contactsAPI.pictureHalo(
                    $('<div class="picture" aria-hidden="true">'), user, { width: 48, height: 48 }
                ),
                $('<div class="name">').text(contactsUtil.getFullName(user))
            ),
            $('<div class="search">').append(
                $('<input type="text" spellcheck="false" autocomplete="false" placeholder="Search">')
            ),
            $('<ul class="chats">').append(
                $('<li>').append(
                    $('<span class="title unseen pull-left">').text('An unseen message'),
                    $('<span class="label label-primary pull-right">').text('2')
                ),
                $('<li>').text('Another chat'),
                $('<li>').text('Maybe a group chat'),
                $('<li>').text('This could be a channel')
            )
        ),
        $('<div class="rightside abs">').append(
            $('<div class="start-chat abs">').append(
                $('<button type="button" class="btn btn-default">').append(
                    $('<i class="fa fa-plus">'),
                    $('<br>'),
                    $.txt('Start new chat')
                )
            )
        )
    );
});
