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
    'gettext!io.ox/core',
    'less!io.ox/core/tk/upload.less'
], function (ModalDialog, gt) {

    'use strict';

    var api = {};

    api.report = function (files, errors) {
        var def = $.Deferred();
        new ModalDialog({ title: gt.ngettext('Unable to upload file', 'Unable to upload files', files.length), width: '600px' })
            .build(function () {
                this.$el.addClass('upload-problems');
                this.$body.append(
                    $('<span>').append(gt.ngettext(
                        'We encountered an issue for your upload',
                        'We encountered some issues for your upload',
                        errors.length
                    )),
                    $('<ul style="margin-top: 8px;" class="list-unstyled list-group">')
                        .append(
                            errors.map(function (obj) {
                                return $('<li class="list-group-item">').text(obj.error);
                            })
                        )
                );
            })
            .addButton()
            .on('close', function () { def.reject(errors); })
            .open();

        return def;
    };

    return api;

});
