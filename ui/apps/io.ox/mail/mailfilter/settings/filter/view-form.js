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
    ['io.ox/core/notifications',
     'gettext!io.ox/settings/settings',
     'io.ox/core/extensions',
     'io.ox/backbone/forms',
     'io.ox/backbone/views',
     'io.ox/mail/mailfilter/settings/filter/form-elements',
     'io.ox/mail/mailfilter/settings/filter/defaults',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (notifications, gt, ext, forms, views, elements, DEFAULTS) {

    'use strict';

    var POINT = 'io.ox/mailfilter/settings/filter/detail',

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

        checkForMultipleTests = function (el) {
            return $(el).find('[data-test-id]');
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

                'click [data-action=change-value-extern]': 'onChangeValueExtern',

                'click [data-action="change-value-actions"]': 'onChangeValueAction',
                'change [data-action="change-text-test"]': 'onChangeTextTest',
                'change [data-action="change-text-test-second"]': 'onChangeTextTestSecond',

                'change [data-action="change-text-action"]': 'onChangeTextAction',
                'click .folderselect': 'onFolderSelect',
                'click [data-action="change-color"]': 'onChangeColor',
                'click [data-action="remove-test"]': 'onRemoveTest',
                'click [data-action="remove-action"]': 'onRemoveAction',
                'click .newcondition': 'onCreateNewCondition',
                'click .newaction': 'onCreateNewAction',
                'click [data-action="check-for-stop"]': 'onCheckStopAction'
            },

            onRemoveTest: function (e) {

                e.preventDefault();
                var node = $(e.target),
                    testID = node.closest('li').attr('data-test-id'),
                    testArray =  this.model.get('test');

                if (checkForMultipleTests(this.el).length > 2) {
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
                    actionID = node.closest('li').attr('data-action-id'),
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
                        var newCreatedFilter =  self.model.attributes;
                        newCreatedFilter.id = response;
                        self.collection.add(newCreatedFilter);
                    }

                }).fail(function (response) {
                    self.dialog.idle();
                    _.each(response.error_params, function (error) {
                        notifications.yell('error', gt(error));
                    });

                });
            },

            onChangeValueExtern: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    data = node.data();

                if (data.target) {
                    var arrayOfTests = this.model.get('test');
                    arrayOfTests.id = data.value;
                    this.model.set('test', arrayOfTests);
                }
                this.render();

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
                    translatedValue = type === 'size' ? sizeValues[value] : containsValues[value];

                if (testAction === 'create-test') {
                    list.remove();
                    if (checkForMultipleTests(this.el).length > 1) {
                        testArray.tests.push(_.copy(DEFAULTS.tests[value], true));

                    } else if (checkForMultipleTests(this.el).length === 1) {
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

                    if (checkForMultipleTests(this.el).length > 1) {
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
                    testArray =  this.model.get('test');

                if (checkForMultipleTests(this.el).length > 1) {
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
                    testArray =  this.model.get('test');

                if (checkForMultipleTests(this.el).length > 1) {
                    testArray.tests[testID][type] = [value];
                } else {
                    testArray[type] = [value];
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
                e.preventDefault();
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
                            inputField.attr('title', value);
                        }
                        tree.destroy().done(function () {
                            tree = dialog = null;
                        });
                        self.dialog.getPopup().show();
                    });
                });
            },

            onChangeColor: function (e) {
                e.preventDefault();
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
                        elements.drawOptions('true', headerTranslation)
                    )
                );

            },

            onCreateNewAction: function () {
                var list = $(this.el).find('ol.widget-list.actions');
                list.append($('<li>').addClass('filter-settings-view').attr({'data-action': 'create-action'}).text(gt('select new action type')).append(
                        elements.drawOptions('keep', actionsTranslations)
                    )
                );

            },

            onCheckStopAction: function (e) {
                var currentState = $(e.currentTarget).attr('checked'),
                    arrayOfActions = this.model.get('actioncmds'),
                    currentPosition;


                function filterForValue(array) {
                    _.each(array, function (single, id) {
                        currentPosition = single.id === 'stop' ? id : undefined;
                    });
                }

                filterForValue(arrayOfActions, 'stop');

                if (currentState === 'checked') {
                    arrayOfActions.splice(currentPosition, 1);

                } else {
                    arrayOfActions.push({id: 'stop'});
                }

                this.model.set('actioncmds', arrayOfActions);

            }

        });

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            var listTests = $('<ol class="widget-list tests">'),
                listActions = $('<ol class="widget-list actions">'),
                appliedTest = baton.model.get('test');

            if (appliedTest.tests) {
                appliedTest = appliedTest.tests;
            } else {
                appliedTest = [appliedTest];
            }

            _(appliedTest).each(function (test, num) {
                if (test.id === 'size') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'size', 'data-test-id': num}).text(headerTranslation[test.id]).append(
                            elements.drawOptions(test.comparison, sizeValues),
                            elements.drawInputfieldTest(test.size),
                            elements.drawDeleteButton('test')
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

                    if (test.headers[0] === '' || name === undefined) {
                        name = headerTranslation.cleanHeader;
                        listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num, 'data-type': 'values', 'data-type-second': 'headers' }).text(name).append(
                                elements.drawInputfieldTestSecond(test.headers[0]),
                                elements.drawOptions(test.comparison, containsValues),
                                elements.drawInputfieldTest(test.values[0]),
                                elements.drawDeleteButton('test')
                            )
                        );
                    } else {
                        listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num, 'data-type': 'values'}).text(name).append(
                                elements.drawOptions(test.comparison, containsValues),
                                elements.drawInputfieldTest(test.values[0]),
                                elements.drawDeleteButton('test')
                            )
                        );
                    }

                } else if (appliedTest.length !== 1 && test.id === 'true') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-test-id': num}).text('ein Fall von Alle').append(
                            elements.drawDeleteButton('test')
                    ));
                } else if (test.id === 'envelope') {

                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'values', 'data-test-id': num}).text(headerTranslation[test.id]).append(
                            elements.drawOptions(test.comparison, containsValues),
                            elements.drawInputfieldTest(test.values[0]),
                            elements.drawDeleteButton('test')
                        )
                    );

                }

            });

            _(baton.model.get('actioncmds')).each(function (action, num) {
                if (action.id !== 'stop') {

                    if (action.id === 'redirect') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'to'}).text(actionsTranslations[action.id]).append(
                                elements.drawInputfieldAction(action.to),
                                elements.drawDeleteButton('action')
                            )
                        );
                    }

                    else if (action.id === 'move') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'into'}).text(actionsTranslations[action.id]).append(
                            elements.drawDisabledInputfield(action.into),
                            elements.drawFolderSelect(),
                            elements.drawDeleteButton('action')
                        ));
                    }
                    else if (action.id === 'reject') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations[action.id]).append(
                            elements.drawInputfieldAction(action.text),
                            elements.drawDeleteButton('action')
                        ));
                    }
                    else if (action.id === 'addflags') {
                        if (/delete|seen/.test(action.flags[0])) {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.markmail).append(
                                    elements.drawOptionsActions(action.flags[0], flagValues),
                                    elements.drawDeleteButton('action')
                              ));
                        } else if (/^\$cl/.test(action.flags[0])) {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.flag).append(
                                    elements.drawColorDropdown(action.flags[0], COLORS, COLORFLAGS),
                                    elements.drawDeleteButton('action')

                            ));
                        } else {
                            listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations.tag).append(
                                  elements.drawInputfieldAction(action.text),
                                  elements.drawDeleteButton('action')
                          ));
                        }

                    }
                    else {
                        listActions.append($('<li>').addClass('filter-settings-view').attr('data-action-id', num).text(actionsTranslations[action.id]).append(
                                elements.drawDeleteButton('action')
                        ));
                    }

                }
            });

            var headlineTest = $('<legend>').addClass("sectiontitle expertmode").text(gt('Conditions')),
                headlineActions = $('<legend>').addClass("sectiontitle expertmode").text(gt('Actions'));

            this.append(headlineTest, listTests, elements.drawCreateNewTestButton(), headlineActions, listActions, elements.drawCreateNewActionButton());

        }
    });

    views.point(POINT + '/view').extend(new forms.ControlGroup({
        id: 'rulename',
        index: 100,
        fluid: true,
        label: gt('Rule name'),
        control: '<input type="text" class="span7" name="rulename">',
        attribute: 'rulename'
    }));


    ext.point(POINT + '/view').extend({
        index: 100,
        id: 'appliesto',
        draw: function (baton) {
            var arrayOfTests = baton.model.get('test'),
                options = {
                    target: 'id'
//                    test: { nrInArray: '', target: ''  },
//                    action: { nrInArray: '', target: ''  }
                },
                partOne,
                partTwo,
                optionsSwitch = elements.drawOptionsExtern(arrayOfTests.id, {allof: gt('all'), anyof: gt('any')}, options, 'no-positioning');
            if (arrayOfTests.id === 'allof' || arrayOfTests.id === 'anyof') {
                if (arrayOfTests.id === 'allof') {
                    partOne = gt('Apply rule if');
                    partTwo = gt('conditions are met.');
                } else {
                    partOne = gt('Apply rule if');
                    partTwo = gt('condition is met.');
                }
                this.append($('<span>').text(partOne), optionsSwitch, $('<span>').text(partTwo));
            }

        }
    });

    ext.point(POINT + '/view').extend({
        index: 200,
        id: 'stopaction',
        draw: function (baton) {

            var arrayOfActions = baton.model.get('actioncmds'),
            checkbox,
            stopAction;

            function filterForValue(array, value) {
                _.each(array, function (single, id) {
                    stopAction = single.id === 'stop' ? false : true;
                });
            }

            filterForValue(arrayOfActions, 'stop');
            this.append(elements.drawcheckbox(stopAction));

        }
    });

    return AccountDetailView;
});
