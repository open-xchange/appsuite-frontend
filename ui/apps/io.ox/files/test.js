define("io.ox/files/test", ["io.ox/core/extensions", "io.ox/files/main", "io.ox/files/api"], function (ext, files, api) {
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
        id: 'files-general',
        index: 100,
        test: function (j) {
            var image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9YGARc5KB0XV+IAAAAddEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIFRoZSBHSU1Q72QlbgAAAF1JREFUGNO9zL0NglAAxPEfdLTs4BZM4DIO4C7OwQg2JoQ9LE1exdlYvBBeZ7jqch9//q1uH4TLzw4d6+ErXMMcXuHWxId3KOETnnXXV6MJpcq2MLaI97CER3N0vr4MkhoXe0rZigAAAABJRU5ErkJggg==";

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
                                    console.log(actual);
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

                j.it("Verify via LIST method", function () {
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