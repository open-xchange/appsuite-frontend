/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define([
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/list',
    'io.ox/core/tk/list-contextmenu'
], function (ext, actions, Listview, Contextmenu) {
    describe('Core ListView Contextmenu', function () {
        it('should define toggleContextMenu function', function () {
            const view = new (Listview.extend(Contextmenu))({ });
            expect(view.toggleContextMenu).to.be.a('function');
        });

        describe('used with a basic extension', function () {
            let view;
            beforeEach(function () {
                new actions.Action('io.ox/test/actions/testAction', {
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
                view.complete = true;
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
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(1);
                    expect(view.$dropdownMenu.is('[role="menu"]')).to.be.true;
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
                view.complete = true;
                $('body').append(view.render().$el);
                view.selection.select(0);
            });
            afterEach(function () {
                view.remove();
            });
            it('should not render anything', function () {
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(0);
                    // check a11y stuff, empty menus should not have a role menu
                    expect(view.$dropdownMenu.is('[role="menu"]')).to.be.false;
                });
            });
        });

        describe('used in a more advanced context', function () {
            let view;
            beforeEach(function () {
                new actions.Action('io.ox/test/actions/testAction', {
                    action: _.noop
                });
                new actions.Action('io.ox/test/actions/testActionDisabled', {
                    requires: () => false,
                    action: _.noop
                });

                ext.point('io.ox/test/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    label: 'test label'
                }, {
                    id: 'disabledTest',
                    ref: 'io.ox/test/actions/testActionDisabled',
                    section: 'testsection',
                    label: 'test label of disabled action'
                });

                ext.point('io.ox/test/custom/contextmenu').extend({
                    id: 'test',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    label: 'test label'
                }, {
                    id: 'test2',
                    ref: 'io.ox/test/actions/testAction',
                    section: 'testsection',
                    label: 'second test label'
                }, {
                    id: 'disabledTest',
                    ref: 'io.ox/test/actions/testActionDisabled',
                    section: 'testsection',
                    label: 'test label of disabled action'
                });

                view = new (Listview.extend(Contextmenu))({
                    ref: 'io.ox/test',
                    pagination: false,
                    collection: new Backbone.Collection([{ id: 'testItem' }]),
                    app: { id: 'testApp' }
                });
                view.complete = true;
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

            it('should not render for actions disabled via "requires"', function () {
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(1);
                    expect(view.$dropdownMenu.text()).to.equal('test label');
                    // check a11y stuff, empty menus should not have a role menu
                    expect(view.$dropdownMenu.is('[role="menu"]')).to.be.true;
                });
            });

            it('should render custom extension point if specified', function () {
                view.contextMenuRef = 'io.ox/test/custom/contextmenu';
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(2);
                    expect(view.$dropdownMenu.text()).to.equal('test labelsecond test label');
                    // check a11y stuff, empty menus should not have a role menu
                    expect(view.$dropdownMenu.is('[role="menu"]')).to.be.true;
                });
            });

            it('should respect dynamically disabled extensions', function () {
                ext.point('io.ox/test/contextmenu').disable('test');
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(0);
                });
            });

            it('should call actions "requires" function with well known info about the view', function () {
                const requiresSpy = sinon.spy();
                new actions.Action('io.ox/test/actions/testSpy', {
                    requires: requiresSpy,
                    action: _.noop
                });
                ext.point('io.ox/test/contextmenu').extend({
                    id: 'testspy',
                    ref: 'io.ox/test/actions/testSpy',
                    label: ''
                });
                return view.toggleContextMenu($('body')).then(function () {
                    expect(requiresSpy.calledOnce).to.be.true;
                    const e = requiresSpy.firstCall.args[0],
                        baton = e.baton;

                    expect(e.collection).to.exist;
                    expect(e.collection.has, 'quacks like a Collection').to.be.a('function');

                    expect(baton.data.id).to.equal('testItem');
                    expect(baton.collection).to.have.length(1);
                    expect(baton.collection.at(0).get('id')).to.equal('testItem');
                    expect(baton.app).to.equal(view.app);
                });
            });
        });
    });
});
