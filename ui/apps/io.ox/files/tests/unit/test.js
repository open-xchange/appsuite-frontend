/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 *
 */
define("io.ox/files/tests/unit/test", ["io.ox/core/extensions", "io.ox/files/main", "io.ox/files/api"], function (ext, files, api) {
    "use strict";

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

    ext.point('test/suite').extend({
        id: 'files-unit-test',
        index: 100,
        test: function (j) {


            j.describe("Unit test for creating and reading info item via ALL request ", function () {
                var expected = { title : "expected Title", description : "expected Description"};

                j.it("Verify via ALL method", function () {
                    var ready = new Done();
                    var found = false;
                    var actual;

                    j.waitsFor(ready, 'Waited too long', 5000);

                    api.create({ json : expected }).done(function (createResp) {
                        var fid = createResp.folder_id;
                        var id = createResp.id;

                        api.getAll({ columns: "20,1,700,706" }).done(function (data) {
                            _.each(data, function (file) {
                                if (file.id === id) {
                                    found = true;
                                    actual = file;
                                }
                            });
                            ready.yep();
                        });

                    });
                    j.runs(function () {
                        j.expect(found).toBeTruthy();
                        j.expect(actual.description).toEqual(expected.description);
                        j.expect(actual.title).toEqual(expected.title);
                    });
                });
            });



            j.describe("Unit test for creating and reading info item via LIST request ", function () {
                var expected = { title : "expected Title", description : "expected Description"};

                j.it("Verify via LIST method", function () {
                    var ready = new Done();
                    var found = false;
                    var actual;

                    j.waitsFor(ready, 'Waited too long', 5000);

                    api.create({ json : expected }).done(function (createResp) {
                        var fid = createResp.folder_id;
                        var id = createResp.id;

                        api.getList([{ folder : fid, id : id }]).done(function (data) {
                            _.each(data, function (file) {
                                if (file.id === id) {
                                    found = true;
                                    actual = file;
                                }
                            });
                            ready.yep();
                        });

                    });
                    j.runs(function () {
                        j.expect(found).toBeTruthy();
                        j.expect(actual.description).toEqual(expected.description);
                        j.expect(actual.title).toEqual(expected.title);
                    });
                });
            });




            j.describe("Unit test for creating and reading info item via GET request ", function () {
                var expected = { title : "expected Title", description : "expected Description"};

                j.it("Verify via GET method", function () {
                    var ready = new Done();
                    var found = false;
                    var actual;

                    j.waitsFor(ready, 'Waited too long', 5000);

                    api.create({ json : expected }).done(function (createResp) {
                        var fid = createResp.folder_id;
                        var id = createResp.id;

                        api.get({ folder : fid, id : id }).done(function (file) {
                            if (file.id === id) {
                                found = true;
                                actual = file;
                            }
                            ready.yep();
                        });

                    });
                    j.runs(function () {
                        j.expect(found).toBeTruthy();
                        j.expect(actual.description).toEqual(expected.description);
                        j.expect(actual.title).toEqual(expected.title);
                    });
                });
            });

        } //END: test
    }); //END: ext.point
}); //END: define
