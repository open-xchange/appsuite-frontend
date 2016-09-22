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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/categories/mediator', [
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/mail/categories/api',
    'io.ox/mail/categories/tabs',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (capabilities, ext, api, TabView, yell, settings, gt) {

    'use strict';

    // helpers
    var DEFAULT_CATEGORY = 'general',
        isVisible = false,
        helper = {
            isVisible: function () {
                return isVisible;
            },
            getInitialCategoryId: function () {
                return settings.get('categories/enabled') ? DEFAULT_CATEGORY : undefined;
            }
        };

    // early exit
    if (!capabilities.has('mail_categories')) return helper;
    if (_.device('smartphone')) return helper;


    // extend mediator
    ext.point('io.ox/mail/mediator').extend(
        {
            id: 'toggle-category-tabs',
            index: 20000,
            setup: function (app) {

                function isEnabled() {
                    return !!app.props.get('categories');
                }

                function isInbox() {
                    return app.folder.get() === settings.get('folder/inbox');
                }

                function isCategoryUnset() {
                    return !app.props.get('category_id');
                }

                function toggleCategories() {
                    isVisible = isEnabled() && isInbox();

                    // fallback
                    if (isVisible && isCategoryUnset()) app.props.set('category_id', DEFAULT_CATEGORY);

                    app.getWindow().nodes.outer.toggleClass('mail-categories-visible', isVisible);
                    app.listView.model.set('category_id', isVisible ? app.props.get('category_id') : undefined);
                }

                // we knowingly use settings here (small delay in contrast to app.props)
                // special case: mail middlware api ignores category_id param when categories
                // are disabled so we have to wait for the jslob call first
                // TODO: remove the debounce once kevin changed the api
                settings.on('change:categories/enabled', _.debounce(toggleCategories, 1000));
                app.on('folder:change', toggleCategories);

                toggleCategories();
            }
        },
        {
            id: 'foward-category-id',
            index: 20100,
            setup: function (app) {
                // forward current category id
                app.props.on('change:category_id', function (model, value) {
                    app.listView.model.set('category_id', value);
                });
            }
        },
        {
            id: 'category-tabs',
            index: 20200,
            setup: function (app) {

                function refresh() {
                    app.listView.collection.expired = true;
                    app.listView.load();
                }

                // add placeholder
                app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                    $('<div class="categories-toolbar-container">').append(
                        new TabView({ props: app.props }).render().$el
                    )
                );

                // events
                api.on('after:move after:train', refresh);
                api.collection.on('saved', refresh);

            }
        },
        {
            id: 'ensure-category-id',
            index: 20300,
            setup: function (app) {

                // current category gets disabled: use 'general' as fallback
                api.collection.on('change:active', function (model, active) {
                    if (active) return;
                    if (model.id !== app.props.get('category_id')) return;
                    app.props.set('category_id', DEFAULT_CATEGORY);
                });
            }
        },
        {
            id: 'check-category-state',
            index: 20400,
            setup: function (app) {
                if (!app.props.get('categories')) return;
                if (settings.get('categories/initialized') !== 'running') return;
                //#. mail categories feature: the update job is running that assigns
                //#. some common mails (e.g. from twitter.com) to predefined categories
                yell('info', gt('It may take some time until mails are assigned to the default categories.'));
            }
        }
    );

    return helper;

});
