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

define("io.ox/files/tests/interface/test", ["io.ox/core/extensions", "io.ox/files/api"], function (ext, api) {
    "use strict";

    var TIMEOUT = 10000;

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

                    ox.launch('io.ox/files/main', { perspective: 'list' }).done(function () {
                        app = this;
                        loaded.yep();
                    });

                    j.waitsFor(function () {
                        var button = $("[data-ref='io.ox/files/links/toolbar/default']");
                        if (button[0]) {
                            button.triggerHandler('click');
                            _.defer(function () {
                                $("[data-action='io.ox/files/actions/upload']").triggerHandler('click');
                            });
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
                        var titleField = $('.create-file input[name="title"]'),
                            commentField = $('.create-file textarea.input-xlarge'),
                            saveButton = $('button[data-action="save"]');
                        if (titleField[0]) {
                            titleField.eq(0).val(testtitle);
                            commentField.val('This is something totally awesome!');
                            saveButton.trigger('click');
                            return true;
                        }
                    }, 'waits', TIMEOUT);
                });

                j.it('check out the stored data ', function () {
                    var rightBox;
                    j.waitsFor(function () {
                        var boxes = $('.title'), found = false;
                        boxes.each(function (index, box) {
                            //console.debug("[" + index + "] '" + $(this).html() + "' vs '" + testtitle + "'");
                            if ($(this).text() === testtitle) {
                                rightBox = $(this);
                                found = true;
                            }
                        });
                        return found;
                    }, 'waited for the right div to appear in the left navbar', TIMEOUT);

                    j.waitsFor(function () {
                        if (rightBox !== null) {
                            rightBox.trigger('click');
                            return true;
                        }
                    }, 'waits', TIMEOUT);

                    j.runs(function () {
                        _.defer(function () {
                            var page = $('.file-details.view');
                            j.expect(page.find('.title').text()).toEqual(testtitle);
                        });
                    });
                });

            });//END: j.describe
        } //END: test
    }); //END: ext.point

});
