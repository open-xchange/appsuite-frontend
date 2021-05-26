/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/backbone/views/action-dropdown', [
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/views/actions/util'
], function (DisposableView, util) {

    'use strict';

    //
    // Action dropdown
    //
    // options:
    // - caret (bool; default true): show caret
    // - point (string): extension point id to render items
    // - title (string): dropdown title
    // - simple (bool; default false): defines whether simple collection checks should be used, i.e. no folder-specific stuff
    // - backdrop (bool: default false): use backdrop to capture clicks
    // - checkmarkFn (function): when provided, a checkmark design is used for the entry - the callback return value determins the state

    var ActionDropdownView = DisposableView.extend({

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // add central extension point
            this.options = _.extend({ caret: true, point: this.point, title: '', simple: false, backdrop: false }, options);
            if (!this.options.point) console.error('Missing extension point definition');
            DisposableView.prototype.constructor.apply(this, arguments);
            util.renderDropdown(this.$el, null, this.options);
            this.$toggle = this.$('.dropdown-toggle');
            this.$menu = this.$('.dropdown-menu');
            if (this.options.data) this.setData(this.options.data);
            if (_.device('!smartphone')) {
                if (this.options.backdrop) {
                    util.addBackdrop(this.$el);
                } else {
                    // listen for click event directly on menu for proper backdrop support
                    util.bindActionEvent(this.$menu);
                }
            }
        },

        render: function (baton) {
            this.$menu.addClass('invisible');
            util.renderDropdownItems(this.$el, baton, this.options).done(this.finalizeRender.bind(this));
            this.trigger('rendered');
            return this;
        },

        finalizeRender: function () {
            if (this.disposed) return;
            this.$menu.removeClass('invisible');
            this.trigger('ready');
        },

        hasActions: function () {
            return util.hasActions(this.$el);
        },

        updatePoint: function (newPoint) {
            if (!newPoint) return;
            this.options.point = newPoint;
        },

        // selection is expected to be array of object
        // - object must provide id and folder_id
        // - object_permissions if available
        setSelection: util.setSelection,

        setData: util.setData
    });

    return ActionDropdownView;
});
