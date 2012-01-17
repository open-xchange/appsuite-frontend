/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define("io.ox/core/test/cacheObjectCache",
    ["io.ox/core/extensions",
     "io.ox/core/cache"], function (ext, cache) {

    "use strict";

    // test objects
    var TIMEOUT = 5000,
        testKey = 'testkey',
        testValue = 'ABC';

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    /*
     * Suite: Cache Test
     */
    ext.point('test/suite').extend({
        id: 'core-cache-objectcache',
        index: 100,
        test: function (j) {
            
            j.describe("Caching with ObjectCache", function () {
                
                var testStorage = new cache.ObjectCache('TEST_ObjectCache');
                
                
                
                var currentTimeStamp = (new Date()).getTime();
                var olderTimeStamp = currentTimeStamp - 1000;
                var newerTimeStamp = currentTimeStamp + 1000;
                
                var testKey = 'A.ABC';
                var testKeyRegex = 'Simple';
                var testData1 = {'folder_id':'A','id':'ABC','TEST':'1'};
                var testData2 = {'folder_id':'A','id':'ABC','TEST':'2'};
                var testData3 = {'folder_id':'A','id':'ABC','TEST':'3'};
                

                var testDataA = {'folder_id':'A','id':'ABD','TEST':'1'};
                var testDataB = {'folder_id':'A','id':'ABE','TEST':'1'};
                var testDataC = {'folder_id':'A','id':'ABF','TEST':'1'};

                
                j.it('clearing cache', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.clear().done(function(check){
                        loaded.yep();
                        j.expect(check).not.toBeDefined();
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('getting not existing key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.get('notexistent').done(function(data){
                        loaded.yep();
                        j.expect(data).not.toBeDefined();
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('adding data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.add(testData1,currentTimeStamp).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('adding old data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.add(testData2,olderTimeStamp).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('getting data to test for old data replacement', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.get(testKey).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('adding new data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.add(testData3,newerTimeStamp).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('getting data to test for new data replacement', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.get(testKey).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual(testData3);
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                j.it('adding array of new data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);
                    
                    testStorage.add([testData1,testDataA,testDataB,testDataC],currentTimeStamp).done(function(data){
                        loaded.yep();
                        j.expect(data).toEqual( [ 'A.ABC', 'A.ABD', 'A.ABE', 'A.ABF' ] );
                    }).fail(function(e){
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });
                
                
                
            });
            
        }
    });
    
    
});