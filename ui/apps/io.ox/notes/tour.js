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
                $('<p>').text('To keep it simple right now, there is no editor. So you have to use the keyboard to change formatting:'),
                $('<ul>').append(
                    $('<li>').text('Cmd + B: Bold'),
                    $('<li>').text('Cmd + I: Italic'),
                    $('<li>').text('Cmd + U: Underline/Mark'),
                    $('<li>').text('Cmd + S: Strike through')
                ),
                $('<p>').text('You cannot insert lists right now (see welcome note). That is the very next feature.')
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
