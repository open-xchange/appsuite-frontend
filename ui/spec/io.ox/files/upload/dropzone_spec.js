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
    'io.ox/core/extensions',
    'io.ox/files/upload/dropzone'
], function (ext) {
    describe('Files Upload Dropzone', function () {
        it('should invoke "getDropZones" on "io.ox/files/dropzone" extension', function (done) {
            var spy = sinon.spy();
            ext.point('io.ox/files/dropzone').extend({
                id: 'test',
                index: 'first',
                getDropZones: spy
            });

            ext.point('io.ox/files/mediator').get('files-dropzone', function (e) {
                var app = {
                    getWindowNode: function () { return $('<div>'); }
                };
                e.setup(app);
                expect(spy.calledOnce, 'getDropZones has been called').to.be.true;

                var baton = spy.args[0][0];
                expect(baton.dropZones, 'baton contains dropZones array').to.be.an('array');
                expect(baton.app, 'baton contains app object').to.equal(app);
                //remove extension, again
                ext.point('io.ox/files/dropzone').all().shift();
                done();
            });
        });
    });
});
