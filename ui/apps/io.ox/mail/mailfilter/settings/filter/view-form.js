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
            reject: gt('Reject with reason')
//            gt('Mark mail as'),
//            gt('Tag mail with'),
//            gt('Flag mail with')
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
                return this;

            },
            events: {
                'save': 'onSave',
                'click [data-action="change-value"]': 'onChangeValue',
                'change [data-action="change-text-test"]': 'onChangeTextTest',
                'change [data-action="change-text-action"]': 'onChangeTextAction',
                'click .folderselect': 'onFolderSelect'
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
                    translatedValue = type === 'size' ? sizeValues[value] : containsValues[value];

                link.text(translatedValue);

                testArray.tests[testID].comparison = value;
                this.model.set('test', testArray);

                console.log(this.model.get('test'));
            },

            onChangeTextTest: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.val(),
                    list = node.closest('li'),
                    type = list.attr('data-type'),
                    testID = list.attr('data-test-id'),
                    testArray =  this.model.get('test');

                testArray.tests[testID][type] = type === 'size' ? value : [value];
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

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            var listTests = $('<ol class="widget-list">'),
                listActions = $('<ol class="widget-list">').text('actions');

            var appliedTest = baton.model.get('test').tests;

//            console.log(appliedTest);

            _(appliedTest).each(function (test, num) {
                if (test.id === 'size') {
                    listTests.append($('<li>').addClass('filter-settings-view').attr({'data-type': 'size', 'data-test-id': num}).text(sizeTitles[test.id]).append(drawOptions(test.comparison, sizeValues), drawInputfieldTest(test.size)));
                } else if (test.id === 'header') {
                    var name;
                    if (test.headers[3]) {
                        name = headerTranslation.mailingList;
                    } else if (test.headers[1]) {
                        name = headerTranslation.any;
                    } else {
                        name = test.headers[0] === '' ? headerTranslation.cleanHeader : headerTranslation[test.headers[0]];
                    }

                    listTests.append($('<li>').addClass('filter-settings-view').attr('data-test-id', num).text(name).append(drawOptions(test.comparison, containsValues), drawInputfieldTest(test.values[0])));
                }

            });

            console.log(baton.model.get('actioncmds'));

            _(baton.model.get('actioncmds')).each(function (action, num) {
                if (action.id !== 'stop') {

                    if (action.id === 'redirect') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'to'}).text(actionsTranslations[action.id]).append(drawInputfieldAction(action.to)));
                    }

                    else if (action.id === 'move') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'into'}).text(actionsTranslations[action.id]).append(
                            drawDisabledInputfield(action.into),
                            drawFolderSelect()
                        ));
                    }
                    else if (action.id === 'reject') {
                        listActions.append($('<li>').addClass('filter-settings-view').attr({'data-action-id': num, 'data-type': 'text'}).text(actionsTranslations[action.id]).append(
                            drawInputfieldAction(action.text)
                        ));
                    } else {
                        listActions.append($('<li>').addClass('filter-settings-view').attr('data-action-id', num).text(actionsTranslations[action.id]));
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
            completeData.id = self.nodes.select.val();
            self.model.set(self.attributeStack, completeData, {validate: true});
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
