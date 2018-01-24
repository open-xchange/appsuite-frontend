/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
            this.setElement(this.parent.$el.find('.search-box'));

            // shortcuts
            this.ui = {
                tokenfield: new Tokenfield(_.extend(props, { parent: this }))
            };

            // register
            return this;
        },

        render: function () {
            // render subview
            this.ui.tokenfield.render();
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

        isEmpty: function () {
            return this.ui.tokenfield.isEmpty();
        },

        setFocus: function () {
            return this.ui.tokenfield.setFocus();
        }

    });

    return AutocompleteView;
});
