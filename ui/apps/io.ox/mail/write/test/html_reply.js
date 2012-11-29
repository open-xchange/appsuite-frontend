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

define('io.ox/mail/write/test/html_reply',
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
        id: 'mail-reply-html',
        index: 100,
        test: function (j) {

            j.describe('Reply email', function () {

                var app = null, ed = null, form = null, cid;

                j.it('opens mailer', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'compose dialog', TIMEOUT);

                    mailer.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                        j.expect(app).toBeDefined();
                    });
                });

                // wait for mails to apear on the left side
                j.waitsFor(function () {
                    var mailItems = $('.leftside .mail[data-obj-id]');
                    return !!mailItems.length;
                }, 'no mails there', TIMEOUT * 2);

                j.it('select first mail', function () {
                    var firstMailItem = $('.leftside .mail').eq(0);
                    cid = firstMailItem.attr('data-obj-id');
                    console.log('geil', firstMailItem, cid);
                    firstMailItem.trigger('click');
                });

                // wait for the actions links in the first mail
                j.waitsFor(function () {
                    var actionLinks = $('.rightside .io-ox-action-link');
                    if (actionLinks[0]) {
                        return true;
                    }
                }, 'no action links there', TIMEOUT);

                j.it('reply mail', function () {
                    $('.rightside .io-ox-action-link[data-action=reply]').trigger("click");
                });

                // waits for recipent list in reply form
                j.waitsFor(function () {
                    if ($('.recipient-list .io-ox-mail-write-contact').length === 1) {
                        return true;
                    }
                }, 'recipent list is empty', TIMEOUT);

                j.it('remove original recipent', function () {
                    $('.recipient-list .io-ox-mail-write-contact .remove').trigger('click');
                });

                j.it('add recipent', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'adding recipent', TIMEOUT);
                    var myself = ox.user_id;
                    userAPI.get({ id: myself }).done(function (myself) {
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


                j.it('check for "Re"', function () {
                    // checks for editor
                    var subject = $('.subject-wrapper input:text').val().substring(0, 3);
                    j.expect(subject).toEqual('Re:');
                });

                j.it('closes compose dialog', function () {
                    // get app via cid
                    console.log('CLOSE', cid);
                    app = ox.ui.App.getByCid('io.ox/mail:reply.' + cid);
                    console.log('APP', app);
                    if (app) {
                        console.log('YEAH', app);
                        app.dirty(false).quit();
                        j.expect(app.getEditor).toBeUndefined();
                    }
                    app = ed = form = null;
                });
            });
        }
    });

});
