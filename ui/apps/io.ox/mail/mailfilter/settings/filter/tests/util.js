/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/mailfilter/settings/filter/tests/util', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/mailfilter'

], function (ext, mini, Dropdown, gt) {

    'use strict';

    var DropdownLinkView = mini.DropdownLinkView.extend({
        updateLabel: function () {
            this.$el.find('.dropdown-label').text(this.options.values[this.model.get(this.name)] || this.model.get(this.name));
        }
    });

    var validateSize = (function () {
        // prevent values that cause int32 overflow on mw
        var SIZELIMITS = { 'B': 2147483648, 'K': 2097152, 'M': 2048, 'G': 2 };
        return function (data) {
            return /^[0-9]+$/.test(data.size) &&
                parseInt(data.size, 10) >= 0 &&
                parseInt(data.size, 10) < SIZELIMITS[data.unit];
        };
    }());

    var Input = mini.InputView.extend({
        events: { 'change': 'onChange', 'keyup': 'onKeyup', 'paste': 'onPaste' },

        validationForSize: function () {
            return validateSize({
                size: parseInt(this.$el.val(), 10),
                unit: this.model.get('unit')
            });
        },

        onChange: function () {
            if (this.name === 'values' || this.name === 'headers' || this.name === 'source') {
                this.model.set(this.name, [this.$el.val()]);
            } else {
                this.model.set(this.name, this.$el.val());
            }
            // force validation
            this.onKeyup();
        },
        onKeyup: function () {
            var state;

            if (this.name === 'sizeValue') {
                state = this.validationForSize() ? 'valid:' : 'invalid:';
            } else {
                state = $.trim(this.$el.val()) === '' && this.$el.prop('disabled') === false ? 'invalid:' : 'valid:';
            }

            this.model.trigger(state + this.name);
            this.$el.trigger('toggle:saveButton');
        }
    });

    var drawDeleteButton = function (type) {
        return $('<button type="button" class="btn btn-link remove">')
            .attr({ 'data-action': 'remove-' + type, 'aria-label': gt('Remove') })
            .append($('<i class="fa fa-trash-o" aria-hidden="true">').attr('title', gt('Remove')));
    };

    var drawCondition = function (o) {
        if (o.layout === '3') {
            return $('<li class="filter-settings-view row layout-3">').addClass(o.addClass).attr('data-test-id', o.conditionKey).append(
                $('<div class="col-sm-2 doubleline">').append(
                    $('<span class="list-title">').text(o.title)
                ),
                $('<div class="col-sm-10">').append(
                    $('<div class="row flex">').append(
                        $('<div class="col-sm-4 dualdropdown">').append(
                            $('<div class="row">').append(
                                $('<label class="col-sm-4">').text(gt('Header')),
                                $('<div class="col-sm-8">').append(
                                    new DropdownLinkView(o.seconddropdownOptions).render().$el
                                )
                            ),
                            $('<div class="row">').append(
                                $('<label class="col-sm-4">').text(gt('Part')),
                                $('<div class="col-sm-8">').append(
                                    new DropdownLinkView(o.thirddropdownOptions).render().$el
                                )
                            )
                        ),
                        $('<div class="col-sm-3">').append(
                            new DropdownLinkView(o.dropdownOptions).render().$el
                        ),
                        $('<div class="col-sm-5 doubleline">').append(
                            $('<label class="sr-only">').attr('for', o.inputId).text(o.inputLabel),
                            new Input(o.inputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    )
                ),
                drawDeleteButton('test')
            );
        }

        if (o.secondInputId) {
            return $('<li class="filter-settings-view row">').addClass(o.addClass).attr('data-test-id', o.conditionKey).append(
                $('<div class="col-sm-4 doubleline">').append(
                    $('<span class="list-title">').text(o.title)
                ),
                $('<div class="col-sm-8">').append(
                    $('<div class="row">').append(
                        $('<label class="col-sm-4 control-label">').attr('for', o.inputId).text(o.InputLabel ? o.InputLabel : gt('Name')),
                        $('<div class="first-label inline-input col-sm-8">').append(
                            new Input(o.inputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-4">').append(
                            new DropdownLinkView(o.dropdownOptions).render().$el
                        ),
                        $('<div class="col-sm-8">').append(
                            $('<label class="sr-only">').attr('for', o.secondInputId).text(o.secondInputLabel),
                            new Input(o.secondInputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    )
                ),
                drawDeleteButton('test')
            );
        }
        return $('<li class="filter-settings-view row">').addClass(o.addClass).attr('data-test-id', o.conditionKey).append(
            $('<div class="col-sm-4 singleline">').append(
                $('<span class="list-title">').text(o.title)
            ),
            $('<div class="col-sm-8">').append(
                $('<div class="row">').append(
                    o.seconddropdownOptions ? $('<div class="col-sm-2">').append(
                        new DropdownLinkView(o.seconddropdownOptions).render().$el
                    ) : [],
                    o.inputOptions ? $('<div>').addClass(o.inputOptions.name === 'size' ? 'col-sm-7' : 'col-sm-4').append(
                        o.dropdownOptions ? new DropdownLinkView(o.dropdownOptions).render().$el : []
                    ) : [],
                    o.inputOptions ? $('<div>').addClass(o.inputOptions.name === 'size' ? 'col-sm-5' : 'col-sm-8').append(
                        $('<label class="sr-only">').attr('for', o.inputId).text(o.inputLabel),
                        new Input(o.inputOptions).render().$el,
                        o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                    ) : []
                )
            ),
            drawDeleteButton('test')
        );

    };

    var returnContainsOptions = function (cap, additionalValues) {

        var defaults = {
            'contains': gt('Contains'),
            'not contains': gt('Contains not'),
            'is': gt('Is exactly'),
            'not is': gt('Is not exactly'),
            'matches': gt('Matches'),
            'not matches': gt('Matches not'),
            //needs no different translation
            'startswith': gt('Starts with'),
            'not startswith': gt('Starts not with'),
            //#. a given string does end with a specified pattern
            'endswith': gt('Ends with'),
            //#. a given string does not end with a specified pattern
            'not endswith': gt('Ends not with'),
            'regex': gt('Regex'),
            'not regex': gt('Not Regex'),
            'exists': gt('Exists'),
            'not exists': gt('Does not exist')
        };

        return _.extend(defaults, additionalValues);
    };

    var returnDefaultToolTips = function () {
        return {
            'contains': gt('matches a substring'),
            'not contains': gt('does not match a substring'),
            'is': gt('an exact, full match'),
            'not is': gt('not an exact, full match '),
            'matches': gt('a full match (allows DOS-style wildcards)'),
            'not matches': gt('not a full match (allows DOS-style wildcards)'),
            'startswith': gt('Starts with'),
            'not startswith': gt('Starts not with'),
            'endswith': gt('Ends with'),
            'not endswith': gt('Ends not with'),
            'regex': gt('Regex'),
            'not regex': gt('Not Regex'),
            'exists': gt('Exists'),
            'not exists': gt('Does not exist')
        };
    };

    var drawDropdown = function (activeValue, values, options) {
        var active = values[activeValue] || activeValue;
        if (options.caret) {
            active = active + '<b class="caret">';
        }


        function getOptions() {
            return options.sort ?
                _(options.sort).map(function (value) {
                    if (value === options.skip) return;
                    return $('<li>').append(
                        $('<a href="#" data-action="change-dropdown-value" role="menuitemradio">').attr('data-value', value).data(options).append(
                            $.txt(values[value])
                        )
                    );
                }) :
                _(values).map(function (name, value) {
                    if (value === options.skip) return;
                    return $('<li>').append(
                        $('<a href="#" data-action="change-dropdown-value">').attr('data-value', value).data(options).append(
                            $.txt(name)
                        )
                    );
                });
        }

        var $toggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="0">').html(active),
            $ul = $('<ul class="dropdown-menu" role="menu">').append(
                getOptions()
            );

        return new Dropdown({
            className: 'action dropdown value ' + (options.classes ? options.classes : ''),
            $toggle: $toggle,
            $ul: $ul
        }).render().$el;
    };

    var filterHeaderValues = function (tests, testId, values) {
        var id = _.findIndex(tests, { id: testId }),
            availableValues = {};

        _.each(values, function (value, key) {
            if (_.indexOf(tests[id].headers, key) !== -1) availableValues[key] = value;
        });
        return availableValues;
    };

    var filterPartValues = function (tests, testId, values) {
        var id = _.findIndex(tests, { id: testId }),
            availableValues = {};

        _.each(values, function (value, key) {
            if (_.indexOf(tests[id].parts, key) !== -1) availableValues[key] = value;
        });
        return availableValues;
    };

    var returnDefault = function (tests, id, option, value) {
        var testId = _.findIndex(tests, { id: id }),
            optionList = tests[testId][option];
        if (_.indexOf(optionList, value) !== -1) {
            return value;
        }
        return optionList[0];
    };

    var handleUnsupportedComparisonValues = function (opt) {
        var input = opt.inputName ? opt.$li.find('[name="' + opt.inputName + '"]') : opt.$li.find('input'),
            label = opt.$li.find('[data-name="comparison"]').first().closest('.dropdownlink').find('.dropdown-label');

        if (!opt.values[opt.model.get('comparison')]) {
            input.prop('disabled', true);
            label.addClass('unsupported');
        }
        opt.model.on('change:comparison', function () {
            label.removeClass('unsupported');
        });
    };

    var handleSpecialComparisonValues = function (opt) {

        var input = opt.inputName ? opt.$li.find('[name="' + opt.inputName + '"]') : opt.$li.find('input'),
            emptyValuesAllowed = ['exists', 'not exists'];

        // handle rule from backend
        if (opt.model.get('comparison') === 'not exists' || opt.model.get('comparison') === 'exists') {
            input.prop('disabled', true);
        }

        opt.model.on('change:comparison', function (m, value) {
            if (!_.contains(emptyValuesAllowed, value)) {
                input.prop('disabled', false);
                if (opt.defaults.id !== 'header') opt.model.set('headers', opt.defaults.headers);

            } else {
                input.prop('disabled', true);
                input.val('');
                opt.model.set('values', [''], { silent: true });
                if (opt.defaults.id !== 'header') opt.model.set('headers', [''], { silent: true });
            }
            input.trigger('keyup');
        });

    };

    return {
        Input: Input,
        drawCondition: drawCondition,
        drawDeleteButton: drawDeleteButton,
        returnContainsOptions: returnContainsOptions,
        drawDropdown: drawDropdown,
        returnDefaultToolTips: returnDefaultToolTips,
        filterHeaderValues: filterHeaderValues,
        filterPartValues: filterPartValues,
        returnDefault: returnDefault,
        DropdownLinkView: DropdownLinkView,
        handleUnsupportedComparisonValues: handleUnsupportedComparisonValues,
        handleSpecialComparisonValues: handleSpecialComparisonValues,
        validateSize: validateSize
    };
});
