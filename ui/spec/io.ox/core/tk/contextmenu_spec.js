/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/tk/list',
    'io.ox/core/tk/list-contextmenu'
], function (ext, actionsUtil, Listview, Contextmenu) {

    var Action = actionsUtil.Action;

    describe('Core ListView Contextmenu', function () {

        it('should define toggleContextMenu function', function () {
            const view = new (Listview.extend(Contextmenu))({ });
            expect(view.toggleContextMenu).to.be.a('function');
        });

        describe('used with a basic extension', function () {

            let view;

            beforeEach(function () {
                new Action('io.ox/test/actions/testAction', {
                    action: _.noop
                });
                ext.point('io.ox/test/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    label: 'test label'
                });

                view = new (Listview.extend(Contextmenu))({
                    ref: 'io.ox/test',
                    pagination: false,
                    collection: new Backbone.Collection([{ id: 'testItem' }])
                });
                view.collection.complete = true;
                $('body').append(view.render().$el);
                view.selection.select(0);
            });

            afterEach(function () {
                view.remove();
                //cleanup
                let exts = ext.point('io.ox/test/contextmenu').all();
                while (exts.length) exts.pop();
                exts = ext.point('io.ox/test/actions/testAction').all();
                while (exts.length) exts.pop();
            });

            it('should populate dropdown with items from "io.ox/test/contextmenu" extension point', function () {
                return view.toggleContextMenu({ target: $('body') }).done(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(1);
                    expect(view.contextMenu.$menu.is('[role="menu"]')).to.be.true;
                });
            });
        });

        describe('used without any extensions', function () {

            let view;

            beforeEach(function () {
                view = new (Listview.extend(Contextmenu))({
                    ref: 'io.ox/test',
                    pagination: false,
                    collection: new Backbone.Collection([{ id: 'testItem' }])
                });
                view.collection.complete = true;
                $('body').append(view.render().$el);
                view.selection.select(0);
            });

            afterEach(function () {
                view.remove();
            });

            it('should not render anything', function () {
                return view.toggleContextMenu({ target: $('body') }).done(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(0);
                    expect(view.contextMenu.$el.hasClass('open')).to.be.false;
                });
            });
        });

        describe('used in a more advanced context', function () {

            let view;

            beforeEach(function () {

                new Action('io.ox/test/actions/testAction', {
                    action: _.noop
                });

                new Action('io.ox/test/actions/testActionDisabled', {
                    matches: () => false,
                    action: _.noop
                });

                ext.point('io.ox/test/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    title: 'test label'
                }, {
                    id: 'disabledTest',
                    ref: 'io.ox/test/actions/testActionDisabled',
                    section: 'testsection',
                    title: 'test label of disabled action'
                });

                ext.point('io.ox/test/custom/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    title: 'test label'
                }, {
                    id: 'test2',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    title: 'second test label'
                }, {
                    id: 'disabledTest',
                    ref: 'io.ox/test/actions/testActionDisabled',
                    section: 'testsection',
                    title: 'test label of disabled action'
                });


                var model = new Backbone.Model({ id: 'testItem' });
                model.cid = 'testItem';

                view = new (Listview.extend(Contextmenu))({
                    ref: 'io.ox/test',
                    pagination: false,
                    collection: new Backbone.Collection([model]),
                    app: { id: 'testApp' }
                });
                view.collection.complete = true;
                $('body').append(view.render().$el);
                view.selection.select(0);
            });

            afterEach(function () {
                view.remove();
                //cleanup
                let exts = ext.point('io.ox/test/contextmenu').all();
                while (exts.length) exts.pop();
                exts = ext.point('io.ox/test/custom/contextmenu').all();
                while (exts.length) exts.pop();
                exts = ext.point('io.ox/test/actions/testAction').all();
                while (exts.length) exts.pop();
            });

            it('should not render for actions disabled via "matches"', function () {
                return view.toggleContextMenu({ target: $('body') }).then(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(1);
                    expect(view.contextMenu.$menu.text()).to.equal('test label');
                });
            });

            it('should render custom extension point if specified', function () {
                view.contextMenuRef = 'io.ox/test/custom/contextmenu';
                return view.toggleContextMenu({ target: $('body') }).then(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(2);
                    expect(view.contextMenu.$menu.text()).to.equal('test labelsecond test label');
                });
            });

            it('should respect dynamically disabled extensions', function () {
                ext.point('io.ox/test/contextmenu').disable('test');
                return view.toggleContextMenu({ target: $('body') }).then(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(0);
                    ext.point('io.ox/test/contextmenu').enable('test');
                });
            });

            it('should call actions "matches" function with well known info about the view', function () {
                const matchesSpy = sinon.spy();
                new Action('io.ox/test/actions/testSpy', {
                    matches: matchesSpy,
                    action: _.noop
                });
                ext.point('io.ox/test/contextmenu').extend({
                    id: 'testspy',
                    ref: 'io.ox/test/actions/testSpy',
                    title: ''
                });
                return view.toggleContextMenu({ target: $('body') }).then(function () {
                    expect(matchesSpy.calledOnce, 'called').to.be.true;
                    const baton = matchesSpy.firstCall.args[0];
                    expect(baton.collection, 'exists').to.exist;
                    expect(baton.collection.has, 'quacks like a Collection').to.be.a('function');
                    expect(baton.array(), 'array').to.have.length(1);
                    expect(baton.first().id, 'id').to.equal('testItem');
                });
            });
        });

        describe('app change during contextmenu population', function () {
            let view;
            beforeEach(function () {
                view = new (Listview.extend(Contextmenu))({
                    ref: 'io.ox/test',
                    pagination: false,
                    collection: new Backbone.Collection([{ id: 'testItem' }])
                });
                view.collection.complete = true;
                $('body').append(view.render().$el);
                view.selection.select(0);
            });
            afterEach(function () {
                view.remove();
                let exts = ext.point('io.ox/test/contextmenu').all();
                while (exts.length) exts.pop();
                ext.point('io.ox/test/actions/test').all();
                while (exts.length) exts.pop();
            });

            it.skip('should not render the menu on app change', function () {
                const testactionSpy = sinon.spy();
                new Action('io.ox/test/actions/test', {
                    matches: function () {
                        ox.ui.apps.trigger('resume', ox.ui.apps);
                        testactionSpy();
                        return true;
                    },
                    action: _.noop
                });
                ext.point('io.ox/test/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/test',
                    title: 'testing'
                });
                return view.toggleContextMenu({ target: $('body') }).then(function () {
                    expect(view.contextMenu.$menu.find('li'), 'menu items').to.have.length(0);
                    expect(testactionSpy.calledOnce).to.be.true;
                });
            });
        });
    });
});
