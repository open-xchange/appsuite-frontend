/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/tk/upload-problems', [
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core'
], function (ModalDialog, gt) {

    'use strict';

    var api = {};

    api.report = function (files, errors) {
        var def = $.Deferred();
        new ModalDialog({ title: gt.ngettext('Unable to upload file', 'Unable to upload files', files.length) })
            .build(function () {
                this.$body.append(
                    gt.ngettext(
                        'The following problem has been identified with this upload task:',
                        'The following problems have been identified with this upload task:',
                        errors.length
                    ),
                    $('<ol>').append(
                        errors.map(function (obj) {
                            return $('<li>').text(obj.error);
                        })
                    ),
                    gt('Please try again.')
                );
            })
            .addCancelButton()
            .on('cancel', function () { def.reject(errors); })
            .open();

        return def;
    };

    return api;

});
