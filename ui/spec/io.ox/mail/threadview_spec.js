/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/mail/threadview', 'io.ox/mail/api', 'fixture!io.ox/mail/thread.json'], function (threadview, api, fixture) {

    'use strict';

    describe('Mail Threadview', function () {

        beforeEach(function () {
            this.view = new threadview.Desktop();
            $('body', document).append(
                this.view.render().$el
            );
        });

        afterEach(function () {
            this.view.remove();
        });

        describe('Markup.', function () {

            it('should be a <div> tag', function () {
                expect(this.view.$el.prop('tagName')).to.equal('DIV');
            });

            it('should have proper css class', function () {
                expect(this.view.$el.hasClass('thread-view-control')).to.be.true;
            });

            it('has hidden back navigation', function () {
                var node = this.view.$el.find('.back-navigation');
                expect(node.length, 'exists').to.equal(1);
                expect(this.view.$el.hasClass('back-navigation-visible'), 'visible').to.be.false;
                expect(node.hasClass('generic-toolbar'), 'generic-toolbar').to.be.true;
            });

            it('has a scrollable list', function () {
                var node = this.view.$el.find('.thread-view-list');
                expect(node.length, 'exists').to.equal(1);
                expect(node.hasClass('scrollable'), 'scrollable').to.be.true;
            });
        });

        describe('Basic behavior.', function () {

            it('should update position', function () {
                this.view.updatePosition(1337);
                expect(this.view.$el.find('.back-navigation .position').text()).to.equal('1337');
            });

            it('should toggle "previous" state', function () {
                this.view.togglePrevious(false);
                expect(this.view.$el.find('.previous-mail').hasClass('disabled')).to.be.true;
            });

            it('should toggle "next" state', function () {
                this.view.toggleNext(false);
                expect(this.view.$el.find('.next-mail').hasClass('disabled')).to.be.true;
            });

            it('should be empty', function () {
                expect(this.view.getItems().length).to.equal(0);
            });
        });

        describe('Display thread.', function () {

            beforeEach(function () {

                var mail_C = _.extend({}, fixture.template, fixture.mail_C),
                    mail_B = _.extend({}, fixture.template, fixture.mail_B),
                    mail_A = _.extend({}, fixture.template, fixture.mail_A);

                mail_C.thread = [_.extend({}, mail_C), mail_B, mail_A];

                api.threads.clear();
                api.processThreadMessage(mail_C);
                this.view.show('default0/INBOX.1', true);
            });

            it('should be found in API\'s threads hash', function () {
                expect(api.threads.hash).to.include.key('default0/INBOX.1');
            });

            it('should be found in detail pool', function () {
                expect(api.pool.get('detail').length).to.equal(3);
            });

            it('should return proper thread', function () {
                var thread = _(api.threads.get('default0/INBOX.1')).map(_.cid);
                expect(thread).to.eql(['default0/INBOX.3', 'default0/INBOX.2', 'default0/INBOX.1']);
            });

            it('should have a collection of 3 items', function () {
                expect(this.view.collection.length).to.equal(3);
            });

            it('should have 3 list items', function () {
                expect(this.view.getItems().length).to.equal(3);
            });

            it('should be an unordered list with three <li> elements', function () {
                var list = this.view.$el.find('.thread-view.list-view');
                expect(list.length).to.equal(1);
                expect(list.is('div')).to.be.true;
                expect(list.children('article').length).to.equal(3);
            });

            it('should have a proper headline', function (done) {
                var h1 = this.view.$el.find('.thread-view-list h1');
                // use setTimeout because updateHeader is debounced
                setTimeout(function () {
                    expect(h1.length).to.equal(1);
                    expect(h1.find('.subject').text()).to.equal('A simple text email');
                    expect(h1.find('.summary').text()).to.equal('3 Nachrichten in dieser Konversation');
                    done();
                }, 20);
            });

            it('should have a descending z-index', function () {
                var indexes = _(this.view.getItems()).map(function (node) {
                    return $(node).css('position', 'relative').css('zIndex');
                });
                expect(indexes).to.eql(['3', '2', '1']);
            });

            it('should auto-select the most recent email', function () {
                var items = this.view.getItems();
                expect(items.eq(0).hasClass('expanded'), 'first').to.be.true;
                expect(items.eq(1).hasClass('expanded'), 'second').to.be.false;
                expect(items.eq(2).hasClass('expanded'), 'third').to.be.false;
            });

            it('should show messages in correct order', function () {
                var items = this.view.getItems();
                expect(items.eq(0).find('.from').text()).to.equal('Otto Xentner');
                expect(items.eq(1).find('.from').text()).to.equal('Matthias Biggeleben');
                expect(items.eq(2).find('.from').text()).to.equal('Otto Xentner');
            });

            it('should not mix up first and last messages', function () {
                var items = this.view.getItems();
                expect(items.eq(0).find('.date').text()).to.equal('13.11.2013 23:42');
                expect(items.eq(1).find('.date').text()).to.equal('13.11.2013 17:42');
                expect(items.eq(2).find('.date').text()).to.equal('13.11.2013 11:42');
            });

            describe('Add a message', function () {

                beforeEach(function () {

                    var mail_D = _.extend({}, fixture.template, fixture.mail_D),
                        mail_C = _.extend({}, fixture.template, fixture.mail_C),
                        mail_B = _.extend({}, fixture.template, fixture.mail_B),
                        mail_A = _.extend({}, fixture.template, fixture.mail_A);

                    mail_D.thread = [_.extend({}, mail_D), mail_C, mail_B, mail_A];
                    api.processThreadMessage(mail_D);
                });

                it('should have 4 list items', function () {
                    expect(this.view.collection.length, 'collection').to.equal(4);
                    expect(this.view.getItems().length, 'items').to.equal(4);
                });

                it('should have a descending z-index', function () {
                    var indexes = _(this.view.getItems()).map(function (node) {
                        return $(node).css('position', 'relative').css('zIndex');
                    });
                    expect(indexes).to.eql(['4', '3', '2', '1']);
                });

                it('should show messages in correct order', function () {
                    var items = this.view.getItems();
                    expect(items.eq(0).find('.from').text()).to.equal('Foo foo');
                    expect(items.eq(1).find('.from').text()).to.equal('Otto Xentner');
                    expect(items.eq(2).find('.from').text()).to.equal('Matthias Biggeleben');
                    expect(items.eq(3).find('.from').text()).to.equal('Otto Xentner');
                });
            });

            describe('Insert an alternative message', function () {

                beforeEach(function () {

                    var mail_D = _.extend({}, fixture.template, fixture.mail_D),
                        mail_C = _.extend({}, fixture.template, fixture.mail_C_alt),
                        mail_B = _.extend({}, fixture.template, fixture.mail_B),
                        mail_A = _.extend({}, fixture.template, fixture.mail_A);

                    mail_D.thread = [_.extend({}, mail_D), mail_C, mail_B, mail_A];
                    api.processThreadMessage(mail_D);
                });

                it('should have 4 list items', function () {
                    expect(this.view.collection.length, 'collection').to.equal(4);
                    expect(this.view.getItems().length, 'items').to.equal(4);
                });

                it('should have a descending z-index', function () {
                    var indexes = _(this.view.getItems()).map(function (node) {
                        return $(node).css('position', 'relative').css('zIndex');
                    });
                    expect(indexes).to.eql(['4', '3', '2', '1']);
                });

                it('should show messages in correct order', function () {
                    var items = this.view.getItems();
                    expect(items.eq(0).find('.from').text()).to.equal('Foo foo');
                    expect(items.eq(1).find('.from').text()).to.equal('Alternative');
                    expect(items.eq(2).find('.from').text()).to.equal('Matthias Biggeleben');
                    expect(items.eq(3).find('.from').text()).to.equal('Otto Xentner');
                });
            });

            describe('Remove a message', function () {

                beforeEach(function () {

                    var mail_C = _.extend({}, fixture.template, fixture.mail_C),
                        mail_A = _.extend({}, fixture.template, fixture.mail_A);

                    mail_C.thread = [_.extend({}, mail_C), mail_A];
                    api.processThreadMessage(mail_C);
                });

                it('should have 2 list items', function () {
                    expect(this.view.collection.length, 'collection').to.equal(2);
                    expect(this.view.getItems().length, 'items').to.equal(2);
                });

                it('should have a descending z-index', function () {
                    var indexes = _(this.view.getItems()).map(function (node) {
                        return $(node).css('position', 'relative').css('zIndex');
                    });
                    expect(indexes).to.eql(['3', '1']);
                });

                it('should show messages in correct order', function () {
                    var items = this.view.getItems();
                    expect(items.eq(0).find('.from').text()).to.equal('Otto Xentner');
                    expect(items.eq(1).find('.from').text()).to.equal('Otto Xentner');
                });
            });
        });

        describe('Respond to removal of the one and only message.', function () {

            beforeEach(function () {

                var mail_A = _.extend({}, fixture.template, fixture.mail_A);
                mail_A.thread = [_.extend({}, mail_A)];

                api.threads.clear();
                api.processThreadMessage(mail_A);
                this.view.show('default0/INBOX.1');

                // delete message
                var model = api.pool.get('detail').get('default0/INBOX.1');
                api.pool.get('detail').remove(model);
            });

            it('should have 0 list items', function () {
                expect(this.view.collection.length, 'collection').to.equal(0);
                expect(this.view.getItems().length, 'items').to.equal(0);
            });

            it('should not show anything', function () {
                var node = this.view.$el.find('.thread-view-list');
                expect(node.length, 'exists').to.equal(1);
                expect(node.is(':visible'), 'invisible').to.be.false;
            });
        });
    });
});
