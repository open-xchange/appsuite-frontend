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

define('io.ox/backbone/disposable', [], function () {

    'use strict';

    if (ox.debug) console.warn('io.ox/backbone/disposable is deprecated. Please use io.ox/backbone/views/disposable.');

    //
    // Disposable view. Implements "dipose" for a rigorous clean up.
    //

    var DisposableView = Backbone.View.extend({

        // we use the constructor here not to collide with initialize()
        constructor: function () {
            // the original constructor will call initialize()
            Backbone.View.prototype.constructor.apply(this, arguments);
            // make all views accessible via DOM for debugging purposes; gets GC'ed on remove
            this.$el.data('view', this);
            // register for 'dispose' event
            // we're using an inline function just to make this testable via spyOn
            this.$el.on('dispose', function () { this.dispose(true); }.bind(this));
        },

        // dispose is responsible to clean up rigorously
        // "automatic" is true when called by the dispose event
        dispose: function (automatic) {
            // if not called by the dispose event, we have to clean up this.$el manually
            // stopListening doesn't take care of the DOM element
            if (!automatic) this.$el.off().removeData();
            // trigger event for sub-classes
            this.trigger('dispose');
            // now we remove all handlers maintained by the view;
            // we need both off() and stopListening()
            this.off().stopListening();
            // we don't have to call undelegateEvents() because that's covered
            // by removing the node from the DOM or by this.$el.off()
            // now remove all "local" references
            for (var id in this) {
                /* eslint no-prototype-builtins: "off" */
                if (this.hasOwnProperty(id)) this[id] = null;
            }
            // finally, mark as disposed
            this.disposed = true;
        }
    });

    // easy access to promote usage
    Backbone.DisposableView = DisposableView;

    return DisposableView;
});
