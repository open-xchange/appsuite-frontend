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

define('io.ox/core/folder/tree', ['io.ox/core/folder/view'], function (FolderView) {

    'use strict';

    var FolderTreeView = Backbone.View.extend({

        className: 'folder-tree abs',

        initialize: function (options) {
            this.root = options.root;
            this.module = options.module;
            this.$el.attr('role', 'tree');
            this.$el.data('view', this);
            this.$el.css({ background: 'yellow', overflow: 'auto' });
        },

        filter: function (model) {
            return model.get('module') === this.module;
        },

        render: function () {
            this.$el.append(
                new FolderView({ id: this.root, headless: true, open: true, tree: this }).render().$el
            );
            return this;
        }
    });

    return FolderTreeView;
});
