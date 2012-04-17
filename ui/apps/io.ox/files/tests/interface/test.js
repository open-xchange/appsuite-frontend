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

    var TIMEOUT = 2500;
    
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
            var timestamp = new Date().getTime();
            var testtitle = "Check it out (" + timestamp + ")";

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

                j.it('fill out form an save ', function () {
                    j.waitsFor(function () {
                        var titleField = $('.create-file input[name="title"]'), commentField = $('.create-file textarea.input-xlarge'), saveButton = $('button[data-action="save"]');
                        if (titleField[0] && titleField[1]) {
                            titleField.first().val(testtitle);
                            titleField.eq(1).val("http://www.somethingawful.com"); //yes, the link field is also titled "title"
                            commentField.val('This is something totally awesome!');
                            saveButton.triggerHandler('click');
                            return true;
                        }
                    }, 'waits', TIMEOUT);
                });
                
                j.it('check out the stored data ', function () {
                    var rightBox;
                    j.waitsFor(function () {
                        var boxes = $('.vgrid-cell.file div.name');
                        boxes.each(function (index, box) {
                            if ($(this).html() === testtitle) {
                                rightBox = box;
                                return true;
                            }
                        });
                    }, 'waited for the right div to appear in the left navbar', TIMEOUT);
                    
                    j.waitsFor(function () {
                        rightBox.trigger('click');
                        return true;
                    }, 'waits', TIMEOUT);
                    
                    j.waitsFor(function () {
                        var page = $('.file-details .view');
                        console.log(page);
                    }, 'waits', TIMEOUT);
                });

            });//END: j.describe
        } //END: test
    }); //END: ext.point

});