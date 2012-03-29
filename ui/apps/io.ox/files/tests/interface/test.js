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

define("io.ox/files/interface/test", ["io.ox/core/extensions", "io.ox/files/main", "io.ox/files/api"], function (ext, files, api) {
    "use strict";

    var TIMEOUT = 5000;
    
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
        id: 'files-integration-tests',
        index: 100,
        test: function (j) {

            j.describe("Info item creation", function () {

                var app = null,
                    id, dataId, dataFolder, dataObj;

                j.it('opens files app ', function () {
                    var loaded = new Done();

                    files.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                    });
                    
                    j.waitsFor(function () {
                        var button = $("[data-action='upload']");
                        if (button[0]) {
                            button.triggerHandler('click');
                            return true;
                        }
                    }, 'waits', TIMEOUT);
                });

                j.it('looks for "show more" button and hits ', function () {
                    j.waitsFor(function () {
                        var button = $(".create-file a[class='more']");
                        if (button[0]) {
                            button.triggerHandler('click');
                            return true;
                        }
                    }, 'waits', TIMEOUT);
                });

                j.it('looks for "show more" button and hits ', function () {
                    j.waitsFor(function () {
                        var formFrame = $('.create-file label[class="control-label"][for="title"]');
                        if (formFrame[0]) {
//                            formFrame.
                            return true;
                        }
                    }, 'waits', TIMEOUT);
                });

            });//END: j.describe
        } //END: test
    }); //END: ext.point

});