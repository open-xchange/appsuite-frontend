/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/disposable', [], function () {

    'use strict';

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
