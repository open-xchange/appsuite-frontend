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

define('io.ox/mail/mailfilter/settings/filter/actions/util', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/mailfilter',
    'io.ox/core/folder/api'

], function (ext, mini, gt, folderAPI) {

    'use strict';

    function prepareFolderForDisplay(folder, input) {
        folderAPI.get(folder).done(function (data) {
            var arrayOfParts = folder.split('/');
            arrayOfParts.shift();
            if (data.standard_folder) {
                input.val(data.title);
            } else {
                input.val(arrayOfParts.join('/'));
            }
        });
    }

    var Input = mini.InputView.extend({
        events: { 'change': 'onChange', 'keyup': 'onKeyup', 'paste': 'onPaste' },
        onChange: function () {
            if (this.name === 'flags') {
                var value = ((/customflag_/g.test(this.id)) || (/removeflags_/g.test(this.id))) ? ['$' + this.$el.val().toString()] : [this.$el.val()];
                this.model.set(this.name, value);
            } else if (this.name === 'to') {
                this.model.set(this.name, this.$el.val().trim());
            } else {
                this.model.set(this.name, this.$el.val());
            }

            // force validation
            this.onKeyup();
        },
        update: function () {
            if (/customflag_/g.test(this.id) || /removeflags_/g.test(this.id)) {
                this.$el.val(this.model.get('flags')[0].replace(/^\$+/, ''));
            } else if (/move_/g.test(this.id) || /copy_/g.test(this.id)) {
                prepareFolderForDisplay(this.model.get('into'), this.$el);
            } else {
                this.$el.val($.trim(this.model.get(this.name)));
            }
        },
        onKeyup: function () {
            var state = $.trim(this.$el.val()) === '' ? 'invalid:' : 'valid:';
            this.model.trigger(state + this.name);
            this.$el.trigger('toggle:saveButton');
        }
    });

    var Dropdown = mini.DropdownLinkView.extend({
        onClick: function (e) {
            e.preventDefault();
            if (/markas_/g.test(this.id)) {
                this.model.set(this.name, [$(e.target).attr('data-value')]);
            } else {
                this.model.set(this.name, $(e.target).attr('data-value'));
            }
        }
    });

    var drawAction = function (o) {
        var errorView = o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : [];

        if (o.activeLink) {
            return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': o.actionKey }).append(
                $('<div>').addClass('col-sm-4 singleline').append(
                    $('<span>').addClass('list-title').text(o.title)
                ),
                $('<div>').addClass('col-sm-8').append(
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-sm-4 rightalign').append(
                            $('<a href="#" class="folderselect">').text(gt('Select folder')).data({ 'model': o.inputOptions.model })
                        ),
                        $('<div class=" col-sm-8">').append(
                            $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                            new Input(o.inputOptions).render().$el.prop('disabled', true)
                        )
                    )
                ),
                drawDeleteButton('action')
            );
        } else if (/markas_/g.test(o.inputId)) {
            return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': o.actionKey }).append(
                $('<div>').addClass('col-sm-4 singleline').append(
                    $('<span>').addClass('list-title').text(o.title)
                ),

                $('<div>').addClass('col-sm-8').append(
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-sm-3 col-sm-offset-9 rightalign').append(
                            new Dropdown(o.dropdownOptions).render().$el
                        )
                    )
                ),
                drawDeleteButton('action')
            );
        } else if (/discard_/g.test(o.inputId) || /keep_/g.test(o.inputId)) {
            return $('<li>').addClass('filter-settings-view ' + o.addClass + ' row').attr('data-action-id', o.actionKey).append(
                $('<div>').addClass('col-sm-4 singleline').append(
                    $('<span>').addClass('list-title').text(o.title)
                ),
                drawDeleteButton('action')
            );
        }
        return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': o.actionKey }).append(
            $('<div>').addClass('col-sm-4 singleline').append(
                $('<span>').addClass('list-title').text(o.title)
            ),
            $('<div>').addClass('col-sm-8').append(
                $('<div>').addClass('row').append(
                    $('<div>').addClass('col-sm-8 col-sm-offset-4').append(
                        $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                        new Input(o.inputOptions).render().$el,
                        errorView
                    )
                )
            ),
            drawDeleteButton('action')
        );
    };

    var drawDeleteButton = function (type) {
        return $('<button type="button" class="btn btn-link remove">')
            .attr({ 'data-action': 'remove-' + type, 'aria-label': gt('Remove') })
            .append($('<i class="fa fa-trash-o" aria-hidden="true">').attr('title', gt('Remove')));
    };

    var drawColorDropdown = function (activeColor, colors, colorflags) {

        function changeLabel(e) {
            e.preventDefault();
            $(this).closest('.flag-dropdown').attr('data-color-value', e.data.color).removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
        }

        var flagclass = 'flag_' + colorflags[activeColor];
        return $('<div class="dropup flag-dropdown clear-title flag">').attr('data-color-value', activeColor)
        .addClass(flagclass)
        .append(
            // box
            $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">'),
            // drop down
            $('<ul class="dropdown-menu" role="menu">')
            .append(
                _(colors).map(function (colorObject) {
                    return $('<li>').append(
                        $('<a href="#" data-action="change-color" tabindex="1">').append(
                            colorObject.value > 0 ? $('<span class="flag-example">').addClass('flag_' + colorObject.value) : $(),
                            $.txt(colorObject.text)
                        )
                        .on('click', { color: colorObject.value, flagclass: flagclass }, changeLabel)
                    );
                })
            )
        );
    };

    return {
        Input: Input,
        drawAction: drawAction,
        Dropdown: Dropdown,
        drawDeleteButton: drawDeleteButton,
        prepareFolderForDisplay: prepareFolderForDisplay,
        drawColorDropdown: drawColorDropdown
    };
});


