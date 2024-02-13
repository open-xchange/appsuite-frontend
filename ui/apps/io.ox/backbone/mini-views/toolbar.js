/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/backbone/mini-views/toolbar', ['io.ox/backbone/views/disposable', 'io.ox/core/a11y', 'gettext!io.ox/core'], function (DisposableView, a11y, gt) {

    'use strict';

    var Toolbar = DisposableView.extend({

        className: 'classic-toolbar-container',

        events: {
            'mousedown ul.classic-toolbar > li > a': 'onMousedown'
        },

        initialize: function (opt) {
            this.options = _.extend({ tabindex: 0 }, opt);
            this.$list = this.createToolbar();
        },

        createToolbar: function () {
            var node = $('<ul class="classic-toolbar" role="toolbar">')
                //#. screenreader label for main toolbar
                .attr({ 'aria-label': this.options.title ? gt('%1$s toolbar. Use cursor keys to navigate.', this.options.title) : gt('Actions. Use cursor keys to navigate.') });
            return node
                // always avoid clearing the URL hash
                .on('click', 'a', $.preventDefault);
        },

        render: function () {
            this.$el.append(this.$list);
            return this;
        },

        getButtons: function () {
            return this.$el.find('ul.classic-toolbar > li > a').not(':hidden');
        },

        disableButtons: function () {
            // remove all event handlers
            this.getButtons().off().tooltip('hide').tooltip('disable');
            return this;
        },

        replaceToolbar: function (toolbar) {
            // identify focused element and try to focus the same element later
            var focus = $.contains(this.el, document.activeElement), selector;
            if (focus) {
                var activeElement = $(document.activeElement),
                    action = activeElement.data('action');
                if (action) selector = '*[data-action="' + action + '"]';
                // try to select the element at the same position as before
                else selector = '>> li:eq(' + activeElement.closest('li').index() + ') ' + activeElement.prop('tagName') + ':first';
            }
            // A11y: This is needed to maintain source order, otherwise the focus order is not correct
            // TODO: Extensionpoints should be rendered in source order so this is unnecessary
            toolbar.append(toolbar.children('.pull-right'));
            this.$el.find('ul.classic-toolbar').tooltip('hide').replaceWith(toolbar);
            if (selector) this.$(selector).focus();
            return this;
        },

        initButtons: function () {
            this.$links = this.getButtons().attr({ role: 'button', tabindex: -1 });
            // set focus to first element
            this.$links.first().attr({
                tabindex: this.options.tabindex
            });
        },

        onMousedown: function (e) {
            this.$links.attr('tabindex', -1);
            $(e.currentTarget).attr('tabindex', this.options.tabindex);
        }
    });

    return Toolbar;
});
