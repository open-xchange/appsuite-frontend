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
    describe.only('Core Contextmenu', function () {
        it('should define toggleContextMenu function', function () {
            const view = new (Listview.extend(Contextmenu))({ });
            expect(view.toggleContextMenu).to.be.a('function');
        });

        describe('used with extensions', function () {
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
            });
            it('should populate dropdown with items from "io.ox/test/contextmenu" extension point', function () {
                return view.toggleContextMenu($('body')).then(function () {
                    expect(view.$dropdownMenu.find('li'), 'menu items').to.have.length(1);
                });
            });
        });
    });
});
