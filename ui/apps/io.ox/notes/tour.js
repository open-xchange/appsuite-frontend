/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/notes/tour', ['io.ox/core/tk/wizard', 'settings!io.ox/notes'], function (Tour, settings) {

    'use strict';

    //

    var tourId = 'notes/welcome';

    Tour.registry.add({ id: tourId }, function () {

        var tour = new Tour();

        tour.on('stop', function () {
            settings.set('tours/welcome/run', false).save();
        });

        tour
        .step()
            .mandatory()
            .title('Welcome to OX Notes')
            .content(
                $('<p>').text('This is just an early prototype! Just a few hours of work.'),
                $('<p>').text('Technically everything is stored in OX Drive. Topics are actually Drive folders, notes are plain text files.'),
                $('<p>').text('You can edit a note right in the detail view. Changes are saved automatically.')
            )
            .end()
        .step()
            .mandatory()
            .title('Keyboard shortcuts (Mac OS)')
            .referTo('.io-ox-notes-window .rightside')
            .hotspot('.io-ox-notes-window .note-content')
            .content(
                $('<p>').text('To keep it simple right now, there is no complex editor with controls. So you have to use the keyboard to change formatting:'),
                $('<ul>').append(
                    $('<li>').text('Cmd + B: Bold'),
                    $('<li>').text('Cmd + I: Italic'),
                    $('<li>').text('Cmd + U: Underline/Mark'),
                    $('<li>').text('Cmd + S: Strike through')
                )
            )
            .end()
        .step()
            .mandatory()
            .title('Insert lists')
            .referTo('.io-ox-notes-window .rightside')
            .hotspot('.io-ox-notes-window .dropdown')
            .on('show hide', function () {
                $('.note-header .dropdown > a').dropdown('toggle');
            })
            .content(
                $('<p>').text('You can also insert lists and images via the "Insert" dropdown')
            )
            .end()
        .step()
            .mandatory()
            .title('And ...')
            .content(
                $('<p>').text('... it\'s just a prototype!')
            )
            .end();

        tour.start();
    });

    return {
        start: function () {
            Tour.registry.run(tourId);
        }
    };

});
