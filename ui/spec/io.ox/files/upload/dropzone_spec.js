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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
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
