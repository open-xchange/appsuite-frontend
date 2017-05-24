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
            this.disable = options.disable;
            this.rootAlwaysVisible = options.rootAlwaysVisible;
            // render folder as link although the user has only a read right
            this.linkReadOnly = options.linkReadOnly;
            // this is always the first path element of the breadcrumb
            this.defaultRootPath = options.defaultRootPath;

            // last item is a normal item (not a unclickable tail node)
            this.notail = options.notail;

            if (options.app) {

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
                $(window).on('resize', $.proxy(this.computeWidth, this));

                this.on('dispose', function () {
                    $(window).off('resize', this.computeWidth);
                });
            }
        },

        onChangeFolder: function (id) {
            this.folder = id;
            this.render();
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

            if (this.defaultRootPath && this.defaultRootPath.id !== _.first(path).id) {
                path.unshift(this.defaultRootPath);
            }

            // listen to any changes on the path
            this.stopListening(api);
            _(path).each(this.listenToFolderChange, this);

            if (this.rootAlwaysVisible) {
                this.$el.empty().append(

                    this.renderLink(_.first(path), 0, path),
                    // ellipsis
                    $('<span class="breadcrumb-ellipsis" aria-hidden="true">&hellip;</span>').hide(),
                    // label
                    this.label ? $('<span class="breadcrumb-label">').text(this.label) : [],
                    // path
                    _(_.rest(path)).map(this.renderLink, this)
                );
            } else {
                this.$el.empty().append(
                    // ellipsis
                    $('<span class="breadcrumb-ellipsis" aria-hidden="true">&hellip;</span>').hide(),
                    // label
                    this.label ? $('<span class="breadcrumb-label">').text(this.label) : [],
                    // path
                    _(path).map(this.renderLink, this)
                );
            }

            if (this.app) this.computeWidth();
        },

        computeWidth: _.throttle(function () {

            if (this.disposed || !this.$el.is(':visible')) return;

            var parentWidth = this.$el.parent().width(),
                siblingsWidth = _(this.$el.siblings(':visible')).reduce(function (sum, node) {
                    return sum + $(node).outerWidth(true);
                }, 0),
                maxWidth = Math.max(0, parentWidth - siblingsWidth - 96),
                childrenWidth = 0;

            this.$el.addClass('invisible').children().show();

            if (this.rootAlwaysVisible) {
                this.$el.children().toArray().slice(0, 1).reverse().forEach(function (node) {
                    childrenWidth += $(node).outerWidth(true);
                });
            }

            this.$el.children().toArray().slice(this.rootAlwaysVisible ? 2 : 1).reverse().forEach(function (node, index) {
                childrenWidth += $(node).outerWidth(true);
                $(node).toggle(index === 0 || childrenWidth < maxWidth);
            });

            this.$el.children('.breadcrumb-ellipsis').toggle(childrenWidth > maxWidth);

            this.$el.css('max-width', maxWidth + 32).removeClass('invisible');

        }, 100),

        renderLink: function (data, index, all) {
            var length = all.length,
                isLast = index === length - 1,
                missingPrivileges = !api.can('read', data) && (!this.linkReadOnly || data.own_rights !== 1),
                isDisabled = missingPrivileges || (this.disable && _(this.disable).indexOf(data.id) > -1),
                node;

            if (index === 0 && this.defaultRootPath && this.defaultRootPath.id !== data.id) {
                this.renderLink(this.defaultRootPath, 0, all);
            }

            // add plain text tail or clickable link
            if (isLast && !this.notail) node = $('<span class="breadcrumb-tail">');
            else if (!this.handler || isDisabled) node = $('<span class="breadcrumb-item">');
            else node = $('<a href="#" role="button" class="breadcrumb-link">').attr('href', api.getDeepLink(data));

            node.attr({ 'data-id': data.id, 'data-module': data.module }).text(
                isLast ? data.title : _.ellipsis(data.title, { max: 20 })
            );

            if (!isLast) node = node.add($('<i class="fa breadcrumb-divider" aria-hidden="true">'));

            return node;
        },

        onClickLink: function (e) {
            e.preventDefault();
            var id = $(e.target).attr('data-id'),
                module = $(e.target).attr('data-module');
            if (this.handler) this.handler(id, module);
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
