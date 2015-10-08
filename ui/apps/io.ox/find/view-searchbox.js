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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
