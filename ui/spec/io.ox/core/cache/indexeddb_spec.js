/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/core/cache/indexeddb'], function (indexeddb) {
    //FIXME: indexeddb does return undefined, if browser doesn’t support it
    if (!indexeddb)
        return;
    xdescribe('The IndexedDB', function () {
        beforeEach(function () {
            var def = $.Deferred();
            def = indexeddb.clear();
            waitsFor(function () {
                return def.state() !== 'pending';
            }, 'Clear the cache', 1000);
        });
        afterEach(function () {
            indexeddb.clear();
        });

        describe('clear method', function () {
            it('should clear all databases', function () {
                var cache1 = indexeddb.getInstance('appsuite.test.cache1'),
                    cache2 = indexeddb.getInstance('appsuite.test.cache2'),
                    cache3 = indexeddb.getInstance('appsuite.test.cache3');

                var def = cache1.set('testKey', 'testValue').then(function (r) {
                    //wait until key is stored
                    return indexeddb.clear();
                }).then(function (result) {
                    cache1 = indexeddb.getInstance('appsuite.test.cache1');
                    return cache1.get('testKey');
                });

                expect(def).not.toResolveWith('testValue');
            });
        });
    });
});
