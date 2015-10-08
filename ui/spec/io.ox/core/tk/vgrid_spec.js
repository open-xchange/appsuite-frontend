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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(['io.ox/core/tk/vgrid', 'waitsFor'], function (VGrid, waitsFor) {
    'use strict';

    describe('The VGrid', function () {
        beforeEach(function () {
            $('body', document).append($('<div id="testNode">'));
            this.node = $('<div>').appendTo($('#testNode', document));
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

        afterEach(function () {
            $('#testNode', document).remove();
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

        describe('showing an empty folder', function (done) {
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
                }.bind(this)).done(done);
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
                    set: function (data, fields) {
                        fields.name.text(data.name);
                    }
                });
            });

            it('should display a template for it', function (done) {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }.bind(this)).done(done);
            });

            it('should select one item with "select all" checkbox', function (done) {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }.bind(this)).then(function () {
                    var checkbox = this.vgrid.getToolbar().find('input', 'label.select-all');
                    checkbox.prop('checked', false);

                    checkbox.click();

                    expect(this.vgrid.selection.get()).to.deep.equal(this.testData);
                    done();
                }.bind(this));
            });

            it('should deselect one item when "select all" checkbox is unchecked', function (done) {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }.bind(this)).then(function () {
                    var checkbox = this.vgrid.getToolbar().find('input', 'label.select-all');
                    //ensure item is selected
                    this.vgrid.selection.selectAll();
                    expect(this.vgrid.selection.get()).to.deep.equal(this.testData);

                    checkbox.click();

                    expect(this.vgrid.selection.get()).to.be.empty;
                    done();
                }.bind(this));
            });

            it('should select one item when the checkbox is checked', function (done) {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('lonely item') >= 0;
                }.bind(this)).then(function () {
                    var checkbox = this.node.find('.testData').find('input:checkbox:visible');

                    //ensure nothing is selected
                    this.vgrid.selection.clear();

                    checkbox.click();

                    expect(this.vgrid.selection.get()).to.deep.equal(this.testData);
                    done();
                }.bind(this));
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
                    set: function (data, fields) {
                        fields.name.text(data.name);
                    }
                });
            });

            it('should render 15 items', function (done) {
                this.vgrid.paint();

                waitsFor(function () {
                    return this.node.text().indexOf('item no.') >= 0;
                }.bind(this)).then(function () {
                    expect(this.node.find('.testData')).to.have.length(15);
                    done();
                }.bind(this));
            });

            describe('and select all checkbox visible', function () {
                it('when clicking through the list, it should select only one item', function (done) {
                    this.vgrid.paint();
                    this.vgrid.setEditable(true);
                    waitsFor(function () {
                        return this.node.text().indexOf('item no.') >= 0;
                    }.bind(this)).then(function () {
                        var testDataNode = this.node.find('.testData'),
                            checkboxes = testDataNode.find('input:visible'),
                            vgrid = this.vgrid,
                            selection = this.vgrid.selection;

                        selection.clear();
                        checkboxes.each(function (index, checkbox) {

                            checkbox = $(checkbox);
                            vgrid.focus();
                            checkbox.click();

                            expect(selection.get()).to.have.length(1);

                            vgrid.focus();
                            checkbox.click();
                            expect(selection.get()).to.have.length(0);
                        });
                        done();
                    }.bind(this));
                });

                it('when selecting all items of the list, it should also check select all', function (done) {
                    this.vgrid.paint();
                    this.vgrid.setEditable(true);
                    waitsFor(function () {
                        return this.node.text().indexOf('item no.') >= 0;
                    }.bind(this)).then(function () {
                        var testDataNode = this.node.find('.testData'),
                            checkboxes = testDataNode.find('input:visible'),
                            vgrid = this.vgrid,
                            selection = this.vgrid.selection,
                            selectAll = vgrid.getToolbar().find('input', 'label.select-all');

                        selection.clear();
                        expect(selectAll.prop('checked')).to.be.false;
                        checkboxes.each(function (index, checkbox) {
                            vgrid.focus();
                            $(checkbox).click();
                            expect(selection.get()).to.have.length(index + 1);
                            if (index < 14) {
                                //expect it to be true, once all items are selected
                                expect(selectAll.prop('checked')).be.false;
                            }
                        });
                        expect(selection.get()).to.deep.equal(this.testData);
                        expect(selectAll.prop('checked')).to.be.true;
                        done();
                    }.bind(this));
                });
            });
        });

        describe('showing a folder with a lot of files', function () {
            //TODO: implement me
        });
    });
});
