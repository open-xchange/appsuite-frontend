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

define('io.ox/core/folder/breadcrumb', ['io.ox/core/folder/api'], function (api) {

    'use strict';

    var BreadcrumbView = Backbone.DisposableView.extend({

        className: 'breadcrumb-view',

        events: {
            'click .breadcrumb-link': 'onClickLink'
        },

        initialize: function (options) {

            this.folder = options.folder;
            this.label = options.label;
            this.exclude = options.exclude;

            if (options.app) {
                this.app = options.app;
                this.handler = function (id) { this.app.folder.set(id); };
                this.folder = this.app.folder.get();
                this.listenTo(this.app, 'folder:change', this.onChangeFolder);
            }
        },

        onChangeFolder: function (id) {
            this.folder = id;
            this.render();
        },

        render: function () {
            if (this.folder === undefined) return this;
            api.path(this.folder).done(this.renderPath.bind(this));
            return this;
        },

        renderPath: function (path) {

            if (this.disposed) return;

            // apply exclude option
            if (this.exclude) {
                var exclude = _(this.exclude);
                path = _(path).filter(function (data) { return !exclude.contains(data.id); });
            }

            this.$el.empty().append(
                // label
                this.label ? $('<span class="breadcrumb-label">').text(this.label) : [],
                // path
                _(path).map(this.renderLink, this)
            );
        },

        renderLink: function (data, index, all) {

            var length = all.length,
                isLast = index === length - 1,
                node;

            // add ellipsis for more than four items
            if (length > 4 && index > 0 && index < length - 3) {
                return index === 1 ?
                    $('<span class="breadcrumb-ellipsis" aria-hidden="true">&hellip;</span><i class="fa breadcrumb-divider" aria-hidden="true"></span>') :
                    $();
            }

            // add plain text tail or clickable link
            if (isLast) node = $('<span class="breadcrumb-tail">');
            else if (!this.handler) node = $('<span class="breadcrumb-item">');
            else node = $('<a href="#" role="button" class="breadcrumb-link" tabindex="1">');

            node.attr('data-id', data.id).text(
                _.ellipsis(data.title, { max: isLast ? 40 : 20 })
            );

            if (!isLast) node = node.add($('<i class="fa breadcrumb-divider" aria-hidden="true">'));

            return node;
        },

        onClickLink: function (e) {
            e.preventDefault();
            var id = $(e.target).attr('data-id');
            if (this.handler) this.handler(id);
        }
    });

    return BreadcrumbView;
});
