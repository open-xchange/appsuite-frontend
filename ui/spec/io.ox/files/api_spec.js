/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/files/api',
    'settings!io.ox/core'
], function (api, coreSettings) {
    'use strict';

    describe('files API', function () {
        it('should exist', function () {
            expect(api).to.exist;
        });
        describe.only('Collection Loader', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/files\?/, function (xhr) {
                    expect(xhr.url).to.contain('action=all');
                    expect(xhr.url).to.contain('folder=4711');
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: [
                            { id: '3', folder_id: '1337', title: 'three' },
                            { id: '4', folder_id: '1337', title: 'four' },
                            { id: '5', folder_id: '1337', title: 'five' }
                        ]
                    }));
                });
            });

            it('uses the files module', function () {
                expect(api.collectionLoader.module).to.equal('files');
            });

            it('loads the default folder', function (done) {
                //set default folder for files app
                coreSettings.set('folder/infostore', '4711');
                var c = api.collectionLoader.load();
                c.on('load', function (m) {
                    expect(c).to.have.length(3);
                    done();
                });
            });

            it('serves a collection for a folder', function (done) {
                var c = api.collectionLoader.load({
                    id: '1337',
                    folder: '4711'
                });
                c.on('load', function (m) {
                    expect(c).to.have.length(3);
                    done();
                });
            });
        });
    });
});
