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
            this.ellipsisCount = 4;
            this.ownWidth = 0;

            // last item is a normal item (not a unclickable tail node)
            this.notail = options.notail;

            if (options.app) {

                var self = this;
                this.app = options.app;
                this.handler = function (id) { this.app.folder.set(id); };
                this.folder = this.app.folder.get();
                this.find = this.app.get('find');
                this.listenTo(this.app, 'folder:change', this.onChangeFolder);

                if (this.find && this.find.isActive()) {
                    // use item's folder id
                    this.folder = options.folder;
                    this.notail = true;
                    this.handler = function (id) {
                        var folder = this.app.folder;
                        folder.unset();
                        folder.set(id);
                    };
                }

                // do not use listen to here, does not work with dom events, see http://stackoverflow.com/questions/14460855/
                $(window).on('resize', this.computeWidth.bind(self));

                this.on('dispose', function () {
                    $(window).off('resize', this.computeWidth);
                });
            }
        },

        onChangeFolder: function (id) {
            this.folder = id;
            this.render();
            this.ownWidth = 0;
            this.computeWidth();
        },

        render: function () {
            if (this.folder === undefined) return this;
            this.$el.text('\xa0');
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

            // listen to any changes on the path
            this.stopListening(api);
            _(path).each(this.listenToFolderChange, this);

            this.$el.empty().append(
                // label
                this.label ? $('<span class="breadcrumb-label">').text(this.label) : [],
                // path
                _(path).map(this.renderLink, this)
            );
        },

        computeWidth: _.throttle( function () {

            if (this.disposed || !this.$el.is(':visible')) return;

            var ownWidth = this.ownWidth || this.el.scrollWidth,
                parentWidth = this.$el.parent().width(),
                siblingsWidth = _(this.$el.siblings()).reduce(function (sum, node) {
                    return sum + $(node).outerWidth(true);
                }, 0),
                maxWidth = parentWidth - siblingsWidth;

            // we store this once (per folder)
            this.ownWidth = ownWidth;

            if (ownWidth > maxWidth) {
                if (this.ellipsisCount === 4) {
                    this.ellipsisCount = 2;
                    this.render();
                }
            } else {
                if (this.ellipsisCount === 2) {
                    this.ellipsisCount = 4;
                    this.render();
                }
            }

            this.$el.css('max-width', maxWidth);

        }, 100),

        renderLink: function (data, index, all) {

            var length = all.length,
                isLast = index === length - 1,
                node;

            // add ellipsis for more than four items
            if (length > this.ellipsisCount && index > 0 && index < length - (this.ellipsisCount - 1)) {
                return index === 1 ?
                    $('<span class="breadcrumb-ellipsis" aria-hidden="true">&hellip;</span><i class="fa breadcrumb-divider" aria-hidden="true"></span>') :
                    $();
            }

            // add plain text tail or clickable link
            if (isLast && !this.notail) node = $('<span class="breadcrumb-tail">');
            else if (!this.handler) node = $('<span class="breadcrumb-item">');
            else node = $('<a href="#" role="button" class="breadcrumb-link" tabindex="1">').attr('href', api.getDeepLink(data));

            node.attr('data-id', data.id).text(
                isLast ? data.title : _.ellipsis(data.title, { max: 20 })
            );

            if (!isLast) node = node.add($('<i class="fa breadcrumb-divider" aria-hidden="true">'));

            return node;
        },

        onClickLink: function (e) {
            e.preventDefault();
            var id = $(e.target).attr('data-id');
            if (this.handler) this.handler(id);
        },

        onFolderChange: function () {
            this.render();
        },

        listenToFolderChange: function (data) {
            this.listenTo(api, 'update:' + data.id, this.onFolderChange.bind(this));
        }
    });

    return BreadcrumbView;
});
