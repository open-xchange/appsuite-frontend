/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/dropzone', [], function () {

    'use strict';

    var EVENTS = 'dragenter dragover dragleave drop';

    // Backbone Dropzone
    var InplaceDropzone = Backbone.View.extend({

        className: 'inplace-dropzone',

        events: {
            'drop': 'onDrop'
        },

        onLeave: function (e) {
            if (this.leaving) this.hide(e);
        },

        onDrag: function (e) {
            switch (e.type) {
            case 'dragenter':
            case 'dragover':
                this.stop(e);
                this.leaving = false;
                if (!this.visible) this.show(e);
                return false;
            case 'dragleave':
                this.leaving = true;
                clearTimeout(this.timeout);
                this.timeout = setTimeout(this.onLeave.bind(this), 100, e);
                break;
            case 'drop':
                this.stop(e);
                this.hide();
                this.onDrop(e);
                return false;
            }
        },

        onDrop: function () {
            this.trigger('drop');
        },

        stop: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        show: function () {
            this.visible = true;
            this.$el.show();
            this.trigger('show');
        },

        hide: function () {
            this.visible = false;
            this.$el.hide();
            this.trigger('hide');
        },

        initialize: function (options) {
            this.options = options;
            this.visible = false;
            this.leaving = false;
            this.timeout = -1;
            $(document).on(EVENTS, $.proxy(this.onDrag, this));
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
        },

        render: function () {
            if (this.options.text) {
                this.$el.append(
                    $('<caption>').text(this.options.text)
                );
            }
            this.$el.hide();
            return this;
        },

        dispose: function () {
            this.stopListening();
            $(document).off(EVENTS, this.onDrag);
        }
    });

    return {
        Inplace: InplaceDropzone
    };
});
