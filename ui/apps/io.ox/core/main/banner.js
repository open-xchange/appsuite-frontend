define('io.ox/core/main/banner', [
    'io.ox/core/extensions',
    'io.ox/core/api/user',
    'io.ox/core/main/logout',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (ext, userAPI, logout, gt, settings) {

    ext.point('io.ox/core/banner').extend({
        id: 'default',
        draw: function () {

            var sc = ox.serverConfig,
                userOption = settings.get('banner/visible', false),
                globalOption = !!sc.banner;

            if (userOption === false || _.device('!desktop')) return;
            if (globalOption === false && userOption !== true) return;

            var banner = $('#io-ox-core').addClass('show-banner');

            // set title
            banner.find('.banner-title').append(
                sc.bannerCompany !== false ? $('<b>').text((sc.bannerCompany || 'OX') + ' ') : $(),
                $.txt(sc.bannerProductName || 'App Suite')
            );

            var content = banner.find('.banner-content');

            // show current user
            content.append(
                $('<label>').text(gt('Signed in as:')),
                $.txt(' '), userAPI.getTextNode(ox.user_id, { target: 'identifier' })
            );

            content.append(
                $('<a href="#" class="banner-action" data-action="logout" role="button">')
                .attr('title', gt('Sign out'))
                .append('<i class="fa fa-sign-out" aria-hidden="true">')
                .on('click', function (e) {
                    e.preventDefault();
                    logout();
                })
            );

            // prevent logout action within top-bar drop-down
            ext.point('io.ox/core/topbar/right/dropdown').disable('logout');

            // prevent logo
            ext.point('io.ox/core/topbar/right').disable('logo');
        }
    });

    ext.point('io.ox/core/banner').extend({
        id: 'metrics',
        draw: function () {
            require(['io.ox/metrics/main'], function (metrics) {
                metrics.watch({
                    node: $('#io-ox-banner'),
                    selector: '.banner-title',
                    type: 'click'
                }, {
                    app: 'core',
                    target: 'banner/title',
                    type: 'click',
                    action: 'noop'
                });
                metrics.watch({
                    node: $('#io-ox-banner'),
                    selector: '.banner-logo',
                    type: 'click'
                }, {
                    app: 'core',
                    target: 'banner/logo',
                    type: 'click',
                    action: 'noop'
                });

                $(document.documentElement).on('mousedown', '.halo-link', function () {
                    var app = ox.ui.App.getCurrentApp() || new Backbone.Model({ name: 'unknown' });
                    metrics.trackEvent({
                        app: 'core',
                        type: 'click',
                        action: 'halo',
                        detail: _.last(app.get('name').split('/'))
                    });
                });
            });
        }
    });
});
