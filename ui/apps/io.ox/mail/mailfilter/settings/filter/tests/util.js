/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */

define('io.ox/mail/mailfilter/settings/filter/tests/util', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/mailfilter'

], function (ext, mini, Dropdown, gt) {

    'use strict';

    var Input = mini.InputView.extend({
        events: { 'change': 'onChange', 'keyup': 'onKeyup' },
        onChange: function () {
            if (this.name === 'size') {
                var isValid = /^[0-9]+$/.test(this.$el.val()) && parseInt(this.$el.val(), 10) < 2147483648 && parseInt(this.$el.val(), 10) >= 0;
                if (isValid) {
                    this.model.set(this.name, parseInt(this.$el.val(), 10));
                    this.update();
                }
            }
            if (this.name === 'values' || this.name === 'headers') this.model.set(this.name, [this.$el.val()]);
        },
        onKeyup: function () {
            var state,
                isValid;
            if (this.name === 'size') {
                isValid = /^[0-9]+$/.test(this.$el.val()) && parseInt(this.$el.val(), 10) < 2147483648 && parseInt(this.$el.val(), 10) >= 0;
                state = isValid ? 'valid:' : 'invalid:';
            } else {
                state = $.trim(this.$el.val()) === '' ? 'invalid:' : 'valid:';
            }
            this.model.trigger(state + this.name);
            this.$el.trigger('toggle:saveButton');
        }
    });

    var drawDeleteButton = function (type) {
        return $('<a href="#" class="remove" tabindex="0">').attr('data-action', 'remove-' + type).append($('<i class="fa fa-trash-o">'));
    };

    var drawCondition = function (o) {
        if (o.layout === '3') {
            return $('<li>').addClass('filter-settings-view row layout-3 ' + o.addClass).attr({ 'data-test-id': o.conditionKey }).append(
                $('<div>').addClass('col-sm-2 doubleline').append(
                    $('<span>').addClass('list-title').text(o.title)
                ),
                $('<div>').addClass('col-sm-10').append(
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-sm-4 dualdropdown').append(
                            $('<div>').addClass('row').append(
                                $('<label class="col-sm-4">').text(gt('Header')),
                                $('<div>').addClass('col-sm-8').append(
                                    new mini.DropdownLinkView(o.seconddropdownOptions).render().$el
                                )
                            ),
                            $('<div>').addClass('row').append(
                                $('<label class="col-sm-4">').text(gt('Part')),
                                $('<div>').addClass('col-sm-8').append(
                                    new mini.DropdownLinkView(o.thirddropdownOptions).render().$el
                                )
                            )
                        ),
                        $('<div>').addClass('col-sm-3 dropdownadjust').append(
                            new mini.DropdownLinkView(o.dropdownOptions).render().$el
                        ),
                        $('<div>').addClass('col-sm-5 doubleline').append(
                            $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                            new Input(o.inputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    )
                ),
                drawDeleteButton('test')
            );
        }

        if (o.secondInputId) {
            return $('<li>').addClass('filter-settings-view row ' + o.addClass).attr({ 'data-test-id': o.conditionKey }).append(
                $('<div>').addClass('col-sm-4 doubleline').append(
                    $('<span>').addClass('list-title').text(o.title)
                ),
                $('<div>').addClass('col-sm-8').append(
                    $('<div>').addClass('row').append(
                        $('<label for="' + o.inputId + '" class="col-sm-4 control-label" >').text(gt('Name')),
                        $('<div>').addClass('first-label inline-input col-sm-8').append(
                            new Input(o.inputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    ),
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-sm-4').append(
                            new mini.DropdownLinkView(o.dropdownOptions).render().$el
                        ),
                        $('<div class="col-sm-8">').append(
                            $('<label for="' + o.secondInputId + '" class="sr-only">').text(o.secondInputLabel),
                            new Input(o.secondInputOptions).render().$el,
                            o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                        )
                    )
                ),
                drawDeleteButton('test')
            );
        }
        return $('<li>').addClass('filter-settings-view row ' + o.addClass).attr({ 'data-test-id': o.conditionKey }).append(
            $('<div>').addClass('col-sm-4 singleline').append(
                $('<span>').addClass('list-title').text(o.title)
            ),
            $('<div>').addClass('col-sm-8').append(
                $('<div>').addClass('row').append(
                    o.seconddropdownOptions ? $('<div>').addClass('col-sm-2').append(
                        new mini.DropdownLinkView(o.seconddropdownOptions).render().$el
                    ) : [],
                    $('<div>').addClass(o.seconddropdownOptions ? 'col-sm-2' : 'col-sm-4').append(
                        o.dropdownOptions ? new mini.DropdownLinkView(o.dropdownOptions).render().$el : []
                    ),
                    $('<div class="col-sm-8">').append(
                        $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                        new Input(o.inputOptions).render().$el,
                        o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                    )
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
                'endswith': gt('Ends with'),
                'not endswith': gt('Ends not with')
            },
            regex = {
                'regex': gt('Regex'),
                'not regex': gt('Not Regex')
            };

        if (_.has(cap, 'regex')) {
            _.extend(defaults, regex);
        }

        return _.extend(defaults, additionalValues);
    };

    var drawDropdown = function (activeValue, values, options) {
        var active = values[activeValue] || activeValue;
        if (options.caret) {
            active = active + '<b class="caret">';
        }
        var $toggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="0">').html(active),
            $ul = $('<ul class="dropdown-menu" role="menu">').append(
                _(values).map(function (name, value) {
                    // multi optiuons?
                    if (value === options.skip) return;
                    return $('<li>').append(
                        $('<a href="#" data-action="change-dropdown-value">').attr('data-value', value).data(options).append(
                            $.txt(name)
                        )
                    );
                })
            );

        return new Dropdown({
            className: 'action dropdown value ' + options.classes,
            $toggle: $toggle,
            $ul: $ul
        }).render().$el;
    };

    return {
        Input: Input,
        drawCondition: drawCondition,
        drawDeleteButton: drawDeleteButton,
        returnContainsOptions: returnContainsOptions,
        drawDropdown: drawDropdown
    };
});
