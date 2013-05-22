/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/view-form',
    ['io.ox/core/tk/view',
     'io.ox/core/notifications',
     'gettext!io.ox/settings/settings',
     'io.ox/core/extensions',
     'io.ox/backbone/forms',
     'io.ox/backbone/views',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (View, notifications, gt, ext, forms, views) {

    'use strict';


    var staticStrings =  {

    },

        POINT = 'io.ox/mailfilter/settings/filter/detail',

        sizeTitles = {
            size: gt('Size (bytes)')
        },

        sizeValues = {
            over: gt('Is bigger than'),
            under: gt('Is smaller than')
        },

        flagValues = {
            '\\deleted': gt('deleted'),
            '\\seen': gt('seen')
        },

        containsValues = {
            regex: gt('Matches regex'),
            is: gt('Is exactly'),
            contains: gt('Contains'),
            matches: gt('Matches (wildcards allowed)')
        },

//        headerTranslation = {
//            'From': 'Sender/From',
//            'To Cc': 'Any recipient',
//            'Subject': 'Subject',
//            'List-Id': 'Mailing list',
//            'X-BeenThere': 'Mailing list',
//            'X-Mailinglist': 'Mailing list',
//            'X-Mailing-List': 'Mailing list',
//            'To': 'To',
//            'Cc': 'CC',
//            '': 'Header'
//        },

        headerTranslation = {
            'From': gt('Sender/From'),
            'any': gt('Any recipient'),
            'Subject': gt('Subject'),
            'mailingList': gt('Mailing list'),
            'To': gt('To'),
            'Cc': gt('CC'),
            'cleanHeader': gt('Header')
        },

        actionsTranslations = {
            keep: gt('Keep'),
            discard: gt('Discard'),
            redirect: gt('Redirect to'),
            move: gt('Move to folder'),
            reject: gt('Reject with reason'),
            markmail: gt('Mark mail as'),
            tag: gt('Tag mail with'),
            flag: gt('Flag mail with')
//            gt('Tag mail with'),
//
        },


        colorNames = {
            NONE:       gt('None'),
            RED:        gt('Red'),
            BLUE:       gt('Blue'),
            GREEN:      gt('Green'),
            GRAY:       gt('Gray'),
            PURPLE:     gt('Purple'),
            LIGHTGREEN: gt('Light green'),
            ORANGE:     gt('Orange'),
            PINK:       gt('Pink'),
            LIGHTBLUE:  gt('Light blue'),
            YELLOW:     gt('Yellow')
        },

        COLORS = {
            NONE:        0,
            RED:         1,
            ORANGE:      7,
            YELLOW:     10,
            LIGHTGREEN:  6,
            GREEN:       3,
            LIGHTBLUE:   9,
            BLUE:        2,
            PURPLE:      5,
            PINK:        8,
            GRAY:        4
        },

        colorFlags = {
            '$cl_1': '1',
            '$cl_2': '2',
            '$cl_3': '3',
            '$cl_4': '4',
            '$cl_5': '5',
            '$cl_6': '6',
            '$cl_7': '7',
            '$cl_8': '8',
            '$cl_9': '9',
            '$cl_10': '10'
        },

        AccountDetailView = Backbone.View.extend({
            tagName: "div",
            className: "io-ox-mailfilter-edit",
            _modelBinder: undefined,
            initialize: function (options) {

                Backbone.Validation.bind(this, {selector: 'data-property', forceUpdate: true});//forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
            },
            render: function () {

                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);
                console.log('neu gerendert');
                return this;

            },
            events: {
                'save': 'onSave',
                'click [data-action="change-value"]': 'onChangeValue',
                'click [data-action="change-value-actions"]': 'onChangeValueAction',
                'change [data-action="change-text-test"]': 'onChangeTextTest',
                'change [data-action="change-text-action"]': 'onChangeTextAction',
                'click .folderselect': 'onFolderSelect',
                'click [data-action="change-color"]': 'onChangeColor',
                'click [data-action="remove-test"]': 'onRemoveTest',
                'click [data-action="remove-action"]': 'onRemoveAction'
            },

            onRemoveTest: function (e) {

                e.preventDefault();
                var node = $(e.target),
                    list = node.closest('li'),
                    testID = list.attr('data-test-id'),
                    testArray =  this.model.get('test'),
                    checkForMultipleTests = $(this.el).find('[data-test-id]');

                if (checkForMultipleTests.length > 2) {
                    testArray.tests.splice(testID, 1);
                } else {

                    if (testArray.tests) {
                        testArray.tests.splice(testID, 1);
                        testArray = testArray.tests[0];
                    } else {
                        testArray = { id: 'true' };
                    }

                }

                this.model.set('test', testArray);
                this.render();
                console.log(this.model);

            },

            onRemoveAction: function (e) {

                e.preventDefault();
                var node = $(e.target),
                    list = node.closest('li'),
                    actionID = list.attr('data-action-id'),
                    actionArray =  this.model.get('actioncmds');

                actionArray.splice(actionID, 1);
                this.model.set('actioncmds', actionArray);
                this.render();
                console.log(this.model);

            },

            onSave: function () {
                console.log('der SAVE');
            },

            onChangeValue: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.attr('data-value') ? node.attr('data-value') : node.parent().attr('data-value'),
                    link = node.closest('.action').find('a.dropdown-toggle'),

                    list = link.closest('li'),
                    type = list.attr('data-type'),
                    testID = list.attr('data-test-id'),
                    testArray =  this.model.get('test'),
                    translatedValue = type === 'size' ? sizeValues[value] : containsValues[value],
                    checkForMultipleTests = $(this.el).find('[data-test-id]');

                link.text(translatedValue);


                if (checkForMultipleTests.length > 0) {
                    testArray.tests[testID].comparison = value;
                } else {
                    testArray.comparison = value;
                }

                this.model.set('test', testArray);
                console.log(this.model.get('test'));
            },

            onChangeValueAction: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.attr('data-value') ? node.attr('data-value') : node.parent().attr('data-value'),
                    link = node.closest('.action').find('a.dropdown-toggle'),

                    list = link.closest('li'),
                    type = list.attr('data-type'),
                    actionID = list.attr('data-action-id'),
                    actionsArray =  this.model.get('actioncmds'),
                    translatedValue = flagValues[value];

                link.text(translatedValue);

                actionsArray[actionID].flags = [value];
                this.model.set('actioncmds', actionsArray);

                console.log(this.model.get('actioncmds'));
            },

            onChangeTextTest: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.val(),
                    list = node.closest('li'),
                    type = list.attr('data-type'),
                    testID = list.attr('data-test-id'),
                    testArray =  this.model.get('test'),
                    checkForMultipleTests = $(this.el).find('[data-test-id]');

                if (checkForMultipleTests.length > 1) {
                    testArray.tests[testID][type] = type === 'size' ? value : [value];
                } else {
                    testArray[type] = type === 'size' ? value : [value];
                }

                this.model.set('test', testArray);

                console.log(this.model.get('test'));
            },

            onChangeTextAction: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.val(),
                    list = node.closest('li'),
                    type = list.attr('data-type'),
                    actionID = list.attr('data-action-id'),
                    actionArray =  this.model.get('actioncmds');

                actionArray[actionID][type] = type === 'to' || 'text' ? value : [value];
                this.model.set('actioncmds', actionArray);

                console.log(this.model.get('actioncmds'));
            },

            onFolderSelect: function (e) {
                var self = this,
                    list = $(e.currentTarget).closest('li'),
                    type = list.attr('data-type'),
                    actionID = list.attr('data-action-id'),
                    inputField = list.find('input'),
                    currentFolder =  self.model.get('actioncmds')[actionID].into,
                    actionArray =  this.model.get('actioncmds');
                require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {

                    var label = gt('Select folder'),
                        dialog = new dialogs.ModalDialog({ easyOut: true })
                        .header($('<h4>').text(label))
                        .addPrimaryButton("select", label)
                        .addButton("cancel", gt("Cancel"));
                    dialog.getBody().css({ height: '250px' });
                    var tree = new views.FolderTree(dialog.getBody(), {
                            type: 'mail'
                                // can a mail be moved to any folder?
//                            rootFolderId: 'default0'
                        });
                    dialog.show(function () {
                        tree.paint().done(function () {
                            tree.select(currentFolder);
                        });
                    })
                    .done(function (action) {
                        if (action === 'select') {
                            var value = _(tree.selection.get()).first();
                            actionArray[actionID][type] = value;
                            self.model.set('actioncmds', actionArray);
                            inputField.val(value);
                        }
                        tree.destroy().done(function () {
                            tree = dialog = null;
                        });
                    });
                });
            },

            onChangeColor: function (e) {
                var self = this,
                list = $(e.currentTarget).closest('li[data-action-id]'),
                type = list.attr('data-type'),
                actionID = list.attr('data-action-id'),
                colorValue = list.find('div.flag').attr('data-color-value'),
                actionArray =  this.model.get('actioncmds');

                actionArray[actionID].flags[0] = '$cl_' + colorValue;
                this.model.set('actioncmds', actionArray);

                console.log(this.model.get('actioncmds'));

            }

        });

    var drawOptions = function (activeValue, values) {

        var active = values[activeValue];
        return $('<div class="action dropdown value">').append(
            $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(active),
            $('<ul class="dropdown-menu">').append(
                _(values).map(function (name, value) {
                    return $('<li>').append(
                        $('<a>', { href: '#', 'data-action': 'change-value', 'data-value': value}).append(
                            $.txt(name)
                        )
                    );
                })
            )
        );
    };


    var drawOptionsActions = function (activeValue, values) {

        var active = values[activeValue];
        return $('<div class="action dropdown value">').append(
            $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(active),
            $('<ul class="dropdown-menu">').append(
                _(values).map(function (name, value) {
                    return $('<li>').append(
                        $('<a>', { href: '#', 'data-action': 'change-value-actions', 'data-value': value}).append(
                            $.txt(name)
                        )
                    );
                })
            )
        );
    };

    var drawInputfieldTest = function (activeValue) {
        return $('<input>').attr({ type: 'text', 'data-action': 'change-text-test'}).val(activeValue);
    };

    var drawInputfieldAction = function (activeValue) {
        return $('<input>').attr({ type: 'text', 'data-action': 'change-text-action'}).val(activeValue);
    };

    var drawDisabledInputfield = function (activeValue) {
        return $('<input>').attr({ type: 'text', disabled: 'disabled', 'data-action': 'change-text-action'}).val(activeValue);
    };

    var drawFolderSelect = function () {
        return $('<button>').addClass('btn folderselect').attr('type', 'button').text('select Folder');
    };

    var drawDeleteButton = function (type) {
        return $('<a href="#" class="close" data-action="remove-' + type + '">').html('&times;');
    };

    function changeLabel(e) {
        e.preventDefault();
        $(this).closest('.flag-dropdown').attr('data-color-value', e.data.color).removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
    }


    var drawColorDropdown = function (activeColor) {
//        var data = baton.data,
        var flagclass = 'flag_' + colorFlags[activeColor];
        return $('<div class="dropdown flag-dropdown clear-title flag">').attr({'data-color-value': activeColor})
        .addClass(flagclass)
        .append(
            // box
            $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown">'),
            // drop down
            $('<ul class="dropdown-menu">')
            .append(
                _(COLORS).map(function (index, color) {
                    return $('<li>').append(
                        $('<a href="#">').attr({'data-action': 'change-color'}).append(
                            index > 0 ? $('<span class="flag-example">').addClass('flag_' + index) : $(),
                            $.txt(colorNames[color])
                        )
                        .on('click', { color: index, flagclass: flagclass }, changeLabel)
//                        .addClass(data.color_label === index ? 'active-label' : undefined)
                    );
                })
            )
        );
    };

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {
            console.log('neu im draw');
            var listTests = $('<ol class="widget-list">'),
                listActions = $('<ol class="widget-list">').text('actions');

            var appliedTest = baton.model.get('test');

            if (appliedTest.tests) {
                appliedTest = appliedTest.tests;
            } else {
                appliedTest = [appliedTest];
            }

            console.log(appliedTest);

            _(appliedTest).each(function (test, num) {
                if (test.id === 'size') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'size', 'data-test-id': num}).text(sizeTitles[test.id]).append(
                            drawOptions(test.comparison, sizeValues),
                            drawInputfieldTest(test.size),
                            drawDeleteButton('test')
                        )
                    );
                } else if (test.id === 'header') {
                    var name;
                    if (test.headers[3]) {
                        name = headerTranslation.mailingList;
                    } else if (test.headers[1]) {
                        name = headerTranslation.any;
                    } else {
                        name = test.headers[0] === '' ? headerTranslation.cleanHeader : headerTranslation[test.headers[0]];
                    }

                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num, 'data-type': 'values'}).text(name).append(
                            drawOptions(test.comparison, containsValues),
                            drawInputfieldTest(test.values[0]),
                            drawDeleteButton('test')
                        )
                    );
                } else if (appliedTest.length !== 1 && test.id === 'true') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num}).text('ein Fall von Alle').append(
                            drawDeleteButton('test')
                    ));
                }

            });

            console.log(baton.model.get('actioncmds'));

            _(baton.model.get('actioncmds')).each(function (action, num) {
                if (action.id !== 'stop') {

                    if (action.id === 'redirect') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'to'}).text(actionsTranslations[action.id]).append(
                                drawInputfieldAction(action.to),
                                drawDeleteButton('action')
                            )
                        );
                    }

                    else if (action.id === 'move') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'into'}).text(actionsTranslations[action.id]).append(
                            drawDisabledInputfield(action.into),
                            drawFolderSelect(),
                            drawDeleteButton('action')
                        ));
                    }
                    else if (action.id === 'reject') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations[action.id]).append(
                            drawInputfieldAction(action.text),
                            drawDeleteButton('action')
                        ));
                    }
                    else if (action.id === 'addflags') {
                        if (/delete|seen/.test(action.flags[0])) {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.markmail).append(
                                    drawOptionsActions(action.flags[0], flagValues),
                                    drawDeleteButton('action')
                              ));
                        } else if (/^\$cl/.test(action.flags[0])) {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.flag).append(
                                    drawColorDropdown(action.flags[0]),
                                    drawDeleteButton('action')
                            ));
                        } else {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.tag).append(
                                  drawInputfieldAction(action.text),
                                  drawDeleteButton('action')
                          ));
                        }

                    }
                    else {
                        listActions.append($('<li>').addClass('filter-settings-view').attr('data-action-id', num).text(actionsTranslations[action.id]).append(
                                drawDeleteButton('action')
                        ));
                    }

                }
            });

            this.append(listTests, listActions);

//            listTests.sortable({
//                containment: this,
//                axis: 'y',
//                scroll: true,
//                delay: 150,
//                stop: function (e, ui) {
////                    widgets.save(list);
//                }
//            });

//            listActions.sortable({
//                containment: this,
//                axis: 'y',
//                scroll: true,
//                delay: 150,
//                stop: function (e, ui) {
////                    widgets.save(list);
//                }
//            });
        }
    });

    views.point(POINT + '/view').extend(new forms.ControlGroup({
        id: 'rulename',
        index: 100,
        fluid: true,
        label: 'rulename',
        control: '<input type="text" class="span7" name="rulename">',
        attribute: 'rulename'
    }));

    function updateChoice() {
        this.nodes.select.val(this.model.get(this.attributeStack)[this.attribute]);
    }

    function render() {
        var self = this;
        this.nodes = {};
        this.nodes.select = $('<select>');
        if (this.multiple) {
            this.nodes.select.attr('multiple', 'multiple');
        }
        _(this.selectOptions).each(function (label, value) {
            self.nodes.select.append(
                $("<option>", {value: value}).text(label)
            );
        });
        this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
        this.updateChoice();
        this.nodes.select.on('change', function () {
            var completeData = self.model.get(self.attributeStack);
            if (completeData.tests) { // check if there are multiple tests
                completeData.id = self.nodes.select.val();
                self.model.set(self.attributeStack, completeData, {validate: true});
            }

        });
    }

    views.point(POINT + '/view').extend(new forms.SelectBoxField({
        id: 'appliesTo',
        index: 100,
        fluid: true,
        label: 'applies to',
        attributeStack: 'test',
        attribute: 'id',
        selectOptions: {allof: 'allof', anyof: 'anyof'},
        render: render,
        updateChoice: updateChoice

    }));



    return AccountDetailView;
});
