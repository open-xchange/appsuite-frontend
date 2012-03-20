define("io.ox/files/test",
    ["io.ox/core/extensions", "io.ox/files/main", "io.ox/files/api"], function (ext, files, api) {

        "use strict";
        ext.point('test/suite').extend({
            id: 'files-general',
            index: 100,
            test: function (j) {
                var image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9YGARc5KB0XV+IAAAAddEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIFRoZSBHSU1Q72QlbgAAAF1JREFUGNO9zL0NglAAxPEfdLTs4BZM4DIO4C7OwQg2JoQ9LE1exdlYvBBeZ7jqch9//q1uH4TLzw4d6+ErXMMcXuHWxId3KOETnnXXV6MJpcq2MLaI97CER3N0vr4MkhoXe0rZigAAAABJRU5ErkJggg==";
                
                j.describe("Unit test for creating an info item ", function () {
                    var options = { json : { description : " Description 2", title : "Title 2"} };
                    api.create(options);
                    console.log(api.get());
                });
            }
            
            
// integration test: ext.point("io.ox/files/actions/upload").invoke("action", null, files);
            
        });
    });