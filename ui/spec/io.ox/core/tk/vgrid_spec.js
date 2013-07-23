/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(['io.ox/core/tk/vgrid'], function (VGrid) {
    'use strict';

    describe('The VGrid', function () {
        beforeEach(function () {
            this.node = $('<div>').appendTo($('body', document));
            this.vgrid = new VGrid(this.node);
            this.api = {};
            this.api.getList = function (ids) {
                var def = $.Deferred();
                _.defer(function () {
                    def.resolve(ids);
                });
                return def;
            };
        });

        function wireGridAndApiFor(test) {
            var testData = test.testData;

            test.api.getAll = function () {
                var def = $.Deferred();
                _.defer(function () {
                    def.resolve(testData);
                });
                return def;
            };
            test.vgrid.setAllRequest(test.api.getAll);
            test.vgrid.setListRequest(test.api.getList);
        }

        describe('showing an empty folder', function () {
            it('should display a hint about empty folder', function () {
                this.testData = [];
                wireGridAndApiFor(this);

                //add custom empty message for higher reproducability
                this.vgrid.setEmptyMessage(function () {
                    return 'Non-empty Testmessage';
                });
                this.vgrid.paint();

                waitsFor(function () {
                    //vgrid.paint() returns a deferred object, but it doesn’t resolve
                    //when painting is done, but more early. So we need to wait for
                    //the test message to appear
                    //TODO: is this a bug or a feature?
                    return this.node.text().indexOf('Non-empty Testmessage') >= 0;
                }, 'no test message was added', 1000);
            });
        });

        describe('showing a folder with one file', function () {
            beforeEach(function () {
                this.testData = [{
                        id: 'lonely',
                        name: 'lonely item'
                    }];
                wireGridAndApiFor(this);

                this.vgrid.addTemplate({
                    build: function () {
                        var name;
                        this.addClass('testData').append(
                            name = $('<div>')
                        );
                        return { name: name };
                    },
                    set: function (data, fields, index) {
                        fields.name.text(data.name);
                    }
                });
            });

            it('should display a template for it', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }, 'test data was not painted in time', 1000);
            });

            it('should select one item with "select all" checkbox', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }, 'test data was not painted in time', 1000);

                runs(function () {
                    var checkbox = this.vgrid.getToolbar().find('input', 'label.select-all');

                    checkbox.click();

                    expect(this.vgrid.selection.get()).toEqual(this.testData);
                });
            });

            it('should deselect one item when "select all" checkbox is unchecked', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }, 'test data was not painted in time', 1000);

                runs(function () {
                    var checkbox = this.vgrid.getToolbar().find('input', 'label.select-all');
                    //ensure item is selected
                    this.vgrid.selection.selectAll();
                    expect(this.vgrid.selection.get()).toEqual(this.testData);

                    checkbox.click();

                    expect(this.vgrid.selection.get()).toEqual([]);
                });
            });

            it('should select one item when the checkbox is checked', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }, 'test data was not painted in time', 1000);

                runs(function () {
                    var checkbox = this.node.find('.testData').find('input:checkbox:visible');

                    //ensure nothing is selected
                    this.vgrid.selection.clear();

                    checkbox.click();

                    expect(this.vgrid.selection.get()).toEqual(this.testData);
                });
            });
        });

        describe('showing a folder with some files', function () {
            beforeEach(function () {
                this.testData = _.times(15, function (index) {
                    return {
                        id: 'item_' + index,
                        name: 'item no. ' + index
                    };
                });
                wireGridAndApiFor(this);

                this.vgrid.addTemplate({
                    build: function () {
                        var name;
                        this.addClass('testData').append(
                            name = $('<div>')
                        );
                        return { name: name };
                    },
                    set: function (data, fields, index) {
                        fields.name.text(data.name);
                    }
                });
            });

            it('should render 15 items', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('item no.') >= 0;
                }, 'test data was not painted in time', 1000);

                runs(function () {
                    expect(this.node.find('.testData').length).toBe(15);
                });
            });

            describe('and select all checkbox visible', function () {
                it('when clicking through the list, it should select only one item', function () {
                    this.vgrid.paint();
                    this.vgrid.setEditable(true);
                    waitsFor(function () {
                        return this.node.text().indexOf('item no.') >= 0;
                    }, 'test data was not painted in time', 1000);

                    runs(function () {
                        var testDataNode = this.node.find('.testData'),
                            checkboxes = testDataNode.find('input:visible'),
                            vgrid = this.vgrid,
                            selection = this.vgrid.selection,
                            testData = this.testData;

                        selection.clear();
                        checkboxes.each(function (index, checkbox) {

                            checkbox = $(checkbox);
                            vgrid.focus();
                            checkbox.click();

                            expect(selection.get().length).toBe(1);

                            vgrid.focus();
                            checkbox.click();
                            expect(selection.get().length).toBe(0);
                        });
                    });
                });

                it('when selecting all items of the list, it should also check select all', function () {
                    this.vgrid.paint();
                    this.vgrid.setEditable(true);
                    waitsFor(function () {
                        return this.node.text().indexOf('item no.') >= 0;
                    }, 'test data was not painted in time', 1000);

                    runs(function () {
                        var testDataNode = this.node.find('.testData'),
                            checkboxes = testDataNode.find('input:visible'),
                            vgrid = this.vgrid,
                            selection = this.vgrid.selection,
                            testData = this.testData,
                            selectAll = vgrid.getToolbar().find('input', 'label.select-all');

                        selection.clear();
                        expect(selectAll.prop('checked')).toBeFalsy();
                        checkboxes.each(function (index, checkbox) {
                            vgrid.focus();
                            $(checkbox).click();
                            expect(selection.get().length).toBe(index+1);
                            if (index < 14) {
                                //expect it to be true, once all items are selected
                                expect(selectAll.prop('checked')).toBeFalsy();
                            }
                        });
                        expect(selection.get()).toEqual(this.testData);
                        expect(selectAll.prop('checked')).toBeTruthy();
                    });
                });
            });
        });

        describe('showing a folder with a lot of files', function () {
            //TODO: implement me
        });
    });
});
