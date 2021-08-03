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

define('io.ox/find/view-searchbox', [
    'io.ox/find/view-tokenfield'
], function (Tokenfield) {

    'use strict';

    var AutocompleteView = Backbone.View.extend({

        _height: {},

        initialize: function (props) {
            // app, win, model references
            _.extend(this, props);
            // field stub already rendered
            this.setElement(this.win.nodes.sidepanel.find('.search-box'));

            // shortcuts
            this.ui = {
                tokenfield: new Tokenfield(_.extend(props, { parent: this }))
            };

            // register
            this.register();
            return this;
        },

        render: function () {
            // render subview
            this.ui.tokenfield.render();
            // default height
            this._height.initial = this._height.current = this.$el.outerHeight();
            return this;
        },

        show: function () {
            this.setFocus();
        },

        hide: $.noop,

        reset: function () {
            this.ui.tokenfield.reset();
            this.ui.tokenfield.hiddenapi.dropdown.empty();
            this.ui.tokenfield.hiddenapi.dropdown.close();
        },

        // show input placeholder only on empty tokenfield
        _onResize: function () {
            var self = this;
            _.defer(function () {
                var current = _.max([self._height.initial, self.$el.height()]),
                    delta = current - self._height.current;
                if (!delta) return;
                self._height.current = current;
                self.trigger('resize', delta);
            });
        },

        register: function () {
            this.ui.tokenfield.on('tokenfield:createdtoken tokenfield:removedtoken', _.bind(this._onResize, this));
        },

        isEmpty: function () {
            return this.ui.tokenfield.isEmpty();
        },

        setFocus: function () {
            return this.ui.tokenfield.setFocus();
        }

    });

    return AutocompleteView;
});
