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

define('io.ox/backbone/views/extensible', ['io.ox/backbone/views/disposable', 'io.ox/core/extensions'], function (DisposableView, ext) {

    'use strict';

    // hash to "close" a view
    var closed = {};

    //
    // Extensible view.
    //

    var ExtensibleView = DisposableView.extend({

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // add central extension point
            this.options = options || {};
            this.point = ext.point(this.point || this.options.point);
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            this.busy = busy.bind(this);
            this.idle = idle.bind(this);
            // simplify debugging
            this.$el.attr('data-point', this.options.point);
            // run over static extensions
            if (this.extensions) this.extend(this.extensions);
        },

        // convenience function to add multiple extensions
        // needs some logic to avoid redefinitions
        extend: function (extensions) {
            // check if the point has been closed
            if (closed[this.point.id]) return this;
            // show warning if using extend with empty point.id
            // if you do that in modal dialogs it will bind to almost every modal dialog
            // be sure this is what you want
            if (ox.debug && !this.point.id) {
                console.warn('Using extend on extensible view without point.id. Be sure this is what you want. Function will be called in every extensible view without point.id (most modal dialogs for example)');
            }
            var index = 100;
            _(extensions).each(function (fn, id) {
                this.point.extend({ id: id, index: index, render: fn });
                index += 100;
            }, this);
            return this;
        },

        invoke: function (type) {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.point.invoke(type || 'render', this, baton);
            // close for further calls of extend
            closed[this.point.id] = true;
            return this;
        },

        // inject function to dialog instance
        inject: function (functions) {
            return _.extend(this, functions);
        },

        build: function (fn) {
            fn.call(this);
            return this;
        },

        render: function () {
            return this.invoke('render');
        },

        disableFormElements: function () {
            // disable all form elements; mark already disabled elements via CSS class
            this.$(':input').each(function () {
                if ($(this).attr('data-action') === 'cancel') return;
                $(this).toggleClass('disabled', $(this).prop('disabled')).prop('disabled', true);
            });
        },

        enableFormElements: function () {
            // enable all form elements
            this.$(':input').each(function () {
                $(this).prop('disabled', $(this).hasClass('disabled')).removeClass('disabled');
            });
        }
    });

    function busy() {
        this.disableFormElements();
        this.activeElement = this.activeElement || document.activeElement;
        this.$el.css('opacity', 0.50);
        return this;
    }

    function idle() {
        this.enableFormElements();
        this.$el.css('opacity', '');
        if ($.contains(this.el, this.activeElement)) $(this.activeElement).focus();
        this.activeElement = null;
        return this;
    }

    return ExtensibleView;
});
