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

define(['io.ox/mail/listview', 'io.ox/mail/api'], function (listView, api) {

    'use strict';

    describe('The ListView', function () {

        beforeEach(function () {

            this.collection = new api.Collection();
            this.list = listView.getInstance();
            this.list.setCollection(this.collection);
            this.list.model.set({ folder: 'default0/INBOX', limit: 30 });

            $('body', document).append(
                this.list.render().$el
            );
        });

        afterEach(function () {
            this.list.remove();
        });

        describe('drawing an empty list', function () {

            it('should be empty and have proper markup', function () {

                // we need at least one occurrence (the other one might come from mail app)
                expect($('.list-view', document).length).toBeGreaterThan(0);

                // check overall markup
                var node = this.list.$el;
                expect(node.children().length).toBe(0);
                expect(node.is('ul')).toBe(true);
                expect(node.attr('role')).toBe('listbox');
                expect(node.attr('tabindex')).toBe('1');
            });
        });

        describe('drawing a list with one item', function () {

            beforeEach(function () {
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":0,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"44773","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"44773","folder_id":"default0/INBOX","flags":0,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have one list item with proper markup', function () {
                var items = this.list.$el.children(),
                    model = this.collection.at(0);
                expect(items.length).toBe(1);
                expect(items.is('li')).toBe(true);
                expect(items.hasClass('list-item')).toBe(true);
                expect(items.attr('role')).toBe('option');
                expect(items.attr('data-cid')).toBe(model.cid);
            });

            it('should be empty again if item gets removed', function () {
                this.collection.remove(this.collection.at(0));
                expect(this.list.$el.children().length).toBe(0);
            });

            it('should be empty again if collection is reset', function () {
                this.collection.reset();
                expect(this.list.$el.children().length).toBe(0);
            });

            it('should have one list item', function () {
                expect(this.list.$el.children().length).toBe(1);
            });

            it('should contain proper data', function () {
                var node = this.list.$el.children().first();
                expect(node.find('.from').text()).toBe('Matthias Biggeleben');
                expect(node.find('.subject').text()).toBe('A simple text email');
            });
        });

        describe('drawing a list with multiple items', function () {

            beforeEach(function () {
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":0,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":0,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":34,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":34,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have two visible items', function () {
                // three in collection but only two visible
                expect(this.collection.length).toBe(3);
                expect(this.list.$el.children().length).toBe(3);
                expect(this.list.$el.children().not('.hidden').length).toBe(2);
            });

            it('should have one unread item', function () {
                expect(this.list.$el.find('.icon-unread.icon-circle').length).toBe(1);
            });

            it('should have one item with attachments', function () {
                expect(this.list.$el.find('.icon-paper-clip').length).toBe(1);
            });

            it('should reflect unread updates via model change', function () {
                // set first mail to unread
                this.collection.at(0).set('flags', 0);
                expect(this.list.$el.find('.icon-unread.icon-circle').length).toBe(2);
            });

            it('should reflect unread updates via collection change', function () {
                // set first mail to unread via collection
                this.collection.add([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":0,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":0,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ], { merge: true });
                expect(this.list.$el.find('.icon-unread.icon-circle').length).toBe(2);
            });

            it('should reflect an item removal', function () {
                // remove second item
                this.collection.remove(this.collection.at(1));
                expect(this.list.$el.children().length).toBe(2);
            });
        });

        describe('check selection', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should contain items with .selectable class only', function () {
                expect(this.list.$el.children('.selectable').length).toBe(3);
            });

            it('should contain no item with .selected class ', function () {
                expect(this.list.$el.children('.selected').length).toBe(0);
            });

            it('should contain items with tabindex=-1 only', function () {
                expect(this.list.$el.children('[tabindex="-1"]').length).toBe(3);
            });

            it('should have an empty selection', function () {
                expect(this.list.selection.get()).toEqual([]);
            });

            it('should handle keyboard events correctly', function () {

                var e, nodes = this.list.$el.children();

                // focus outer container and simulate cursor down event
                e = $.Event('keydown', { which: 40 });
                this.list.$el.focus().trigger(e);

                expect(this.list.selection.get().length).toBe(1);
                expect(nodes.eq(0).is('[tabindex="1"]')).toBe(true);
                expect(nodes.filter('.selected').length).toBe(1);
                expect(nodes.filter('[tabindex="-1"]').length).toBe(2);

                // if list item has focus, outer node should have class "has-focus"
                expect(this.list.$el.hasClass('has-focus')).toBe(true);

                // cursor down again
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);

                expect(nodes.eq(1).is('[tabindex="1"]')).toBe(true);

                // cursor down again
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(2).is('[tabindex="1"]')).toBe(true);

                // cursor down again to check boundary
                e = $.Event('keydown', { which: 40 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(2).is('[tabindex="1"]')).toBe(true);

                // cmd + cursor up
                e = $.Event('keydown', { which: 38, metaKey: true });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(0).is('[tabindex="1"]')).toBe(true);

                // cursor up again to check boundary
                e = $.Event('keydown', { which: 38 });
                $(document.activeElement).trigger(e);
                expect(nodes.eq(0).is('[tabindex="1"]')).toBe(true);
            });

            it('should handle click events correctly', function () {

                var type = Modernizr.touch ? 'tap' : 'mousedown',
                    nodes = this.list.$el.children(), e;

                // start with empty selection
                expect(this.list.selection.get().length).toBe(0);

                // click on first item
                e = $.Event(type)
                nodes.eq(0).trigger(e);
                expect(this.list.selection.get().length).toBe(1);
                expect(nodes.eq(0).is('.selected')).toBe(true);

                // click on second item
                e = $.Event(type);
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get().length).toBe(1);
                expect(nodes.eq(1).is('.selected')).toBe(true);

                // click on first item and shift click on third
                e = $.Event(type);
                nodes.eq(0).trigger(e);
                e = $.Event(type, { shiftKey: true });
                nodes.eq(2).trigger(e);
                expect(this.list.selection.get().length).toBe(3);
                expect(nodes.filter('.selected').length).toBe(3);

                // click on second item with cmd/ctrl click
                e = $.Event(type, { metaKey: true });
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get().length).toBe(2);
                expect(nodes.eq(0).is('.selected')).toBe(true);
                expect(nodes.eq(1).is('.selected')).toBe(false);
                expect(nodes.eq(2).is('.selected')).toBe(true);

                // invert selection by another click
                e = $.Event(type);
                nodes.eq(1).trigger(e);
                expect(this.list.selection.get().length).toBe(1);
                expect(nodes.eq(0).is('.selected')).toBe(false);
                expect(nodes.eq(1).is('.selected')).toBe(true);
                expect(nodes.eq(2).is('.selected')).toBe(false);
            });
        });

        describe('busy state', function () {

            beforeEach(function () {
                // three undeleted, seen mails
                this.collection.reset([
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"1","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"1","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":true,"account_name":"E-Mail","id":"2","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"2","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}'),
                    JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"3","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"3","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}')
                ]);
            });

            it('should have no busy indicator', function () {
                expect(this.list.getBusyIndicator().length).toBe(0);
            });

            it('should have one busy indicator', function () {
                this.list.busy();
                this.list.busy(); // check for duplicate
                expect(this.list.getBusyIndicator().length).toBe(1);
            });

            it('should add and remove the busy indicator properly', function () {
                this.list.busy();
                expect(this.list.getBusyIndicator().length).toBe(1);
                this.list.idle(); // check for duplicate
                expect(this.list.getBusyIndicator().length).toBe(0);
            });
        });

        describe('scroll test', function () {

            var N = 30;

            function createItem(index) {
                return JSON.parse('{"to":[["\\"Matthias Biggeleben\\"","matthias.biggeleben@open-xchange.com"]],"flags":32,"account_id":0,"subject":"A simple text email","color_label":0,"unreadCount":1,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"account_name":"E-Mail","id":"' + index + '","folder_id":"default0/INBOX","priority":3,"thread":[{"to":[["\\"Dr. Matthias Biggeleben\\\"","matthias.biggeleben@open-xchange.com"]],"id":"' + index + '","folder_id":"default0/INBOX","flags":32,"account_id":0,"priority":3,"subject":"A simple text email","color_label":0,"received_date":1384339346000,"from":[["Matthias Biggeleben","matthias.biggeleben@open-xchange.com"]],"attachment":false,"cc":[],"account_name":"E-Mail"}],"cc":[]}');
            }

            beforeEach(function () {
                // 30 undeleted, seen mails
                this.collection.reset(_.range(N).map(createItem));
                // set fixed height and overflow
                this.list.$el.css({ height: '500px', overflow: 'auto' });

                var self = this;
                this.list.fetch = function () {
                    self.bazinga = true;
                    return _.wait(1000);
                };
            });

            it('should contain correct number of items', function () {
                expect(this.list.$el.children().length).toBe(N);
            });

            it('should have an outer height greater than zero', function () {
                expect(this.list.$el.height()).toBeGreaterThan(0);
            });

            it('should have items with a height greater than zero', function () {
                expect(this.list.$el.children().height()).toBeGreaterThan(0);
            });

            it('should fetch new data on scroll', function () {

                // trigger scroll
                this.list.$el.scrollTop(2000);

                waitsFor(function () {
                    return this.bazinga === true;
                }, 'no data was fetched', 1000);

                runs(function () {
                    expect(this.list.getBusyIndicator().length).toBe(1);
                });
            });
        });
    });
});
