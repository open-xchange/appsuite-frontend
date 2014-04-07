/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/core/cache/indexeddb'], function (indexeddb) {
    describe('The IndexedDB', function () {
        //FIXME: indexeddb does return undefined, if browser doesn’t support it
        if (!indexeddb)
            return;
        beforeEach(function (done) {
            indexeddb.clear().done(done);
        });
        afterEach(function () {
            indexeddb.clear();
        });

        describe('clear method', function () {
            it('should clear all databases', function (done) {
                var cache1 = indexeddb.getInstance('appsuite.test.cache1');

                cache1.set('testKey', 'testValue').then(function () {
                    //wait until key is stored
                    return indexeddb.clear();
                }).then(function () {
                    return cache1.get('testKey');
                }).then(function (result) {
                    expect(result).not.to.exist;
                    done();
                });

            });
        });
    });
});
