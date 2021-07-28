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

define(['io.ox/core/cache/indexeddb'], function (indexeddb) {
    describe('The IndexedDB', function () {
        //FIXME: indexeddb does return undefined, if browser doesn’t support it
        if (!indexeddb) return;
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
