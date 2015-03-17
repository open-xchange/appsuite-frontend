/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/mail/compose/model'], function (MailModel) {
    'use strict';

    describe('Mail Compose', function () {
        describe('attachment handling', function () {
            describe('attachments', function () {
                it('should add nested mails as attachment', function () {
                    var model = new MailModel({
                        nested_msgs: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'nested';
                    }).get('id')).to.equal(10);
                });

                it('should add attached contacts as attachment', function () {
                    var model = new MailModel({
                        contacts_ids: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'contact';
                    }).get('id')).to.equal(10);
                });

                it('should add drive ids as attachment', function () {
                    var model = new MailModel({
                        infostore_ids: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'file';
                    }).get('id')).to.equal(10);
                });
            });
        });
    });
});
