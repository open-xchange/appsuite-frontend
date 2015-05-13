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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define([
    'plugins/portal/tasks/register',
    'io.ox/core/extensions',
    'io.ox/core/moment',
    'fixture!io.ox/tasks/defaultTestData.json'
], function (tasksPlugin, ext, moment, testData) {
    'use strict';

    describe('portal Tasks plugin', function () {

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
                this.baton  = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton);
                return def._wrapped[0].then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton);
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
                expect($(this.node.find('.accent')[0]).text()).to.equal('Fällig am 17.5.2013 11:53');
                expect($(this.node.find('.accent')[1]).text()).to.equal('Fällig am 17.5.2013 11:53');
            });
        });
        describe('should not draw', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=search/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '{ "timestamp":1368791630910,"data": ' + JSON.stringify(testData.testSearchEdge) + '}');
                });
                this.node = $('<div>');
                this.baton  = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton);
                return def._wrapped[0].then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton);
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
                this.baton  = ext.Baton();
                var def = ext.point('io.ox/portal/widget/tasks').invoke('load', this.node, this.baton);
                return def._wrapped[0].then(function () {
                    return ext.point('io.ox/portal/widget/tasks').invoke('preview', this.node, this.baton);
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
