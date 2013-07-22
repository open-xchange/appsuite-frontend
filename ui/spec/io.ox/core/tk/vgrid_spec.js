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
            this.node = $('<div>');
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

                    expect(this.vgrid.selection.get()).toEqual([]);

                    //"click" checkbox
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    checkbox.change();

                    expect(this.vgrid.selection.get().length).toBe(1);
                });
            });

            it('should deselect one item when "select all" checkbox is unchecked', function () {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }, 'test data was not painted in time', 1000);

                runs(function () {
                    var checkbox = this.vgrid.getToolbar().find('input', 'label.select-all');
                    //"click" checkbox
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    checkbox.change();

                    checkbox.prop('checked', !checkbox.prop('checked'));
                    checkbox.change();

                    expect(this.vgrid.selection.get().length).toBe(0);
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
        });

        describe('showing a folder with a lot of files', function () {
            //TODO: implement me
        });
    });
});
