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

define('io.ox/backbone/mini-views/abstract', [], function () {

    'use strict';

    //
    // Abstract view. Takes care of dispose.
    //

    var AbstractView = Backbone.View.extend({

        initialize: function (options) {
            var o = this.options = options || {};
            // defaults
            if (o.validate === undefined) o.validate = true;
            // use id if id is given and no name
            if (o.id && !o.name) o.name = o.id;
            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
            // make all views accessible via DOM; gets garbage-collected on remove
            this.$el.data('view', this);
            // has model and a name?
            if (this.model && o.name) {
                this.name = o.name;
                this.listenTo(this.model, 'valid:' + o.name, this.valid);
                this.listenTo(this.model, 'invalid:' + o.name, this.invalid);
            }
            // call custom setup
            if (this.setup) this.setup(o);
        },

        valid: function () {
            this.$el.trigger('valid');
        },

        invalid: function (message, errors) {
            this.$el.trigger('invalid', [message, errors]);
        },

        dispose: function () {
            this.stopListening();
            this.model = null;
        }
    });

    return AbstractView;
});
