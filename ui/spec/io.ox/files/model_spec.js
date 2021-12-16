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

define([
    'io.ox/files/api'
], function (api) {
    'use strict';

    describe('File API: FileModel', function () {
        describe('hasWritePermissions()', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{"groups":[0,3851]}}');
                });
            });

            it('should find per user permissions', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: false, bits: 2 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.true;
                });
            });

            it('should ignore group permissions if group id is the same as user_id', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 1337, group: true, bits: 2 },
                        { entity: 1337, group: false, bits: 1 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.false;
                });
            });

            it('find maximum permissions available', function () {
                var model = new api.Model({
                    object_permissions: [
                        { entity: 0, group: true, bits: 1 },
                        { entity: 3851, group: true, bits: 2 }
                    ]
                });
                return model.hasWritePermissions().then(function (permission) {
                    expect(permission).to.be.true;
                });
            });
        });
    });
});
