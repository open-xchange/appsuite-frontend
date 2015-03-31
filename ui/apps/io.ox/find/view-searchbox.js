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

        initialize: function (props) {
            // app, win, model references
            _.extend(this, props);
            // field stub already rendered
            this.setElement(this.win.nodes.sidepanel.find('.search-box'));

            // shortcuts
            this.ui = {
                tokenfield: new Tokenfield(_.extend(props, { parent: this }))
            };

            // set context for global event handler
            this.retrigger = _.bind(this.retrigger, this);
            return this;
        },

        render: function () {
            // render subview
            this.ui.tokenfield.render();
            // initate the rest
            this.parent.lazyload();
            // register additional handlers
            this.register();
            return this;
        },

        retrigger: function (e) {
            this.trigger(e.type, e);
        },

        // register additional handlers
        register: function () {
            // hide when last token was removed
            this.ui.tokenfield
                .getField()
                .on('tokenfield:removedtoken',
                    this.retrigger
                );
        },

        show: function () {
            this.setFocus();
        },

        hide: $.noop,

        reset: function () {
            this.ui.tokenfield.reset();
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
