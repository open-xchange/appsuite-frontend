/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/mail/write/test/html_reply',
    ['io.ox/mail/main',
     'io.ox/mail/api',
     'io.ox/core/api/user',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/actions'
    ], function (mailer, mailAPI, userAPI, ext, actions) {

    'use strict';

    var TIMEOUT = ox.testTimeout;

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
     * Suite: Compose mail
     */
    ext.point('test/suite').extend({
        id: 'mail-reply-html',
        index: 100,
        test: function (j) {

            j.describe('Reply email', function () {

                var app = null, ed = null, form = null, first, cid;

                j.it('loads first mail in inbox', function () {
                    var done = new Done();
                    j.waitsFor(done, 'fetch mails', TIMEOUT);
                    mailAPI.getAll({ folder: 'default0/INBOX' }).done(function (list) {
                        first = _(list).first();
                        console.debug('reply to email', first);
                        done.yep();
                        j.expect(first).toBeDefined();
                    });
                });

                j.it('reply mail', function () {
                    var done = new Done();
                    j.waitsFor(done, 'trigger reply', TIMEOUT);
                    require(['io.ox/mail/actions'], function () {
                        actions.invoke('io.ox/mail/actions/reply', null, first);
                        done.yep();
                        j.expect(true).toBeDefined();
                    });
                });

                // waits for recipent list in reply form
                j.waitsFor(function () {
                    return !!$('.recipient-list .io-ox-mail-write-contact').length;
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
                    app = ox.ui.App.getByCid('io.ox/mail:reply.' + cid);
                    if (app) {
                        app.dirty(false).quit();
                        j.expect(app.getEditor).toBeUndefined();
                    }
                    app = ed = form = null;
                });
            });
        }
    });

});
