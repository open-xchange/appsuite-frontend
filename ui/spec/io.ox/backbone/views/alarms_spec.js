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

define(['io.ox/backbone/mini-views/alarms', 'io.ox/core/moment'], function (AlarmsView, moment) {

    'use strict';

    describe('AlarmsView', function () {
        beforeEach(function () {
            this.model = new Backbone.Model({
                summary: 'Pizza Essen',
                description: 'Lecker Lecker!',
                alarms: [{
                    action: 'DISPLAY',
                    description: 'Pizza Essen',
                    trigger: { duration: '-PT15M', related: 'START' }
                }, {
                    action: 'AUDIO',
                    trigger: { duration: '-PT30M', related: 'START' }
                }, {
                    action: 'EMAIL',
                    attendee: 'mailto:miss.test@test.com',
                    description: 'Lecker Lecker!',
                    summary: 'Pizza Essen',
                    trigger: { duration: '-PT2H', related: 'START' }
                }]
            });
            this.view = new AlarmsView.alarmsView({ model: this.model });
            this.view.render();
        });

        afterEach(function () {
            delete this.model;
            delete this.view;
        });

        it('should draw nodes', function () {
            this.view.$el.find('button').length.should.equal(4);
            this.view.$el.find('.alarm-list').length.should.equal(1);
        });

        it('should create nodes from the model', function () {
            this.view.$el.find('.alarm-list-item').length.should.equal(3);
        });

        it('should create new alarm when button is clicked', function () {
            this.view.$el.find('button:last').trigger('click');
            this.view.$el.find('.alarm-list-item').length.should.equal(4);
        });

        it('should remove alarms when button is clicked', function () {
            this.view.$el.find('.alarm-remove:first').trigger('click');
            this.view.$el.find('.alarm-list-item').length.should.equal(2);
        });

        it('should update the model correctly', function () {
            this.view.$el.find('.alarm-remove:last').trigger('click');
            // change must be triggered manually when the value is changed using javascript.
            this.view.$el.find('.alarm-action:last').val('DISPLAY').trigger('change');
            this.view.$el.find('.alarm-time:first').val('PT1H').trigger('change');
            this.model.get('alarms').should.deep.equal([{
                action: 'DISPLAY',
                trigger: { duration: '-PT1H', related: 'START' },
                description: 'Pizza Essen'
            }, {
                action: 'DISPLAY',
                trigger: { duration: '-PT30M', related: 'START' },
                description: 'Pizza Essen'
            }]);
        });

        it('should be able to handle non standard alarms', function () {
            this.model.set('alarms', [{
                action: 'SMS',
                description: 'Machete improvisiert',
                trigger: { duration: '-PT15M' }
            }, {
                action: 'DISPLAY',
                trigger: { duration: '-PT55M' }
            }, {
                action: 'DISPLAY',
                trigger: { duration: 'PT55M' }
            }, {
                action: 'DISPLAY',
                trigger: { dateTime: '20170708T220000Z' }
            }]);

            this.view.render();
            var items = this.view.$el.find('.alarm-list-item');

            items.length.should.equal(4);

            $(items[0]).find('.alarm-action').text().should.equal('SMS');

            $(items[1]).find('.alarm-time').val().should.equal('PT55M');
            $(items[1]).find('.alarm-time option:last').text().should.equal(new moment.duration('-PT55M').humanize());

            $(items[2]).find('.alarm-time').val().should.equal('PT55M');
            $(items[2]).find('.alarm-time option:last').text().should.equal(new moment.duration('PT55M').humanize());

            $(items[3]).find('.alarm-time').text().should.equal(new moment('20170708T220000Z').format('LLL'));
        });

        it('should create missing data but preserve the rest', function () {
            this.model.set('alarms', [{
                uid: 1234,
                action: 'SMS',
                description: 'Machete improvisiert',
                trigger: { duration: '-PT15M' }
            }, {
                action: 'DISPLAY',
                trigger: { duration: 'PT55M', related: 'END' }
            }, {
                action: 'DISPLAY',
                trigger: { dateTime: '20170708T220000Z' }
            }, {
                uid: 1337,
                action: 'DISPLAY',
                trigger: { duration: '-PT55M' },
                wurst: 'Im Brötchen mit Senf'
            }]);

            this.view.render().updateModel();
            var alarms = this.model.get('alarms');

            alarms.length.should.equal(4);

            alarms[0].action.should.equal('SMS');
            alarms[0].description.should.equal('Machete improvisiert');
            alarms[0].trigger.related.should.equal('START');
            alarms[0].uid.should.equal(1234);

            alarms[1].trigger.duration.should.equal('PT55M');
            alarms[1].trigger.related.should.equal('END');
            alarms[1].description.should.equal('Pizza Essen');

            alarms[2].trigger.dateTime.should.equal('20170708T220000Z');

            alarms[3].wurst.should.equal('Im Brötchen mit Senf');
        });

        it('should handle unusual time formats', function () {
            this.model.set('alarms', [{
                'id': 1337,
                'action': 'DISPLAY',
                'trigger': {
                    'duration': 'PT0S'
                },
                'description': 'reminder',
                'uid': 'asdfghhhjkl1'
            },
            {
                'id': 1338,
                'action': 'DISPLAY',
                'trigger': {
                    'duration': '-PT0S'
                },
                'description': 'reminder',
                'uid': 'asdfghhhjkl2'
            },
            {
                'id': 1339,
                'action': 'DISPLAY',
                'trigger': {
                    'duration': 'PT0W'
                },
                'description': 'reminder',
                'uid': 'asdfghhhjkl3'
            }]);

            this.view.render().updateModel();
            var alarms = this.model.get('alarms');

            alarms.length.should.equal(3);
            alarms[0].description.should.equal('reminder');

            var items = this.view.$el.find('.alarm-list-item');

            items.length.should.equal(3);
            $(items[0]).find('.alarm-time option').length.should.equal(22);
            $(items[0]).find('.alarm-time').val().should.equal('PT0S');
            $(items[1]).find('.alarm-time option').length.should.equal(22);
            $(items[1]).find('.alarm-time').val().should.equal('PT0S');
            $(items[2]).find('.alarm-time option').length.should.equal(22);
            $(items[2]).find('.alarm-time').val().should.equal('PT0W');

        });
    });
});
