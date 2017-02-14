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

define('io.ox/onboarding/clients/view-mobile', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/onboarding/clients/config',
    'io.ox/onboarding/clients/api',
    'io.ox/core/a11y',
    'gettext!io.ox/core/onboarding'
], function (ext, ModalDialog, config, api, a11y, gt) {

    'use strict';

    var POINT = 'io.ox/onboarding/clients/views/mobile';

    var stores = (function () {
        var prefix = ox.language.slice(0, 2).toUpperCase(),
            country = _.contains(['EN', 'DE', 'ES', 'FR'], prefix) ? prefix : 'EN';
        return {
            'macappstore': {
                label: gt('Mac App Store'),
                url: 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_' + country + '_165x40.svg'
            },
            'appstore': {
                label: gt('App Store'),
                url: 'apps/themes/icons/default/appstore/App_Store_Badge_' + country + '_135x40.svg'
            },
            'playstore': {
                label: gt('Google Play'),
                url: 'apps/themes/icons/default/googleplay/google-play-badge_' + country + '.svg'
            }
        };
    })();

    var extensions = {

        scenario: function (scenario, index, list) {
            return [
                // scenario
                $('<article class="scenario">').attr('data-id', scenario.id).append(
                    $('<h2 class="title">').text(scenario.name || ''),
                    $('<p class="description">').text(scenario.description),
                    $('<div class="actions">').append(_.map(scenario.actions, extensions.action))
                ),
                // divider
                index !== list.length - 1 ? $('<hr class="divider">') : $()
            ];
        },

        action: function (action, index) {
            var node = $('<section class="action">').prop('id', action.id).attr({ 'data-index': index }),
                type = action.id.split('/')[0];
            ext.point(POINT + '/' + type).invoke('draw', node, action);
            return node;
        },

        // DISPLAY: IMAP, SMTP and EAS

        titleDisplay: function () {
            this.append($('<h3 class="title">').text(
                gt('Settings for advanced users')
            ));
        },

        descriptionDisplay: function () {
            this.append($('<p class="description">').text(
                gt('Setup your account manually!')
            ));
        },

        block: function (action) {
            var list = _(Object.keys(action.data)).sortBy(function (key) {
                return config.order[key] || 1000;
            });
            this.append($('<pre class="config">').append(
                    $('<div>').append(_.map(list, function (key) {
                        return $('<div class="property">').text((config.labels[key] || key) + ':');
                    })),
                    $('<div>').append(_.map(list, function (key) {
                        return $('<div class="value">').text(action.data[key]);
                    }))
                )
            );
        },

        toggle: function () {
            // make content toggleable when 'display' isn't the primary action of a scenario
            if (this.attr('data-index') === '0') return;

            var action =  $('<a href="#" role="button" class="inline-link">'),
                container = $('<div>').append(this.find('.config'));

            a11y.collapse(action, container, { onChange: setLabel });
            function setLabel(state) {
                //#. button: show collapsed content
                if (/(show)/.test(state)) return action.text(gt('Hide technical details'));
                //#. button: hide collapsable content
                if (/(hide)/.test(state)) return action.text(gt('Show technical details'));
            }
            this.empty().append(action, container);
        },

        // DOWNLOAD: Profile

        titleDownload: function () {
            this.append($('<h3 class="title">').text(
                gt('Automatic Configuration')
            ));
        },

        descriptionDownload: function () {
            this.append(
                $('<p class="description">').text(
                    gt('Let´s automatically configure your device, by clicking the button below. It´s that simple!')
                )
            );
        },

        buttonDownload: function (action) {
            var ref = _.uniqueId('description-');
            this.append($('<button class="btn btn-primary action-call">')
                .attr('aria-describedby', ref)
                .text(gt('Install'))
                .on('click', function (e) {
                    e.preventDefault();
                    var url = api.getUrl(action.scenario, action.id, config.getDevice().id);
                    require(['io.ox/core/download'], function (download) {
                        download.url(url);
                    });
                })
            );
        },

        // LINK: App in a Store

        descriptionLink: function (action) {
            var data = stores[action.type];
            this.append($('<p class="description">').text(
                data ? gt('Get the App from %1$s', data.label) : gt('Download the application.')
            ));
        },

        badge: function (action) {
            var data = stores[action.type];
            this.append($('<a class="store" target="_blank">').attr('href', action.link).append(
                $('<img class="store-icon action-call" role="button">').attr({
                    'data-detail': data.label,
                    'src': data.url
                })
            ));
        }
    };

    // supported
    ext.point(POINT + '/display').extend(
        { id: 'title', draw: extensions.titleDisplay },
        { id: 'description', draw: extensions.descriptionDisplay },
        { id: 'block', draw: extensions.block },
        { id: 'toggle', draw: extensions.toggle }
    );
    ext.point(POINT + '/download').extend(
        { id: 'title', draw: extensions.titleDownload },
        { id: 'description', draw: extensions.descriptionDownload },
        { id: 'button', draw: extensions.buttonDownload }
    );
    ext.point(POINT + '/link').extend(
        { id: 'description', draw: extensions.descriptionLink },
        { id: 'badge', draw: extensions.badge }
    );

    // unsupported
    ext.point(POINT + '/email').extend({ draw: $.noop });
    ext.point(POINT + '/sms').extend({ draw: $.noop });

    return {

        extensions: extensions,

        get: function () {
            return new ModalDialog({
                title: gt('Connect your device'),
                point: 'io.ox/onboarding/clients/views/mobile',
                maximize: false
            })
            .extend({
                'layout': function () {
                    this.$el.addClass('client-onboarding-mobile');
                },
                'action-close': function () {
                    this.$el.find('.modal-header').append(
                        $('<a href="#" class="modal-action close" data-action="cancel" role="button">')
                            .attr('aria-label', gt('Close'))
                            .append(
                                $('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Close'))
                            )
                            .on('click', this.close)
                    );
                },
                'content': function () {
                    var scenarios = _.map(config.getScenarios(), function (scenario) {
                        return _.extend(scenario, { actions: config.getActions(scenario.id) });
                    });
                    // mapping function returns array of nodes
                    this.$body.append(_(scenarios).chain().map(extensions.scenario).flatten().value());
                }
            });
        }
    };

});
