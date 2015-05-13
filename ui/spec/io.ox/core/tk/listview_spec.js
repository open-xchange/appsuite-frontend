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

define(['io.ox/mail/listview', 'io.ox/mail/api', 'waitsFor'], function (ListView, api, waitsFor) {

    'use strict';

    describe('The ListView.', function () {
        var pictureHalo;

        beforeEach(function () {

            this.collection = new api.Collection();
            this.list = new ListView({
                threaded: true,
                //mail listview needs a reference to the app.props model to listenTo
                //changes:thread event (support threaded mails)
                app: {
                    props: new Backbone.Model()
                }
            });
            this.list.model.set({ folder: 'default0/INBOX', limit: 30 });
            this.list.setCollection(this.collection);

            $('body', document).append(
                this.list.render().$el
            );

            return require(['io.ox/contacts/api'], function (contactsAPI) {
                pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
            });
        });

        afterEach(function (done) {
            pictureHalo.restore();
            //wait a little bit for debounced code to run
            _.delay(function () {
                this.list.remove();
                done();
            }.bind(this), 60);
        });

        describe('drawing an empty list', function () {

            it('should be empty and have proper markup', function () {

                // we need at least one occurrence (the other one might come from mail app)
                expect($('.list-view', document)).to.have.length.above(0);

                // check overall markup
                var node = this.list.$el;
                expect(node.children(), 'children').to.have.length(0);
                expect(node.is('ul'), '<ul> tag').to.be.true;
                expect(node.attr('role'), 'role').to.equal('listbox');
                expect(node.attr('tabindex'), 'tabindex').to.equal('1');
                // no-transition class is only set for phantomjs
                expect(node.hasClass('no-transition'), 'no transition').to.equal(_.device('phantomjs'));
            });
        });

        describe('drawing a list with one item', function () {

            beforeEach(function () {
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":0,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"44773","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"44773","folder_id":"default0/INBOX","flags":0,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have one list item with proper markup', function () {
                var items = this.list.$el.children(),
                    model = this.collection.at(0);
                expect(items.length).to.equal(1);
                expect(items.is('li')).to.be.true;
                expect(items.hasClass('list-item')).to.be.true;
                expect(items.attr('role')).to.equal('option');
                expect(items.attr('data-cid')).to.equal('thread.' + model.cid);
            });

            it('should have one list item', function () {
                expect(this.list.$el.children().length).to.equal(1);
            });

            it('should be empty again if item gets removed', function () {
                this.collection.remove(this.collection.at(0));
                expect(this.list.$el.children().length).to.equal(0);
            });

            it('should be empty again if collection is reset', function () {
                this.collection.reset();
                expect(this.list.$el.children().length).to.equal(0);
            });

            it('should contain proper data', function () {
                var node = this.list.$el.children().first();
                expect(node.find('.from').text()).to.equal('Matthias Biggeleben');
                expect(node.find('.subject').text()).to.equal('A simple text email');
            });
        });

        describe('drawing a list with multiple items', function () {

            beforeEach(function () {
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email #1","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email #2","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":34,"account_id":0,"subject":"A simple text email #3","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":34,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have one deleted item', function () {
                expect(this.collection.length).to.equal(3);
                expect(this.list.$el.children().length).to.equal(3);
                expect(this.list.$el.children('.deleted').length).to.equal(1);
            });

            it('should have one item with attachments', function () {
                expect(this.list.$('.fa-paperclip').length).to.equal(1);
            });

            it('should reflect unread updates via model change', function () {
                // set first mail to deleted
                this.collection.at(1).set('flags', 34);
                expect(this.list.$el.children('.deleted').length).to.equal(2);
            });

            it('should reflect unread updates via collection change', function () {
                // set first mail to unread via collection
                this.collection.add([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":34,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":34,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ], { merge: true });
                expect(this.list.$el.children('.deleted').length).to.equal(2);
            });

            it('should reflect an item removal', function () {
                // remove second item
                this.collection.remove(this.collection.at(1));
                expect(this.list.$el.children().length).to.equal(2);
            });
        });

        describe('selection', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should contain items with .selectable class only', function () {
                expect(this.list.$el.children('.selectable').length).to.equal(3);
            });

            it('should contain no item with .selected class ', function () {
                expect(this.list.$el.children('.selected').length).to.equal(0);
            });

            it('should contain items with tabindex=-1 only', function () {
                expect(this.list.$el.children('[tabindex="-1"]').length).to.equal(3);
            });

            it('should have an empty selection', function () {
                expect(this.list.selection.get()).to.be.empty;
            });

            it('should handle keyboard events correctly', function () {

                var e, nodes = this.list.$el.children();

                // focus outer container and simulate cursor down event
                e = $.Event('keydown', { which: 40 });
                this.list.$el.focus().trigger(e);

                expect(this.list.selection.get().length).to.equal(1);
                expect(nodes.eq(0).is('[tabindex="1"]')).to.be.true;
                expect(nodes.filter('.selected').length).to.equal(1);
                expect(nodes.filter('[tabindex="-1"]').length).to.equal(2);

                // if list item has focus, outer node should have class "has-focus"
                expect(this.list.$el.hasClass('has-focus')).to.be.true;

                // cursor down again
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);

                expect(nodes.eq(1).is('[tabindex="1"]')).to.be.true;

                // cursor down again
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(2).is('[tabindex="1"]')).to.be.true;

                // cursor down again to check boundary
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(2).is('[tabindex="1"]')).to.be.true;

                // cmd + cursor up
                e = $.Event('keydown', { which: 38, metaKey: true });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(0).is('[tabindex="1"]')).to.be.true;

                // cursor up again to check boundary
                e = $.Event('keydown', { which: 38 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(0).is('[tabindex="1"]')).to.be.true;
            });

            it('should handle click events correctly', function () {

                var type = _.device('touch') ? 'tap' : 'click',
                    nodes = this.list.$el.children(), e;

                // start with empty selection
                expect(this.list.selection.get(), 'with empty selection').to.have.length(0);

                // click on first item
                e = $.Event(type);
                nodes.eq(0).trigger(e);
                expect(this.list.selection.get(), 'click on first item').to.have.length(1);
                expect(nodes.eq(0).is('.selected')).to.be.true;

                // click on second item
                e = $.Event(type);
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get(), 'click on second item').to.have.length(1);
                expect(nodes.eq(1).is('.selected')).to.be.true;

                // click on first item and shift click on third
                e = $.Event(type);
                nodes.eq(0).trigger(e);
                e = $.Event(type, { shiftKey: true });
                nodes.eq(2).trigger(e);
                expect(this.list.selection.get(), 'click on first item and shift + click on third').to.have.length(3);
                expect(nodes.filter('.selected').length).to.equal(3);

                // click on second item with cmd/ctrl click
                e = $.Event(type, { metaKey: true });
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get(), 'click on second item with meta key pressed').to.have.length(2);
                expect(nodes.eq(0).is('.selected')).to.be.true;
                expect(nodes.eq(1).is('.selected')).to.equal(false);
                expect(nodes.eq(2).is('.selected')).to.be.true;

                // invert selection by another click
                e = $.Event(type);
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get(), 'invert selection').to.have.length(1);
                expect(nodes.eq(0).is('.selected')).to.equal(false);
                expect(nodes.eq(1).is('.selected')).to.be.true;
                expect(nodes.eq(2).is('.selected')).to.equal(false);
            });
        });

        function createItem(id, index) {
            var obj = JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"' + id + '","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"' + id + '","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}');
            obj.subject = obj.subject + ' #' + id;
            obj.index = index;
            return obj;
        }

        describe('reload data', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([createItem(3, 0), createItem(5, 1), createItem(6, 2)]);
                // add header element
                this.list.$el.append(
                    $('<li class="list-header" style="background: red; height: 50px">')
                );
            });

            it('is exptected that models have an index attribute', function () {
                expect(this.collection.at(0).has('index')).to.be.true;
            });

            it('should have three mails', function () {
                expect(this.list.getItems().length).to.equal(3);
            });

            it('should update properly (case: empty)', function () {

                // remove all
                this.collection.set([]);

                expect(this.list.collection.length).to.equal(0);
                expect(this.list.getItems().length).to.equal(0); // all list items were removed
                expect(this.list.$el.children().length).to.equal(1); // header element still there
            });

            it('should update properly (case: prepend)', function () {

                // add 1, add 2
                this.collection.set([createItem(1, 0), createItem(2, 1), createItem(3, 2), createItem(4, 3), createItem(6, 4)]);

                var nodes = this.list.$el.children(),
                    items = this.list.getItems();

                expect(this.list.collection.length).to.equal(5);
                expect(items.length).to.equal(5);
                expect(nodes.length).to.equal(6); // plus header element
                expect(items.eq(0).is('[data-cid="thread.default0/INBOX.1"]')).to.be.true;
                expect(items.eq(1).is('[data-cid="thread.default0/INBOX.2"]')).to.be.true;
                expect(items.eq(2).is('[data-cid="thread.default0/INBOX.3"]')).to.be.true;
                expect(items.eq(3).is('[data-cid="thread.default0/INBOX.4"]')).to.be.true;
                expect(items.eq(4).is('[data-cid="thread.default0/INBOX.6"]')).to.be.true;
            });

            it('should update properly (case: append)', function () {

                // add 7
                this.collection.reset([createItem(3, 0), createItem(5, 1), createItem(6, 2), createItem(7, 3)]);

                var nodes = this.list.$el.children(),
                    items = this.list.getItems();

                expect(this.list.collection.length).to.equal(4);
                expect(items.length).to.equal(4);
                expect(nodes.length).to.equal(4); // reset removes header element
                expect(items.eq(0).is('[data-cid="thread.default0/INBOX.3"]')).to.be.true;
                expect(items.eq(1).is('[data-cid="thread.default0/INBOX.5"]')).to.be.true;
                expect(items.eq(2).is('[data-cid="thread.default0/INBOX.6"]')).to.be.true;
                expect(items.eq(3).is('[data-cid="thread.default0/INBOX.7"]')).to.be.true;
            });

            it('should update properly (case: mixed)', function () {

                // add 1, add 2, remove 3, add 4, remove 5, add 7
                this.collection.set([createItem(1, 0), createItem(2, 1), createItem(4, 2), createItem(6, 3), createItem(7, 4)]);

                var nodes = this.list.$el.children(),
                    items = this.list.getItems();

                expect(this.list.collection.length).to.equal(5);
                expect(items.length).to.equal(5);
                expect(nodes.length).to.equal(6); // plus header element
                expect(items.eq(0).is('[data-cid="thread.default0/INBOX.1"]')).to.be.true;
                expect(items.eq(1).is('[data-cid="thread.default0/INBOX.2"]')).to.be.true;
                expect(items.eq(2).is('[data-cid="thread.default0/INBOX.4"]')).to.be.true;
                expect(items.eq(3).is('[data-cid="thread.default0/INBOX.6"]')).to.be.true;
                expect(items.eq(4).is('[data-cid="thread.default0/INBOX.7"]')).to.be.true;
            });
        });

        describe('busy state', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have no busy indicator', function () {
                expect(this.list.getBusyIndicator().length).to.equal(0);
            });

            it('should have one busy indicator', function () {
                this.list.busy();
                this.list.busy(); // check for duplicate
                expect(this.list.getBusyIndicator().length).to.equal(1);
            });

            it('should add and remove the busy indicator properly', function () {
                this.list.busy();
                expect(this.list.getBusyIndicator().length).to.equal(1);
                this.list.idle(); // check for duplicate
                expect(this.list.getBusyIndicator().length).to.equal(0);
            });
        });

        describe('infinite scrolling', function () {

            var N = 30;

            beforeEach(function () {
                // 30 undeleted, seen mails
                this.collection.reset(_.range(N).map(createItem));
                // set fixed height and overflow
                this.list.$el.css({ height: '500px', overflow: 'auto' });
            });

            it('should contain correct number of items (collection)', function () {
                expect(this.list.collection.length).to.equal(N);
            });

            it('should contain correct number of items (DOM)', function () {
                expect(this.list.getItems().length).to.equal(N);
            });

            it('should have an outer height greater than zero', function () {
                expect(this.list.$el.height()).to.be.above(0);
            });

            it('should have items with a height greater than zero', function () {
                expect(this.list.$el.children().height()).to.be.above(0);
            });

            it('should load new data on scroll', function (done) {
                // add paginate function
                var list = this.list;
                list.paginate = function () { return _.wait(500); };
                // trigger scroll
                list.$el.scrollTop(2000);
                waitsFor(function () {
                    return list.getBusyIndicator().length === 1;
                }).then(function () {
                    expect(list.getBusyIndicator().length).to.equal(1);
                    done();
                });
            });
        });

        describe('keep scroll position during updates', function () {
            //rendering is a bit slow in phantomjs
            //FIXME: speed things up, again
            this.timeout(10000);

            _([20, 50, 80]).each(function (INDEX) {

                it('keeps excact scroll position during updates (INDEX=' + INDEX + ')', function () {

                    // fill
                    this.collection.reset(_.range(1, 100).map(createItem));
                    this.list.selection.select(INDEX);
                    var top = this.list.getItems().eq(INDEX).offset().top;

                    // remove some
                    this.collection.set(_.range(20, 80).map(createItem));

                    // re-add
                    this.collection.set(_.range(1, 100).map(createItem));

                    expect(this.list.getItems().eq(INDEX).offset().top).to.equal(top);
                });
            });
        });

        describe('traversing', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
                this.list.selection.select(0);
                this.list.toggleComplete(true);
            });

            it('should return correct position', function () {
                expect(this.list.getPosition()).to.equal(0);
            });

            it('should indicate no previous item', function () {
                expect(this.list.hasPrevious()).to.be.false;
            });

            it('should indicate next item', function () {
                expect(this.list.hasNext()).to.be.true;
            });

            it('should move to next item', function () {
                this.list.selection.next();
                expect(this.list.getPosition(), 'position').to.equal(1);
                expect(this.list.hasNext(), 'next').to.be.true;
            });

            it('should should indicate previous item', function () {
                this.list.next();
                expect(this.list.hasPrevious()).to.be.true;
            });

            it('should should indicate no next item', function () {
                this.list.next();
                this.list.next();
                expect(this.list.getPosition(), 'position').to.equal(2);
                expect(this.list.hasPrevious(), 'previous').to.be.true;
                expect(this.list.hasNext(), 'next').to.be.false;
            });

            it('should move around correctly', function () {
                expect(this.list.getPosition(), 'position #1').to.equal(0);
                this.list.previous();
                this.list.previous();
                expect(this.list.getPosition(), 'position #2').to.equal(0);
                this.list.next();
                expect(this.list.getPosition(), 'position #3').to.equal(1);
                this.list.next();
                expect(this.list.getPosition(), 'position #4').to.equal(2);
                this.list.next();
                expect(this.list.getPosition(), 'position #5').to.equal(2);
                this.list.previous();
                expect(this.list.getPosition(), 'position #6').to.equal(1);
                this.list.previous();
                expect(this.list.getPosition(), 'position #7').to.equal(0);
            });
        });

        // TODO: move the following code to mail specific spec
        describe('mail specific robustness', function () {

            beforeEach(function () {
                // no from, empty subject, nulled flags, no received date
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":null,"account_id":0,' +
                        '"subject":"","color_label":null,"unreadCount":1,' +
                        '"from":[[]],"attachment":false,' +
                        '"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,' +
                        '"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],' +
                        '"id":"1","folder_id":"default0/INBOX","flags":null,"account_id":0,"priority":3,' +
                        '"subject":"","color_label":null,' +
                        '"from":[[]],' +
                        '"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'
                    )
                ]);
            });

            it('should indicate the missing subject', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.subject').text()).not.to.equal('');
            });

            it('should indicate the missing sender', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.from').text()).not.to.equal('');
            });

            it('should have no received_date', function () {
                var first = this.list.$el.children().first();
                expect(first.find('time').length).to.equal(0);
            });

            it('should indicate item as seen', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.icon-unread.fa-envelope').length).to.equal(0);
            });

            it('should show attachment icon', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.fa-paperclip').length).to.equal(0);
                this.collection.at(0).set('attachment', true);
                expect(first.find('.fa-paperclip').length).to.equal(1);
            });

            it('should indicate that this mail has been answered', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.icon-answered.fa-reply').length).to.equal(0);
                this.collection.at(0).set('flags', 33); // 32 = seen, 1 = answered
                expect(first.find('.icon-answered.fa-reply').length).to.equal(1);
            });

            it('should indicate that this mail has been fowarded', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.icon-forwarded.fa-mail-forward').length).to.equal(0);
                this.collection.at(0).set('flags', 32 | 256); // 32 = seen, 256 = forwarded
                expect(first.find('.icon-forwarded.fa-mail-forward').length).to.equal(1);
            });

            it('should indicate high priority', function () {
                var first = this.list.$el.children().first();
                this.collection.at(0).set('priority', 1); // 1 = high, 3 = normal, 5 = low
                expect(first.find('.priority .high').length).to.equal(1);
            });

            it('should indicate low priority', function () {
                var first = this.list.$el.children().first();
                this.collection.at(0).set('priority', 5); // 1 = high, 3 = normal, 5 = low
                expect(first.find('.priority .low').length).to.equal(1);
            });

            it('should have no thread size indicator', function () {
                var first = this.list.$el.children().first();
                expect(first.find('.thread-size').length).to.equal(0);
            });
        });

        // rather mail specific but good to test update behavior
        describe('mail threads', function () {

            beforeEach(function () {
                // create thread
                var N = 10, item = createItem(2, 1), data = item.thread[0], array;
                item.thread = _.range(N + 1, 1, -1).map(function (index) {
                    return _.extend({}, data, { id: index, subject: data.subject + ' #' + index });
                });
                item.thread.forEach(function (m) {
                    api.threads.add(m);
                });
                api.threads.add(item);
                this.collection.reset([createItem(12, 0), item, createItem(1, 2)]);
            });

            it('should show proper number of list items', function () {
                var items = this.list.getItems();
                expect(this.collection.length, 'collection length').to.equal(3);
                expect(items.length, 'list view items').to.equal(3);
            });

            it('should have one thread size indicator', function () {
                var items = this.list.getItems();
                expect(items.find('.thread-size').length).to.equal(1);
            });

            it('should show correct thread size', function () {
                var items = this.list.getItems();
                expect(items.eq(1).find('.thread-size .number').text()).to.equal('10');
            });

            it('should have proper CID', function () {
                var model = this.collection.at(1);
                expect(model.cid).to.equal('default0/INBOX.2');
            });

            it('should update correctly (keep position)', function () {
                // update thread
                var tmp = this.collection.toJSON(), data = tmp[1].thread[0];
                tmp[1].thread = tmp[1].thread.slice(2);
                api.threads.clear();
                tmp[1].thread.forEach(function (m) {
                    api.threads.add(m);
                });
                api.threads.add(tmp[1]);
                // update via set() - not reset()!
                this.collection.set(tmp);
                // check
                var items = this.list.getItems();
                expect(this.collection.length, 'collection length').to.equal(3);
                expect(items.length, 'list view items').to.equal(3);
                expect(items.eq(1).find('.thread-size .number').text(), 'thread size').to.equal('8');
                expect(items.eq(1).attr('data-cid'), 'cid').to.equal('thread.default0/INBOX.2');
            });

            it('should update correctly (change position)', function () {
                // update thread
                var tmp = this.collection.toJSON(), data = tmp[1].thread[0];
                tmp[1].thread.unshift(
                    _.extend({}, data, { id: 15, subject: data.subject + ' #' + 15 }),
                    _.extend({}, data, { id: 14, subject: data.subject + ' #' + 14 }),
                    _.extend({}, data, { id: 13, subject: data.subject + ' #' + 13 })
                );
                // fix indexes
                tmp[1].index = 0;
                tmp[0].index = 1;
                // update via set() - not reset()!
                this.collection.set(tmp);
                // check
                var items = this.list.getItems();
                expect(this.collection.length, 'collection length').to.equal(3);
                expect(items.length, 'list view items').to.equal(3);
                expect(items.eq(0).find('.thread-size .number').text(), 'thread size').to.equal('13');
                expect(items.eq(0).attr('data-cid'), 'cid').to.equal('thread.default0/INBOX.2');
            });

            // function createItem(id, index) {
            //     var obj = JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"' + id + '","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"' + id + '","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}');
            //     obj.subject = obj.subject + ' #' + id;
            //     obj.index = index;
            //     return obj;
            // }

            // list.collection.reset([]);

            // // create thread
            // var N = 10, item = createItem(2, 1), data = item.thread[0], array;
            // item.thread = _.range(N + 1, 1, -1).map(function (index) {
            //     return _.extend({}, data, { id: index, subject: data.subject + ' #' + index });
            // });
            // list.collection.reset([createItem(12, 0), item, createItem(1, 2)]);

            // // update thread
            // var tmp = list.collection.toJSON(), data = tmp[1].thread[0];
            // tmp[1].thread = tmp[1].thread.slice(2);
            // // update via set() - not rset()!
            // list.collection.set(tmp);

            // // update thread
            // var tmp = list.collection.toJSON(), data = tmp[1].thread[0];
            // tmp[1].thread.unshift(
            //     _.extend({}, data, { id: 15, subject: data.subject + ' #' + 15 }),
            //     _.extend({}, data, { id: 14, subject: data.subject + ' #' + 14 }),
            //     _.extend({}, data, { id: 13, subject: data.subject + ' #' + 13 })
            // );
            // tmp[1].index = 0;
            // tmp[0].index = 1;
            // list.collection.set(tmp);
        });
    });
});
