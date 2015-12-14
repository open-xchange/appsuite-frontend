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
define(['io.ox/mail/compose/main', 'waitsFor'], function (compose, waitsFor) {
    'use strict';

    describe('Mail Compose', function () {

        describe.skip('main app', function () {
            var app, pictureHalo, snippetsGetAll;
            beforeEach(function () {
                return require(['io.ox/core/api/snippets', 'io.ox/contacts/api', 'settings!io.ox/mail'], function (snippetAPI, contactsAPI, settings) {
                    snippetsGetAll = sinon.stub(snippetAPI, 'getAll', function () { return $.when([]); });
                    pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
                    //load plaintext editor, much faster than spinning up tinymce all the time
                    settings.set('messageFormat', 'text');
                }).then(function () {
                    app = compose.getApp();
                    return app.launch();
                });
            });
            afterEach(function () {
                if (app.view && app.view.model) {
                    app.view.model.dirty(false);
                }
                snippetsGetAll.restore();
                pictureHalo.restore();
                return app.quit();
            });

            it('should open up a new mail compose window', function () {
                return app.compose({ folder_id: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:compose');
                });
            });

            it('should provide an edit window', function () {
                this.server.respondWith('PUT', /api\/mail\?action=get/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                return app.edit({ folder_id: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:edit');
                });
            });

            it('should provide a reply window', function () {
                this.server.respondWith('PUT', /api\/mail\?action=reply/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                return app.reply({ folder: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:reply');
                });
            });

            describe('model change events', function () {
                var address = 'testuser@open-xchange.com',
                    addressEntry = [[address, address]];

                beforeEach(function () {
                    return app.compose({ folder_id: 'default0/INBOX' });
                });
                it('should add recipients to "to" tokenfield', function () {
                    app.view.model.set('to', addressEntry);
                    expect(app.view.$el.find('.tokenfield.to .token').attr('title')).to.equal(address);
                });
                it('should add recipients to "cc" tokenfield', function () {
                    app.view.model.set('cc', addressEntry);
                    expect(app.view.$el.find('.tokenfield.cc .token').attr('title')).to.equal(address);
                });
                it('should add recipients to "bcc" tokenfield', function () {
                    app.view.model.set('bcc', addressEntry);
                    expect(app.view.$el.find('.tokenfield.bcc .token').attr('title')).to.equal(address);
                });
                it('should add text to subject', function () {
                    app.view.model.set('subject', 'Test subject');
                    expect(app.view.$el.find('.subject input').val()).to.equal('Test subject');
                });
                it('should set priority to high', function () {
                    app.view.model.set('priority', 0);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="0"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set priority to normal', function () {
                    app.view.model.set('priority', 3);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="3"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set priority to low', function () {
                    app.view.model.set('priority', 5);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="5"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set request read receipt', function () {
                    app.view.model.set('disp_notification_to', true);
                    expect(app.view.$el.find('a[data-name="disp_notification_to"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set attach vcard', function () {
                    app.view.model.set('vcard', 1);
                    expect(app.view.$el.find('a[data-name="vcard"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set attach vcard', function () {
                    app.view.model.set('vcard', 0);
                    expect(app.view.$el.find('a[data-name="vcard"] i').hasClass('fa-check'), ' option is unchecked in menu options').to.be.false;
                });
                it('should change editor mode from text to html', function () {
                    app.view.model.set('editorMode', 'html');
                    return waitsFor(function () {
                        //need to wait, until it is painted, because we started in text mode
                        return app.view.$el.find('.editable-toolbar').is(':visible');
                    }).done(function () {
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.true;
                    });
                });
                it('should change editor mode from html to text', function () {
                    app.view.model.set('editorMode', 'text');
                    return waitsFor(function () {
                        return app.view.$el.find('textarea.plain-text').is(':visible') === true;
                    }).then(function () {
                        expect(app.view.$el.find('textarea.plain-text').is(':visible'), 'plain text editor is visible').to.be.true;
                        expect(app.view.$el.find('.editable-toolbar').is(':visible'), 'tinymce toolbar element is visible').to.be.false;
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.false;
                    });
                });
                it('should change editor mode from text to html', function () {
                    app.view.model.set('editorMode', 'html');
                    return waitsFor(function () {
                        return app.view.$el.find('.editable.mce-content-body').is(':visible') === true;
                    }).then(function () {
                        expect(app.view.$el.find('textarea.plain-text').is(':visible'), 'plain text editor is visible').to.be.false;
                        expect(app.view.$el.find('.editable-toolbar').is(':visible'), 'tinymce toolbar element is visible').to.be.true;
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.true;
                    });
                });

            });
        });
    });
});
