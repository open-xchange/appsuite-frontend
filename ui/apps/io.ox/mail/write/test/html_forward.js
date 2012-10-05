/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/mail/write/test/html_forward',
    ['io.ox/mail/main',
     'io.ox/mail/api',
     'io.ox/core/api/user',
     'io.ox/core/extensions'], function (mailer, mailAPI, userAPI, ext) {

    'use strict';

    var base = ox.base + '/apps/io.ox/mail/write/test',
        TIMEOUT = 5000;

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

    function trim(str) {
        return $.trim((str + '').replace(/[\r\n]+/g, ''));
    }

    /*
     * Suite: Compose mail
     */
    ext.point('test/suite').extend({
        id: 'mail-forward-html',
        index: 100,
        test: function (j) {

            j.describe('Forward email', function () {
                var app = null, ed = null, form = null;

                j.it('opens mailer', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'compose dialog', TIMEOUT);

                    mailer.getApp().launch().done(function () {
                        var app = this;

                        loaded.yep();
                        j.expect(app).toBeDefined();
                    });

                });

                j.it('select first mail', function () {
                    var firstMailItem = $('.leftside .mail').eq(0);
                    firstMailItem.trigger("click");
                });

                j.waitsFor(function () {
                    var formFrame = $('.rightside .io-ox-action-link');
                    if (formFrame[0]) {
                        return true;
                    }
                }, 'no editor there', TIMEOUT);

                j.it('forward mail', function () {
                    $('.rightside .io-ox-action-link[data-action=forward]').trigger("click");
                });


                j.it('add recipent', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'adding recipent', TIMEOUT);
                    var myself = ox.user_id;
                    userAPI.get({ id: myself })
                    .done(function (myself) {
                        loaded.yep();

                        $('input[data-type=to]').val('"' + myself.display_name + '" ' + myself.email1)
                        .focus()
                        .trigger($.Event('keyup', { which: 13 }));

                    });

                });

                // check for recipent list had one entry
                j.waitsFor(function () {
                    if ($('.recipient-list .io-ox-mail-write-contact').length === 1) {
                        return true;
                    }
                }, 'recipent list is empty', TIMEOUT);



                j.waitsFor(function () {
                    var formFrame = $('.editor-outer-container');
                    if (formFrame[0]) {
                        return true;
                    }
                }, 'no editor there', TIMEOUT);


                j.it('change editor to html format', function () {
                    $(".change-format a:contains('HTML')").trigger('click');
                });







                j.it('close the editor', function () {
                    $(".window-controls .close").trigger('click');
                });

                j.waitsFor(function () {
                    var modalPoup = $('.modal-footer');
                    if (modalPoup[0]) {
                        return true;
                    }
                }, 'no popup there', TIMEOUT);

                j.it('lose changes', function () {
                    $('.modal-footer .btn-primary').trigger('click');
                });
            });
        }
    });

});
