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
define(['io.ox/tasks/edit/util',
        'io.ox/core/extensions',
        'io.ox/tasks/model',
        'io.ox/core/tk/dialogs',
        'fixture!io.ox/tasks/defaultTestData.json',
        'io.ox/tasks/edit/view-template'], function (util, ext, model, dialogs, testData, template) {

    var extensionPoints = ext.point('io.ox/tasks/edit/view').list();

    describe('task edit util', function () {
        describe('splitExtensionsByRow', function () {
            it('should seperate rows', function () {
                var rows = {};
                util.splitExtensionsByRow(extensionPoints, rows, true);
                _(rows).each(function (content, key) {
                    _(content).each(function (obj) {
                        expect(obj.row).toEqual(key);
                    });
                });
            });
            it('should fill rest array', function () {
                var rows = {};
                extensionPoints.push({text: 'I have no row!'});
                util.splitExtensionsByRow(extensionPoints, rows, true);
                expect(rows).toHaveKey('rest');
                expect(rows.rest.length).toEqual(1);
                expect(rows.rest[0].text).toEqual('I have no row!');
                this.after(function () {
                    extensionPoints.pop();
                });
            });
            it('should ignore tabcontent if parameter is given', function () {
                var rows = {},
                    length = 0;
                util.splitExtensionsByRow(extensionPoints, rows, true);
                _(rows).each(function (content, key) {
                    _(content).each(function (obj) {
                        length++;
                    });
                });
                expect(extensionPoints.length).toBeGreaterOrEqualTo(length);
            });
            it('should sort all content if parameter is given', function () {
                var rows = {},
                    length = 0;
                util.splitExtensionsByRow(extensionPoints, rows, false);
                _(rows).each(function (content, key) {
                    _(content).each(function (obj) {
                        length++;
                    });
                });
                expect(extensionPoints.length).toEqual(length);
            });
        });
        describe('buildLabel', function () {
            it('should create correct nodes', function () {
                var label = util.buildLabel('I am the text.', 'I_am_the_id');

                expect(label.is('label')).toBeTruthy();
                expect(label.attr('for')).toEqual('I_am_the_id');
                expect(label.text()).toEqual('I am the text.');
            });
        });
        describe('buildProgress', function () {
            it('should create correct nodes', function () {
                var progress = util.buildProgress('0');

                expect(_(progress).size()).toEqual(2);
                expect($(progress.progress).val()).toEqual('0');
                expect(progress.wrapper.children().length).toEqual(3);
                expect($(progress.wrapper.children()[0]).is('input')).toBeTruthy();
                expect($(progress.wrapper.children()[1]).is('button')).toBeTruthy();
                expect($(progress.wrapper.children()[2]).is('button')).toBeTruthy();
            });
            it('should keep value between 0 and 100', function () {
                var progress = util.buildProgress('0');

                expect($(progress.progress).val()).toEqual('0');

                $(progress.progress).val('100');
                $(progress.wrapper.children()[2]).click();//update inputfield
                expect($(progress.progress).val()).toEqual('100');

                $(progress.progress).val('400');
                $(progress.wrapper.children()[2]).click();//update inputfield
                expect($(progress.progress).val()).toEqual('100');

                $(progress.progress).val('-45');
                $(progress.wrapper.children()[1]).click();//update inputfield
                expect($(progress.progress).val()).toEqual('0');
            });
            it(' + button should trigger change event', function () {
                var progress = util.buildProgress('0');

                expect(progress.progress).toTrigger('change');
                $(progress.wrapper.children()[2]).click();//update inputfield
            });
            it(' - button should trigger change event', function () {
                var progress = util.buildProgress('100');

                expect(progress.progress).toTrigger('change');
                $(progress.wrapper.children()[1]).click();//update inputfield
            });
        });
        describe('buildExtensionRow', function () {
            it('should build fluid grid row', function () {
                var node = $('<div>'),
                    baton = ext.Baton({model: model.factory.create(testData.testData)}),
                    rows = {},
                    fluidRow;

                util.splitExtensionsByRow(extensionPoints, rows, true);
                fluidRow = util.buildExtensionRow(node, rows[1], baton);

                expect(fluidRow.is('div')).toBeTruthy();
                expect(fluidRow.hasClass('row-fluid')).toBeTruthy();
                expect(fluidRow.hasClass('task-edit-row')).toBeTruthy();
                expect(fluidRow.children().length).toEqual(1);
                this.after(function () {
                    node.remove();
                });
            });
        });
        describe('buildRow', function () {
            it('should build fluid grid row', function () {
                var parent = $('<div>'),
                    nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
                    widths = [1, 2, 6, 3],
                    row;

                util.buildRow(parent, nodes, widths, false);
                row = $(parent.children()[0]);

                expect(row.is('div')).toBeTruthy();
                expect(row.hasClass('row-fluid')).toBeTruthy();
                expect(row.hasClass('task-edit-row')).toBeTruthy();
                expect(row.children().length).toEqual(4);
                this.after(function () {
                    parent.remove();
                });
            });
            it('should wrap items', function () {
                var parent = $('<div>'),
                    nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
                    widths = [1, 2, 6, 3],
                    row;

                util.buildRow(parent, nodes, widths, false);
                row = $(parent.children()[0]);

                expect(row.children().length).toEqual(4);
                expect($(row.children()[0]).is('div')).toBeTruthy();
                expect($(row.children()[1]).is('div')).toBeTruthy();
                expect($(row.children()[2]).is('div')).toBeTruthy();
                expect($(row.children()[3]).is('div')).toBeTruthy();
                this.after(function () {
                    parent.remove();
                });
            });
            it('should set correct widths and offsets', function () {
                var parent = $('<div>'),
                    nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
                    widths = [1, 2, 6, [1, 2]],
                    row;

                util.buildRow(parent, nodes, widths, false);
                row = $(parent.children()[0]);

                expect(row.children().length).toEqual(4);
                expect($(row.children()[0]).hasClass('span1')).toBeTruthy();
                expect($(row.children()[1]).hasClass('span2')).toBeTruthy();
                expect($(row.children()[2]).hasClass('span6')).toBeTruthy();
                expect($(row.children()[3]).hasClass('span1')).toBeTruthy();
                expect($(row.children()[3]).hasClass('offset2')).toBeTruthy();

                this.after(function () {
                    parent.remove();
                });
            });
            it('should fill grid cells is parameter is set', function () {
                var parent = $('<div>'),
                    nodes = [$('<div>'), $('<span>'), $('<input type="text">'), $('<label>')],
                    widths = [1, 2, 6, [1, 2]],
                    row;

                util.buildRow(parent, nodes, widths, true);
                row = $(parent.children()[0]);

                expect(row.children().length).toEqual(4);
                expect(nodes[0].hasClass('span12')).toBeTruthy();
                expect(nodes[1].hasClass('span12')).toBeTruthy();
                expect(nodes[2].hasClass('span12')).toBeTruthy();
                expect(nodes[3].hasClass('span12')).toBeFalsy();//labels don't have span12

                this.after(function () {
                    parent.remove();
                });
            });
        });
        describe('buildConfirmationPopup', function () {
            it('should work with arrays and models', function () {
                var testModel = model.factory.create(testData.testData),
                    popupWrapper;

                //model
                popupWrapper = util.buildConfirmationPopup(testModel, dialogs, false);
                expect(popupWrapper.popup).toBeDefined();
                expect(popupWrapper.message).toBeDefined();

                popupWrapper.popup.close();

                //Array
                popupWrapper = util.buildConfirmationPopup(testData.testData, dialogs, true);
                expect(popupWrapper.popup).toBeDefined();
                expect(popupWrapper.message).toBeDefined();

                this.after(function () {
                    popupWrapper.popup.close();
                });
            });
            it('should display data', function () {
                var testModel = model.factory.create(testData.testData),
                    body,
                    popupWrapper;

                popupWrapper = util.buildConfirmationPopup(testModel, dialogs, false);
                body = popupWrapper.popup.getBody();

                expect(body.find('h4').text()).toEqual('Test Termin');
                expect(body.find('h4').next().text()).toEqual('Ich bin Detailreich');

                this.after(function () {
                    popupWrapper.popup.close();
                });
            });
            it('should contain controls', function () {
                var testModel = model.factory.create(testData.testData),
                    body,
                    footer,
                    popupWrapper;

                popupWrapper = util.buildConfirmationPopup(testModel, dialogs, false);
                var message = popupWrapper.message;
                body = popupWrapper.popup.getBody();
                footer = popupWrapper.popup.getFooter();

                expect(body.find('select').length).toEqual(1);//select
                expect(body.find('select').children().length).toEqual(3);//options(tentative, confirn, decline)
                expect(body.find('input').length).toEqual(1);//confirmation message
                expect(footer.find('button').length).toEqual(2);//cancel and ok button

                this.after(function () {
                    popupWrapper.popup.close();
                });
            });
        });
    });
});
