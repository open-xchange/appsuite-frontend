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

/*
define([
    'io.ox/core/viewer/views/mainview',
    'io.ox/core/viewer/backbone',
    'io.ox/core/viewer/eventdispatcher'
], function (MainView, backbone, EventDispatcher) {

    describe('OX Viewer MainView', function () {

        it('should exist', function () {
            expect(MainView).to.exist;
        });

        var dummyFileList = [
            {
                id: '99/92',
                modified_by: 20,
                last_modified: 1418582202831,
                folder_id: '99',
                meta: {},
                title: '1.jpg',
                filename: '1.jpg',
                file_mimetype: 'image/jpeg',
                file_size: 31019,
                version: '1',
                locked_until: 0
            },
            {
                id: '99/101',
                modified_by: 20,
                last_modified: 1418582207703,
                folder_id: '99',
                meta: {},
                title: '10.jpg',
                filename: '10.jpg',
                file_mimetype: 'image/jpeg',
                file_size: 18926,
                version: '1',
                locked_until: 0
            },
            {
                id: '99/93',
                modified_by: 20,
                last_modified: 1418582203346,
                folder_id: '99',
                meta: {},
                title: '2.jpg',
                filename: '2.jpg',
                file_mimetype: 'image/jpeg',
                file_size: 93030,
                version: '1',
                locked_until: 0
            }
        ];

        var fileCollection = new backbone.Collection();
        fileCollection.set(dummyFileList, { parse: true });

        var mainView =  new MainView({ collection: fileCollection }),
            coreDummy = $('<div id="io-ox-core">'),
            // displayedData = {
            //     index: mainView.displayedFileIndex,
            //     model: mainView.collection.at(mainView.displayedFileIndex)
            // };
            displayedData = {
                index: 0,
                model: mainView.collection.at(0)
            };

        coreDummy.append(mainView.render(displayedData).el);

        describe('initialize()', function () {

            it('should create children Backbone views', function () {
                expect(mainView).to.contain.keys('toolbarView', 'displayerView', 'sidebarView');
                expect(mainView.toolbarView).to.be.an.instanceof(Backbone.View);
                expect(mainView.displayerView).to.be.an.instanceof(Backbone.View);
                expect(mainView.sidebarView).to.be.an.instanceof(Backbone.View);
            });

            // TODO: adopt to asynchronous slide creation
            // it('should bind viewer:toggle:sidebar event', function () {
            //     var oldSidebarOpened = mainView.sidebarView.opened;
            //     EventDispatcher.trigger('viewer:toggle:sidebar');
            //     expect(mainView.sidebarView.opened).to.be.not.equal(oldSidebarOpened);
            // });

            it('should fire an initial render', function () {
                expect(mainView.$el.find('.viewer-toolbar').length).to.equal(1);
                expect(mainView.$el.find('.viewer-displayer').length).to.equal(1);
                expect(mainView.$el.find('.viewer-sidebar').length).to.equal(1);
            });

        });

        describe('render()', function () {

            var displayedData = {
                index: mainView.displayedFileIndex,
                model: mainView.collection.at(mainView.displayedFileIndex)
            };

            it('should exist', function () {
                expect(mainView.render).to.exist.and.to.be.a('function');
            });

            it('should render child views', function () {
                mainView.render(displayedData);
                expect(mainView.$el.find('.viewer-toolbar').length).to.equal(1);
                expect(mainView.$el.find('.viewer-displayer').length).to.equal(1);
                expect(mainView.$el.find('.viewer-sidebar').length).to.equal(1);
            });

        });

        describe('onKeydown()', function () {

            it('should exist', function () {
                expect(mainView.onKeydown).to.exist.and.to.be.a('function');
            });

            it('should close the viewer on ESC key', function () {
                var escEvent = $.Event('keydown', { keyCode: 27 });
                mainView.$el.trigger(escEvent);
                expect(coreDummy.find('.io-ox-viewer').length).to.be.equal(0);
            });
        });

    });
});
 */
