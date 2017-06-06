/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/core/settings/util', [
    'io.ox/backbone/mini-views/common'
], function (miniViews) {

    'use strict';

    var that = {
        header: function (text) {
            return $('<h1>').text(text);
        },
        checkbox: function (id, label, model, link) {
            if (model.isConfigurable && !model.isConfigurable(id)) return $();
            var guid = _.uniqueId('form-control-label-');
            return $('<div class="checkbox">').append(
                $('<label class="control-label">').attr('for', guid).text(label).prepend(
                    new miniViews.CheckboxView({ id: guid, name: id, model: model }).render().$el
                ),
                link ? link : ''
            );
        },
        select: function (id, label, model, options, View) {
            var SelectView = View ? View : miniViews.SelectView;
            var guid = _.uniqueId('form-control-label-');
            return [
                $('<label class="control-label col-sm-4">').attr('for', guid).text(label),
                $('<div class="col-sm-6">').append(
                    new SelectView({
                        list: options,
                        name: id,
                        model: model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            ];
        },
        inlineSelect: function (id, labelBefore, copyAfter, model, options, View) {
            var SelectView = View ? View : miniViews.SelectView;
            var guid = _.uniqueId('form-control-label-');
            var nonBreakingWhitespaceChar = '\u00A0';
            return [
                $('<label class="control-label" style="display: inline-block">').attr('for', guid).text(labelBefore + nonBreakingWhitespaceChar),
                $('<span style="display: inline-block">').append(
                    new SelectView({
                        list: options,
                        name: id,
                        model: model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                ),
                $('<label class="control-label" style="display: inline-block">').attr('for', guid).text(nonBreakingWhitespaceChar + copyAfter + '.')
            ];
        },
        fieldset: function (text) {
            var args = _(arguments).toArray();
            return $('<fieldset>').append($('<legend class="sectiontitle">').append($('<h2>').text(text))).append(args.slice(1));
        },
        input: function (id, label, model) {
            var guid = _.uniqueId('form-control-label-');
            return [
                $('<label>').attr('for', guid).text(label),
                new miniViews.InputView({ name: id, model: model, className: 'form-control', id: guid }).render().$el
            ];
        }
    };

    return that;
});
