/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/mail/actions/viewer', [
    'io.ox/core/viewer/main'
], function (Viewer) {

    'use strict';

    return function (baton) {
        //console.warn('mail.actions.Viewer.js', baton);
        Viewer.launch(baton);
    };
});
