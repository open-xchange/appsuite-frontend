/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'io.ox/core/extensions',
    'io.ox/core/tk/attachments',
    'io.ox/core/notifications',
    'spec/shared/capabilities'
], function (ext, attachments, notifications, caputil) {
    'use strict';

    var capabilities = caputil.preset('common').init('io.ox/core/tk/attachments', attachments);

    describe('Attachments Util has a', function () {
        describe('FileUploadWidget:', function () {
            describe('when capability "infostore" is disabled', function () {
                beforeEach(function () {
                    capabilities.disable('infostore');
                });
                it('and ox.drive is enabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
            describe('when capability "infostore" is enabled', function () {
                beforeEach(function () {
                    capabilities.enable('infostore');
                });
                it.skip('and ox.drive is enabled "Files" button should be shown', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(1);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
        });
    });
});
