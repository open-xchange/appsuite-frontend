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
define('io.ox/core/viewer/views/toolbarview', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */
    var ToolbarView = Backbone.View.extend({

        className: 'viewer-toolbar',

        events: {
            'click': 'onClose'
        },

        initialize: function (options) {
            //console.info('ToolbarView.initialize()', options);
            this.parent = options.parent;
            this.render();
        },

        onClose: function () {
            //console.info('ToolbarView.onClose()');
            this.parent.remove();
        },

        render: function () {
            //console.info('ToolbarView.render()');
            var toolbar = this.$el,
                closeViewerButton = $('<button type="button" class="btn btn-link close-viewer">');
            closeViewerButton.append(
                $('<i class="fa fa-times" aria-hidden="true" >'),
                $('<span class="sr-only">').text(gt('Close'))
            );
            toolbar.append(closeViewerButton);
            this.parent.$el.append(toolbar);
            return this;
        }

    });

    return ToolbarView;

});
