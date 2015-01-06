/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/metrics/demo/register', ['io.ox/core/metrics/bot/main', 'settings!io.ox/mail'], function (bot, settings) {

    'use strict';

    bot.ready(function () {

        this.suite(function () {

            this.test('Test 1', function () {

                this.step('Switch to mail app', function (done) {
                    this.launchApp('io.ox/mail', done);
                });

                this.step('Select first mail', function () {
                    window.list.selection.select(0);
                });

                this.step('Click on reply', function () {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').click();
                });

                this.step('Wait for editor and write 100 words', function (done) {
                    ox.on('mail:reply:ready', function (e, data, app) {
                        app.getEditor().prependContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        this.app = app;
                        done();
                    }.bind(this));
                });

                this.step('Send to myself', function (done) {
                    // clear recipient lists
                    this.app.getWindowNode().find('.recipient-list').empty();
                    // add myself as recipient
                    var to = [['Myself', settings.get('defaultSendAddress')]];
                    this.app.setTo(to);
                    // send
                    this.app.getWindowNode().find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.on('mail:send:stop', done);
                });
            });

            this.test('Test 2', function () {
                this.step('Noop', function () {
                    console.log('Noop');
                });
            });
        });
    });
});
