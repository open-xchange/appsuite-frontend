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

    var POINT = 'io.ox/mailfilter/settings/filter/detail',

        DEFAULTS = {
            tests: {
                'From': {
                    'comparison': "matches",
                    'headers': ["From"],
                    'id': "header",
                    'values': ['']
                },
                'any': {
                    'comparison': "matches",
                    'headers': ["To", "Cc"],
                    'id': "header",
                    'values': ['']
                },
                'Subject': {
                    'comparison': "matches",
                    'headers': ["Subject"],
                    'id': "header",
                    'values': ['']
                },
                'mailingList': {
                    'comparison': "matches",
                    'headers': ["List-Id", "X-BeenThere", "X-Mailinglist", "X-Mailing-List"],
                    'id': "header",
                    'values': ['']
                },
                'To': {
                    'comparison': "matches",
                    'headers': ["To"],
                    'id': "header",
                    'values': ['']
                },
                'Cc': {
                    'comparison': "matches",
                    'headers': ["Cc"],
                    'id': "header",
                    'values': ['']
                },
                'cleanHeader': {
                    'comparison': "matches",
                    'headers': [""],
                    'id': "header",
                    'values': [""]
                },
                'envelope': {
                    'comparison': "matches",
                    'headers': ["To"],
                    'id': "envelope",
                    'values': [""]
                },
                'true': {
                    'id': 'true'
                },
                'size': {
                    'comparison': 'over',
                    'id': 'size',
                    'size': ''
                }
            },
            actions: {
                'keep': {
                    'id': "keep"
                },
                'discard': {
                    'id': "discard"
                },
                'redirect': {
                    'id': "redirect",
                    'to': ""
                },
                'move': {
                    'id': "move",
                    'into': ""
                },
                'reject': {
                    'id': "reject",
                    'text': ""

                },
                'markmail': {
                    'flags': ["\\seen"],
                    'id': "addflags"
                },
                'tag': {
                    'flags': ["$"],
                    'id': "addflags"

                },
                'flag': {
                    'flags': ["$cl_1"],
                    'id': "addflags"
                }
            }
        },

        sizeValues = {
            'over': gt('Is bigger than'),
            'under': gt('Is smaller than')
        },

        flagValues = {
            '\\deleted': gt('deleted'),
            '\\seen': gt('seen')
        },

        containsValues = {
            'contains': gt('Contains'),
            'is': gt('Is exactly'),
            'matches': gt('Matches'),
            'regex': gt('Regex') //needs no different translation
        },

        headerTranslation = {
            'From': gt('Sender/From'),
            'any': gt('Any recipient'),
            'Subject': gt('Subject'),
            'mailingList': gt('Mailing list'),
            'To': gt('To'),
            'Cc': gt('CC'),
            'cleanHeader': gt('Header'),
            'envelope': gt('Envelope'),
            'true': gt('All messages'),
            'size': gt('Size (bytes)')
        },

        actionsTranslations = {
            'keep': gt('Keep'),
            'discard': gt('Discard'),
            'redirect': gt('Redirect to'),
            'move': gt('Move to folder'),
            'reject': gt('Reject with reason'),
            'markmail': gt('Mark mail as'),
            'tag': gt('Tag mail with'),
            'flag': gt('Flag mail with')
        },

        COLORS = {
            NONE: { value: 0, text: gt('None') },
            RED: { value: 1, text: gt('Red') },
            ORANGE: { value: 7, text: gt('Orange') },
            YELLOW: { value: 10, text: gt('Yellow') },
            LIGHTGREEN: { value: 6, text: gt('Light green') },
            GREEN: { value: 3, text: gt('Green') },
            LIGHTBLUE: { value: 9, text: gt('Light blue') },
            BLUE: { value: 2, text: gt('Blue') },
            PURPLE: { value: 5, text: gt('Purple') },
            PINK: { value: 8, text: gt('Pink') },
            GRAY: { value: 4, text: gt('Gray') }
        },

        COLORFLAGS = {
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

//                Backbone.Validation.bind(this, {selector: 'name', forceUpdate: true});//forceUpdate needed otherwise model is always valid even if inputfields contain wrong values
            },
            render: function () {

                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);
                return this;

            },
            events: {
                'save': 'onSave',
                'click [data-action="change-value"]': 'onChangeValue',
                'click [data-action="change-value-actions"]': 'onChangeValueAction',
                'change [data-action="change-text-test"]': 'onChangeTextTest',
                'change [data-action="change-text-test-second"]': 'onChangeTextTestSecond',

                'change [data-action="change-text-action"]': 'onChangeTextAction',
                'click .folderselect': 'onFolderSelect',
                'click [data-action="change-color"]': 'onChangeColor',
                'click [data-action="remove-test"]': 'onRemoveTest',
                'click [data-action="remove-action"]': 'onRemoveAction',
                'click .newcondition': 'onCreateNewCondition',
                'click .newaction': 'onCreateNewAction'
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

            },

            onSave: function () {
                var self = this;
                this.model.save().done(function (response) {
                    self.dialog.close();
                    if (response === null) {
                        notifications.yell('success', gt('Mailfilter updated'));
                    } else {
                        notifications.yell('success', gt('Mailfilter created'));
                        var newCreatedDate =  self.model.attributes;
                        newCreatedDate.id = response;
                        self.collection.add(newCreatedDate);

                    }

                }).fail(function (response) {
                    self.dialog.idle();
                    _.each(response.error_params, function (error) {
                        notifications.yell('error', gt(error));
                    });

                });
            },

            onChangeValue: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.attr('data-value') ? node.attr('data-value') : node.parent().attr('data-value'),
                    link = node.closest('.action').find('a.dropdown-toggle'),

                    list = link.closest('li'),
                    type = list.attr('data-type'),
                    testID = list.attr('data-test-id'),
                    testAction = list.attr('data-action'),

                    testArray =  this.model.get('test'),
                    actionArray = this.model.get('actioncmds'),
                    translatedValue = type === 'size' ? sizeValues[value] : containsValues[value],
                    checkForMultipleTests = $(this.el).find('[data-test-id]');

                if (testAction === 'create-test') {
                    list.remove();
                    if (checkForMultipleTests.length > 1) {
                        testArray.tests.push(_.copy(DEFAULTS.tests[value], true));

                    } else if (checkForMultipleTests.length === 1) {
                        var createdArray = [testArray];
                        createdArray.push(_.copy(DEFAULTS.tests[value], true));
                        testArray = { id: 'allof'};
                        testArray.tests = createdArray;
                    } else {

                        testArray = _.copy(DEFAULTS.tests[value], true);
                    }

                    this.model.set('test', testArray);

                    this.render();

                } else if (testAction === 'create-action') {
                    list.remove();

                    actionArray.push(_.copy(DEFAULTS.actions[value], true));

                    this.model.set('actioncmds', actionArray);

                    this.render();

                } else {
                    link.text(translatedValue);

                    if (checkForMultipleTests.length > 1) {
                        testArray.tests[testID].comparison = value;
                    } else {
                        testArray.comparison = value;
                    }
                    this.model.set('test', testArray);
                }

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

            },

            onChangeTextTestSecond: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.val(),
                    list = node.closest('li'),
                    type = list.attr('data-type-second'),
                    testID = list.attr('data-test-id'),
                    testArray =  this.model.get('test'),
                    checkForMultipleTests = $(this.el).find('[data-test-id]');

                if (checkForMultipleTests.length > 1) {
                    testArray.tests[testID][type] = type === 'size' ? value : [value];
                } else {
                    testArray[type] = type === 'size' ? value : [value];
                }

                this.model.set('test', testArray);

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

            },

            onFolderSelect: function (e) {
                var self = this,
                    list = $(e.currentTarget).closest('li'),
                    type = list.attr('data-type'),
                    actionID = list.attr('data-action-id'),
                    inputField = list.find('input'),
                    currentFolder =  self.model.get('actioncmds')[actionID].into,
                    actionArray =  this.model.get('actioncmds');

                self.dialog.getPopup().hide();

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
                        self.dialog.getPopup().show();
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

            },

            onCreateNewCondition: function () {
                var list = $(this.el).find('ol.widget-list.tests');
                list.append($('<li>').addClass('filter-settings-view').attr({'data-action': 'create-test'}).text(gt('select new condition type')).append(
                        drawOptions('true', headerTranslation)
                    )
                );

            },

            onCreateNewAction: function () {
                var list = $(this.el).find('ol.widget-list.actions');
                list.append($('<li>').addClass('filter-settings-view').attr({'data-action': 'create-action'}).text(gt('select new action type')).append(
                        drawOptions('keep', actionsTranslations)
                    )
                );

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

    var drawInputfieldTestSecond = function (activeValue) {
        return $('<input>').attr({ type: 'text', 'data-action': 'change-text-test-second'}).val(activeValue);
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
        return $('<a href="#" class="close" data-action="remove-' + type + '">').append($('<i class="icon-trash"/>'));
    };

    var drawCreateNewTestButton = function () {
        return $('<a>').addClass('newcondition').attr('type', 'button').text(gt('Add condition'));
    };

    var drawCreateNewActionButton = function () {
        return $('<a>').addClass('newaction').attr('type', 'button').text(gt('Add action'));
    };

    function changeLabel(e) {
        e.preventDefault();
        $(this).closest('.flag-dropdown').attr('data-color-value', e.data.color).removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
    }

    var drawColorDropdown = function (activeColor) {

        var flagclass = 'flag_' + COLORFLAGS[activeColor];
        return $('<div class="dropdown flag-dropdown clear-title flag">').attr({'data-color-value': activeColor})
        .addClass(flagclass)
        .append(
            // box
            $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown">'),
            // drop down
            $('<ul class="dropdown-menu">')
            .append(
                _(COLORS).map(function (colorObject) {
                    return $('<li>').append(
                        $('<a href="#">').attr({'data-action': 'change-color'}).append(
                            colorObject.value > 0 ? $('<span class="flag-example">').addClass('flag_' + colorObject.value) : $(),
                            $.txt(colorObject.text)
                        )
                        .on('click', { color: colorObject.value, flagclass: flagclass }, changeLabel)
                    );
                })
            )
        );
    };

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            var listTests = $('<ol class="widget-list tests">'),
                listActions = $('<ol class="widget-list actions">');

            var appliedTest = baton.model.get('test');

            if (appliedTest.tests) {
                appliedTest = appliedTest.tests;
            } else {
                appliedTest = [appliedTest];
            }

            _(appliedTest).each(function (test, num) {
                if (test.id === 'size') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'size', 'data-test-id': num}).text(headerTranslation[test.id]).append(
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

                    if (test.headers[0] === '') {
                        listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num, 'data-type': 'values', 'data-type-second': 'headers' }).text(name).append(
                                drawInputfieldTestSecond(test.headers[0]),
                                drawOptions(test.comparison, containsValues),
                                drawInputfieldTest(test.values[0]),
                                drawDeleteButton('test')
                            )
                        );
                    } else {
                        listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num, 'data-type': 'values'}).text(name).append(
                                drawOptions(test.comparison, containsValues),
                                drawInputfieldTest(test.values[0]),
                                drawDeleteButton('test')
                            )
                        );
                    }

                } else if (appliedTest.length !== 1 && test.id === 'true') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num}).text('ein Fall von Alle').append(
                            drawDeleteButton('test')
                    ));
                } else if (test.id === 'envelope') {

                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'values', 'data-test-id': num}).text(headerTranslation[test.id]).append(
                            drawOptions(test.comparison, containsValues),
                            drawInputfieldTest(test.values[0]),
                            drawDeleteButton('test')
                        )
                    );

                }

            });

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


            var headlineTest = $('<legend>').addClass("sectiontitle expertmode").text(gt('Conditions'));
            var headlineActions = $('<legend>').addClass("sectiontitle expertmode").text(gt('Actions'));

            this.append(headlineTest, listTests, drawCreateNewTestButton(), headlineActions, listActions, drawCreateNewActionButton());

        }
    });

    views.point(POINT + '/view').extend(new forms.ControlGroup({
        id: 'rulename',
        index: 100,
        fluid: true,
        label: gt('rulename'),
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
        selectOptions: {allof: gt('all'), anyof: gt('any')},
        render: render,
        updateChoice: updateChoice

    }));

    return AccountDetailView;
});
