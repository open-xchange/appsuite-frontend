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
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/core/standalone', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    var container = $('#io-ox-installer'),
        button = container.find('button.install');

    // update text
    button.text(gt('Install'));
    container.find('.description').text(gt('Get our free app. It won\'t take up space on your device.'));

    function show() {
        $('html').toggleClass('installer-open', true);
    }

    function hide() {
        $('html').toggleClass('installer-open', false);
        ox.deferredPrompt = null;
    }

    // register
    container
        .on('click', hide)
        .on('click', '.install, .description', function (e) {
            e.stopPropagation();
            var event = ox.deferredPrompt;
            // show promt
            event.prompt();

            event.userChoice.then(function (choiceResult) {
                var isAccepted = choiceResult.outcome === 'accepted';
                console.debug(isAccepted ?
                    'User accepted the A2HS prompt' :
                    'User dismissed the A2HS prompt'
                );

                if (isAccepted) hide();
            });
        });

    return {
        show: show,
        hide: hide
    };
});
