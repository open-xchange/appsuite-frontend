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
        'io.ox/tasks/edit/view-template'], function (util, ext, template) {

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
    });
});
