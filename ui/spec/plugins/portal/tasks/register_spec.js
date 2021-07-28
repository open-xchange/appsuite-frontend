/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'plugins/portal/tasks/register',
    'io.ox/core/extensions',
    'io.ox/core/moment',
    'fixture!io.ox/tasks/defaultTestData.json'
], function (tasksPlugin, ext, moment, testData) {
    'use strict';

    describe('Portal Tasks plugin', function () {

        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=search/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": ' + JSON.stringify(testData.testSearch) + '}');
                });
                this.server.respondWith('GET', /api\/tasks\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": {"id": 13371, "folder_id": 555123456, "title": "Pommes kaufen"}}');
                });
                this.node = $('<div>');
                this.baton = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton)._wrapped[0];
                return def.then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton).value();
                }.bind(this));
            });

            afterEach(function () {
                this.node.remove();
            });
            it('draw content', function () {
                expect(this.node.children()).to.have.length(1);
                expect(this.node.children().first().is('ul')).to.be.true;
            });
            it('draw all Tasks', function () {
                expect(this.node.find('li.item')).to.have.length(2);
                expect($(this.node.find('.bold')[0]).text()).to.equal('Pommes kaufen');
                expect($(this.node.find('.bold')[1]).text()).to.equal('Nase putzen');
                expect($(this.node.find('.accent')[0]).text()).to.equal('Fällig am 17.5.2013, 11:53');
                expect($(this.node.find('.accent')[1]).text()).to.equal('Fällig am 17.5.2013, 11:53');
            });
        });
        describe('should not draw', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=search/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": ' + JSON.stringify(testData.testSearchEdge) + '}');
                });
                this.node = $('<div>');
                this.baton = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton)._wrapped[0];
                return def.then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton).value();
                }.bind(this));
            });

            afterEach(function () {
                this.node.remove();
            });
            it('done tasks', function () {
                expect($(this.node.find('.bold')[1]).text()).not.to.equal('erledigt');
            });
            it('tasks without invitation', function () {
                expect($(this.node.find('.bold')[1]).text()).not.to.equal('Bin nicht eingeladen');
            });
            it('declined tasks', function () {
                expect($(this.node.find('.bold')[1]).text()).not.to.equal('Ich habe abgelehnt');
            });
            it('tasks without end_date', function () {
                expect($(this.node.find('.bold')[1]).text()).not.to.equal('hab kein end_date');
            });
        });
        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=search/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": []}');
                });
                this.node = $('<div>');
                this.baton = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton)._wrapped[0];
                return def.then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton).value();
                }.bind(this));
            });

            afterEach(function () {
                this.node.remove();
            });

            it('draw correct empty message', function () {
                expect(this.node.children()).to.have.length(1);
                expect(this.node.children().first().is('ul')).to.be.true;
                expect(this.node.children().first().text()).to.equal('Sie haben keine in Kürze fälligen oder überfälligen Aufgaben.');
            });
        });
    });
});
