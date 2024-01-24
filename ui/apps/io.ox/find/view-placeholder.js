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

define('io.ox/find/view-placeholder', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core'
], function (DisposableView, gt) {

    'use strict';

    var PlaceholderView = DisposableView.extend({

        events: {
            'focusin': 'focused',
            'keyup': 'showSpinner'
        },

        initialize: function (options) {
            var win = options.app.getWindow();
            // field stub already rendered by desktop.js
            this.setElement(win.nodes.sidepanel.find('.io-ox-find'));

            // shortcuts
            this.ui = {
                field: this.$el.find('.search-field'),
                action: this.$el.find('.action-show')
            };

            // reuse
            this.options = options;

            this.listenTo(options.app, 'view:disable', this.disable);
            this.listenTo(options.app, 'view:enable', this.enable);
        },

        hideSpinner: function () {
            this.ui.action.idle();
        },

        showSpinner: function () {
            this.ui.action.busy({ immediate: true });
        },

        disable: function () {
            // only real change. We want to avoid screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === true) return;
            this.ui.field.prop('disabled', true);
            this.ui.action.prop('disabled', true);
            this.ui.field.find('input.token-input.tt-input').removeAttr('tabindex');
            this.$el.find('.arialive').text(gt('Search function not supported in this folder'));
        },

        enable: function () {
            // only real change. We want to avoid screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === false) return;
            this.ui.field.prop('disabled', false);
            this.ui.action.prop('disabled', false);
            this.ui.field.find('input.token-input.tt-input').attr('tabindex', 0);
            this.$el.find('.arialive').text('');
        },

        focused: function () {
            this.trigger('launch');
            this.destroy();
        },

        destroy: function () {
            if (this.disposed) return;
            this.hideSpinner();
            this.trigger('destroy');
            this.dispose();
        }
    });

    return PlaceholderView;
});
