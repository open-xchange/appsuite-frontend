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
                'change [data-action="change-text"]': 'onChangeText'
            },
            onSave: function () {
                console.log('der SAVE');
            },

            onChangeValue: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.attr('data-value') ? node.attr('data-value') : node.parent().attr('data-value');
                console.log(value);
            },

            onChangeText: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    value = node.val();
                console.log(value);
            }
        });

    var drawOptions = (function () {

        var sizeValues = {
            over: 'over',
            under: 'under'
        };

        return function (activeValue, type) {
            return $('<div class="action dropdown value">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(activeValue),
                $('<ul class="dropdown-menu">').append(
                    _(sizeValues).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value', 'data-value': value }).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        };
    }());

    var drawInputfield = (function () {
        return function (activeValue) {
            return $('<input>').attr({ type: 'text', 'data-action': 'change-text' }).val(activeValue);
        };
    }());

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            var listTests = $('<ol class="widget-list">'),
                listActions = $('<ol class="widget-list">').text('actions');

            var appliedTest = baton.model.get('test').tests;

            _(appliedTest).each(function (test) {
                if (test.id === 'size') {
                    listTests.append($('<li>').addClass('filter-settings-view').text(test.id).append(drawOptions(test.comparison), drawInputfield(test.size)));
                } else {
                    listTests.append($('<li>').addClass('filter-settings-view').text(test.id));
                }

            });

            _(baton.model.get('actioncmds')).each(function (action) {
                if (action.id !== 'stop') {
                    listActions.append($('<li>').attr('data-property', action.id).text(action.id));
                }
            });

            this.append(listTests, listActions);

            listTests.sortable({
                containment: this,
                axis: 'y',
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
//                    widgets.save(list);
                }
            });

            listActions.sortable({
                containment: this,
                axis: 'y',
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
//                    widgets.save(list);
                }
            });
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
