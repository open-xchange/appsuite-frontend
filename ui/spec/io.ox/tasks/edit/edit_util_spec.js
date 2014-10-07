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
    'io.ox/tasks/edit/util',
    'io.ox/core/extensions',
    'io.ox/tasks/model',
    'io.ox/core/tk/dialogs',
    'fixture!io.ox/tasks/defaultTestData.json',
    'io.ox/tasks/edit/view-template'
], function (util, ext, model, dialogs, testData, template) {
    'use strict';

    var extensionPoints = ext.point('io.ox/tasks/edit/view').list();

    describe('Tasks edit utilities', function () {
        // describe('splitExtensionsByRow', function () {
        //     it('should seperate rows', function () {
        //         var rows = {};
        //         util.splitExtensionsByRow(extensionPoints, rows, true);
        //         _(rows).each(function (content, key) {
        //             _(content).each(function (obj) {
        //                 expect(obj.row).to.equal(key);
        //             });
        //         });
        //     });
        //     it('should fill rest array', function () {
        //         var rows = {};
        //         extensionPoints.push({ text: 'I have no row!' });
        //         util.splitExtensionsByRow(extensionPoints, rows, true);
        //         expect(rows).to.include.key('rest');
        //         expect(rows.rest).to.have.length(1);
        //         expect(rows.rest[0].text).to.equal('I have no row!');

        //         extensionPoints.pop();
        //     });
        //     it('should ignore tabcontent if parameter is given', function () {
        //         var rows = {},
        //             length = 0;
        //         util.splitExtensionsByRow(extensionPoints, rows, true);
        //         _(rows).each(function (content, key) {
        //             _(content).each(function (obj) {
        //                 length++;
        //             });
        //         });
        //         expect(extensionPoints).to.have.length(length);
        //     });
        //     it('should sort all content if parameter is given', function () {
        //         var rows = {},
        //             length = 0;
        //         util.splitExtensionsByRow(extensionPoints, rows, false);
        //         _(rows).each(function (content, key) {
        //             _(content).each(function (obj) {
        //                 length++;
        //             });
        //         });
        //         expect(extensionPoints).to.have.length(length);
        //     });
        // });
        describe('buildProgress', function () {
            it('should create correct nodes', function () {
                var progress = util.buildProgress('0');

                expect(_(progress).size()).to.equal(2);
                expect($(progress.progress).val()).to.equal('0');
                expect(progress.wrapper.children()).to.have.length(2);
                expect($(progress.wrapper.children()[0]).is('input')).to.be.true;
                expect($(progress.wrapper).find('button')).to.have.length(2);
            });
            it('should keep value between 0 and 100', function () {
                var progress = util.buildProgress('0');

                expect($(progress.progress).val()).to.equal('0');

                $(progress.progress).val('100');
                $(progress.wrapper.children()[2]).click();//update inputfield
                expect($(progress.progress).val()).to.equal('100');

                $(progress.progress).val('400');
                $(progress.wrapper).find('button')[1].click();//update inputfield
                expect($(progress.progress).val()).to.equal('100');

                $(progress.progress).val('-45');
                $(progress.wrapper).find('button')[0].click();//update inputfield
                expect($(progress.progress).val()).to.equal('0');
            });
            it(' + button should trigger change event', function () {
                var progress = util.buildProgress('0'),
                    spy = sinon.spy();

                progress.progress.on('change', spy);
                $(progress.wrapper).find('button')[1].click();//update inputfield
                expect(spy.called, '"change" event triggered').to.be.true;
            });
            it(' - button should trigger change event', function () {
                var progress = util.buildProgress('100'),
                    spy = sinon.spy();

                progress.progress.on('change', spy);
                $(progress.wrapper).find('button')[0].click();//update inputfield
                expect(spy.called, '"change" event triggered').to.be.true;
            });
        });
        // describe('buildExtensionRow', function () {
        //     it('should build fluid grid row', function () {
        //         var node = $('<div>'),
        //             baton = ext.Baton({ model: model.factory.create(testData.testData) }),
        //             rows = {},
        //             fluidRow;

        //         util.splitExtensionsByRow(extensionPoints, rows, true);
        //         fluidRow = util.buildExtensionRow(node, rows[1], baton);

        //         expect(fluidRow.is('div')).to.be.true;
        //         expect(fluidRow.hasClass('row')).to.be.true;
        //         //expect(fluidRow.hasClass('task-edit-row')).toBeTruthy();
        //         expect(fluidRow.children()).to.have.length(1);

        //         node.remove();
        //     });
        // });
        // describe('buildRow', function () {
        //     it('should build fluid grid row', function () {
        //         var parent = $('<div>'),
        //             nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
        //             widths = [1, 2, 6, 3],
        //             row;

        //         util.buildRow(parent, nodes, widths, false);
        //         row = $(parent.children()[0]);

        //         expect(row.is('div')).to.be.true;
        //         expect(row.hasClass('row')).to.be.true;
        //         //expect(row.hasClass('task-edit-row')).toBeTruthy();
        //         expect(row.children()).to.have.length(4);

        //         parent.remove();
        //     });
        //     it('should wrap items', function () {
        //         var parent = $('<div>'),
        //             nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
        //             widths = [1, 2, 6, 3],
        //             row;

        //         util.buildRow(parent, nodes, widths, false);
        //         row = $(parent.children()[0]);

        //         expect(row.children()).to.have.length(4);
        //         expect($(row.children()[0]).is('div')).to.be.true;
        //         expect($(row.children()[1]).is('div')).to.be.true;
        //         expect($(row.children()[2]).is('div')).to.be.true;
        //         expect($(row.children()[3]).is('div')).to.be.true;

        //         parent.remove();
        //     });
        //     it('should set correct widths and offsets', function () {
        //         var parent = $('<div>'),
        //             nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
        //             widths = [1, 2, 6, [1, 2]],
        //             row;

        //         util.buildRow(parent, nodes, widths, false);
        //         row = $(parent.children()[0]);

        //         expect(row.children()).to.have.length(4);
        //         expect($(row.children()[0]).hasClass('span1')).to.be.true;
        //         expect($(row.children()[1]).hasClass('span2')).to.be.true;
        //         expect($(row.children()[2]).hasClass('span6')).to.be.true;
        //         expect($(row.children()[3]).hasClass('span1')).to.be.true;
        //         expect($(row.children()[3]).hasClass('offset2')).to.be.true;

        //         parent.remove();
        //     });
        //     it('should fill grid cells is parameter is set', function () {
        //         var parent = $('<div>'),
        //             nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
        //             widths = [1, 2, 6, [1, 2]],
        //             row;

        //         util.buildRow(parent, nodes, widths, true);
        //         row = $(parent.children()[0]);

        //         expect(row.children()).to.have.length(4);

        //         parent.remove();
        //     });
        // });
    });
});
