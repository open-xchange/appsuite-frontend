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

define('io.ox/core/tk/upload-problems', [
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core',
    'less!io.ox/core/tk/upload.less'
], function (ModalDialog, gt) {

    'use strict';

    var api = {};

    api.report = function (files, errors) {
        var def = $.Deferred();
        new ModalDialog({
            // do not use "gt.ngettext" for plural without count
            title: (files.length === 1) ? gt('Unable to upload file') : gt('Unable to upload files'),
            width: '600px'
        })
            .build(function () {
                this.$el.addClass('upload-problems');
                this.$body.append(
                    $('<span>').append(
                        // do not use "gt.ngettext" for plural without count
                        (errors.length === 1) ?
                            gt('We encountered an issue for your upload') :
                            gt('We encountered some issues for your upload')
                    ),
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
