/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/views/toolbarview', function () {

    'use strict';

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */
    var ToolbarView = Backbone.View.extend({

        className: 'io-ox-viewer-toolbar',

        initialize: function () {
            //console.warn('ToolbarView.initialize()');
        },

        render: function () {
            //console.warn('ToolbarView.render()');
            return this;
        }

    });

    return ToolbarView;

});
