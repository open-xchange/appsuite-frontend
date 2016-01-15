/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/extensible', ['io.ox/backbone/disposable', 'io.ox/core/extensions'], function (DisposableView, ext) {

    'use strict';

    //
    // Extensible view.
    //

    var ExtensibleView = DisposableView.extend({

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // add central extension point
            this.options = options || {};
            this.point = ext.point(this.options.point);
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            // simplify debugging
            this.$el.attr('data-point', this.options.point);
        },

        // convenience function to add multiple extensions
        extend: function (extensions) {
            var index = 100;
            _(extensions).each(function (fn, id) {
                this.point.extend({ id: id, index: index, draw: fn });
                index += 100;
            }, this);
            return this;
        },

        invoke: function (type, $el) {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.point.invoke(type || 'draw', $el || this.$el, baton);
            return this;
        },

        render: function () {
            return this.invoke('draw');
        }
    });

    return ExtensibleView;
});
