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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/core/feedback/register', [
    'io.ox/backbone/views/modal',
    'io.ox/core/api/apps',
    'gettext!io.ox/core',
    'io.ox/core/yell',
    'io.ox/backbone/views/disposable',
    'settings!io.ox/core',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'less!plugins/core/feedback/style'
], function (ModalDialog, appApi, gt, yell, DisposableView, settings, api, ext, http) {

    'use strict';

    var captions = {
            //#. 1 of 5 star rating
            1: gt.pgettext('rating', 'It\'s really bad'),
            //#. 2 of 5 star rating
            2: gt.pgettext('rating', 'I don\'t like it'),
            //#. 3 of 5 star rating
            3: gt.pgettext('rating', 'It\'s ok'),
            //#. 4 of 5 star rating
            4: gt.pgettext('rating', 'I like it'),
            //#. 5 of 5 star rating
            5: gt.pgettext('rating', 'It\'s awesome')
        },
        appWhiteList = [
            'io.ox/mail',
            'io.ox/contacts',
            'io.ox/calendar',
            'io.ox/files'
        ];

    function getAppOptions(useWhitelist) {
        var currentApp = ox.ui.App.getCurrentApp(),
            apps = appApi.forLauncher().map(function (app) {
                if (useWhitelist && !_(appWhiteList).contains(app.id)) return;
                return $('<option>').val(app.id).text(app.get('title'));
            });
        apps = _(apps).compact();
        return { currentApp: currentApp, apps: apps };
    }

    var StarRatingView = DisposableView.extend({

        className: 'star-rating rating-view',
        name: 'simple-star-rating-v1',

        events: {
            'change input': 'onChange',
            'mouseenter label': 'onHover',
            'mouseleave label': 'onHover'
        },

        initialize: function (options) {
            this.options = _.extend({ hover: true }, options);
            this.value = 0;
            this.$el.attr('tabindex', -1);
        },

        render: function () {

            this.$el.append(
                _.range(1, 6).map(function (i) {
                    return $('<label>').append(
                        $('<input type="radio" name="star-rating" class="sr-only">').val(i)
                            .attr('title', gt('%1$d of 5 stars', i) + '. ' + captions[i]),
                        $('<i class="fa fa-star star" aria-hidden="true">')
                    );
                }),
                $('<caption aria-hidden="true">').text('\u00a0').addClass(_.browser.IE ? 'IE11' : '')
            );

            return this;
        },

        renderRating: function (value) {
            this.$('.star').each(function (index) {
                $(this).toggleClass('checked', index < value);
            });

            this.$('caption').text(captions[value] || '\u00a0');
        },

        getValue: function () {
            return this.value;
        },

        setValue: function (value) {
            if (value < 1 || value > 5) return;
            this.value = value;
            this.renderRating(value);
        },

        onChange: function () {
            var value = this.$('input:checked').val() || 1;
            this.setValue(value);
        },

        onHover: function (e) {
            if (!this.options.hover) return;
            var value = e.type === 'mouseenter' ? $(e.currentTarget).find('input').val() : this.value;
            this.renderRating(value);
        }
    });

    var ModuleRatingView = StarRatingView.extend({
        name: 'star-rating-v1',
        render: function (popupBody) {

            var apps = getAppOptions(true);

            if (settings.get('feedback/showModuleSelect', true)) {
                var preSelect = apps.apps.filter(function (app) {
                    return app.val() === apps.currentApp.id;
                });
                //#. used in feedback dialog for general feedback. Would be "Allgemein" in German for example
                apps.apps.unshift($('<option>').val('general').text(gt('General')));
                popupBody.append(
                    this.appSelect = $('<select class="feedback-select-box form-control">').append(apps.apps)
                );
                this.appSelect.val(preSelect.length > 0 && preSelect[0].val() || apps.apps[0].val());
            } else if (apps.currentApp) {
                popupBody.append(
                    $('<div class="form-control">').text(apps.currentApp.get('title')),
                    this.appSelect = $('<div aria-hidden="true">').val(apps.currentApp.get('name')).hide()
                );
            } else {
                popupBody.append(
                    //#. used in feedback dialog for general feedback. Would be "Allgemein" in German for example
                    $('<div class="form-control">').text(gt('General')),
                    this.appSelect = $('<div aria-hidden="true">').val('general').hide()
                );
            }

            ModuleRatingView.__super__.render.call(this);
            return this;
        }
    });

    var NpsRatingView = StarRatingView.extend({

        className: 'nps-rating rating-view',
        name: 'nps-rating-v1',

        render: function () {

            this.$el.append(
                $('<caption>').text(gt('Not likely at all')),
                $('<div>').append(
                    _.range(0, 11).map(function (i) {
                        return $('<label>').append(
                            $('<input type="radio" name="nps-rating" class="sr-only">').val(i)
                                .attr('title', gt('%1$d of 10 points.', i)),
                            $('<i class="fa fa-circle score" aria-hidden="true">'),
                            (i % 5 === 0 ? $('<div class="score-number" aria-hidden="true">').text(i) : '')
                        );
                    })
                ),
                $('<caption>').text(gt('Extremely likely'))
            );

            return this;
        },

        renderRating: function (value) {
            this.$('.score').each(function (index) {
                $(this).toggleClass('checked', index <= value);
            });
        },

        setValue: function (value) {
            if (value < 0 || value > 11) return;
            this.value = value;
            this.renderRating(value);
        }
    });

    var feedbackService;

    ext.point('plugins/core/feedback').extend({
        id: 'api',
        index: 100,
        initialize: function () {
            feedbackService = {
                sendFeedback: function (data) {
                    if (!data) return $.when();

                    return http.PUT({
                        module: 'userfeedback',
                        params: {
                            action: 'store',
                            //type is always star-rating-v1 for now (all UI implementations still work)
                            type: settings.get('feedback/mode', 'star-rating-v1')
                        },
                        data: data
                    });
                }
            };
        }
    });

    var modes = {
            nps: {
                ratingView: NpsRatingView,
                //#. %1$s is the product name, for example 'OX App Suite'
                title: gt('How likely is it that you would recommend %1$s to a friend?', ox.serverConfig.productName)
            },
            stars: {
                ratingView: StarRatingView,
                title: gt('Please rate this product')
            },
            modules: {
                ratingView: ModuleRatingView,
                title: gt('Please rate the following application:')
            }
        },
        dialogMode = settings.get('feedback/dialog', 'modules');

    // make sure dialogMode is valid
    if (_(_(modes).keys()).indexOf(dialogMode) === -1) {
        dialogMode = 'modules';
    }

    function sendFeedback(data) {
        return feedbackService ? feedbackService.sendFeedback(data) : $.when();
    }

    var feedback = {

        show: function () {
            var options = {
                async: true,
                enter: 'send',
                point: 'plugins/core/feedback',
                title: gt('Your feedback'),
                class: dialogMode + '-feedback-view'
            };

            // nps view needs more space
            if (dialogMode === 'nps') {
                options.width = 600;
            }
            new ModalDialog(options)
                .extend({
                    title: function () {
                        this.$body.append(
                            $('<div class="feedback-welcome-text">').text(modes[dialogMode].title)
                        );
                    },
                    ratingView: function () {
                        this.ratingView = new modes[dialogMode].ratingView({ hover: settings.get('feedback/showHover', true) });

                        this.$body.append(this.ratingView.render(this.$body).$el);
                    },
                    comment: function () {
                        if (dialogMode === 'nps') return;
                        var guid = _.uniqueId('feedback-note-');
                        this.$body.append(
                            $('<label>').attr('for', guid).text(gt('Comments and suggestions')),
                            $('<textarea class="feedback-note form-control" rows="5">').attr('id', guid)
                        );
                    },
                    infotext: function () {
                        // without comment field infotext makes no sense
                        if (dialogMode === 'nps') return;
                        this.$body.append(
                            $('<div>').text(
                                gt('Please note that support requests cannot be handled via the feedback form. If you have questions or problems please contact our support directly.')
                            )
                        );
                    },
                    supportlink: function () {
                        if (settings.get('feedback/supportlink', '') === '') return;
                        this.$body.append(
                            $('<a>').attr('href', settings.get('feedback/supportlink', ''))
                        );
                    }

                })
                .addCancelButton()
                .addButton({ action: 'send', label: gt('Send') })
                .on('send', function () {

                    if (this.ratingView.getValue() === 0) {
                        yell('error', gt('Please select a rating.'));
                        this.idle();
                        return;
                    }

                    var currentApp = getAppOptions().currentApp,
                        found = false,
                        OS = ['iOS', 'MacOS', 'Android', 'Windows', 'Windows8'],
                        data = {
                            // feedback
                            score: this.ratingView.getValue(),
                            app: this.ratingView.appSelect ? this.ratingView.appSelect.val() : 'general',
                            entry_point: (currentApp ? currentApp.get('name') : 'general'),
                            comment: this.$('.feedback-note').val() || '',
                            // system info
                            operating_system: 'Other',
                            browser: 'Other',
                            browser_version: 'Unknown',
                            user_agent: window.navigator.userAgent,
                            screen_resolution: screen.width + 'x' + screen.height,
                            language: ox.language,
                            client_version: ox.serverConfig.version + '-' + (ox.serverConfig.revision ? ox.serverConfig.revision : ('Rev' + ox.revision))
                        };

                    _(_.browser).each(function (val, key) {
                        if (val && _(OS).indexOf(key) !== -1) {
                            data.operating_system = key;
                        }
                        if (!found && _.isNumber(val)) {
                            found = true;
                            data.browser = key;
                            data.browser_version = val;
                        }
                    });

                    // Add additional version information for some OS
                    switch (data.operating_system) {
                        case 'MacOS':
                            if (!navigator.userAgent.match(/Mac OS X (\d+_?)*/)) break;
                            data.operating_system = navigator.userAgent.match(/Mac OS X (\d+_?)*/)[0];
                            break;
                        case 'iOS':
                            if (!navigator.userAgent.match(/iPhone OS (\d+_?)*/)) break;
                            data.operating_system = navigator.userAgent.match(/iPhone OS (\d+_?)*/)[0];
                            break;
                        case 'Android':
                            data.operating_system = 'Android ' + _.browser.Android;
                            break;
                        case 'Windows':
                            if (navigator.userAgent.match(/Windows NT 5\.1/)) {
                                data.operating_system = 'Windows XP';
                                break;
                            }
                            if (navigator.userAgent.match(/Windows NT 6\.0/)) {
                                data.operating_system = 'Windows Vista';
                                break;
                            }
                            if (navigator.userAgent.match(/Windows NT 6\.1/)) {
                                data.operating_system = 'Windows 7';
                                break;
                            }
                            if (navigator.userAgent.match(/Windows NT 6\.2/)) {
                                data.operating_system = 'Windows 8';
                                break;
                            }
                            if (navigator.userAgent.match(/Windows NT 6\.3/)) {
                                data.operating_system = 'Windows 8.1';
                                break;
                            }
                            if (navigator.userAgent.match(/Windows NT [10.0|6.4]?/)) {
                                data.operating_system = 'Windows 10';
                                break;
                            }
                            break;
                        case 'Other':
                            // maybe a linux system
                            if (!navigator.userAgent.match(/Linux/)) break;
                            data.operating_system = 'Linux';
                            break;
                        // no default
                    }
                    sendFeedback(data)
                        .done(function () {
                            //#. popup info message
                            yell('success', gt('Thank you for your feedback'));
                        })
                        .fail(function () {
                            //#. popup error message
                            yell('error', gt('Feedback could not be sent'));
                        });
                    this.close();
                })
                .open();
        },

        drawButton: function () {
            var node, button,
                position = settings.get('feedback/position', 'right');
            node = $('<div role="region" class="feedback-button">').attr('aria-label', gt('Feedback')).addClass('feedback-' + position).append(
                button = $('<button type="button">').text(gt('Feedback')).on('click', this.show)
            );
            $('#io-ox-screens').append(node);
            if (position === 'right') node.css('bottom', button.width() + 128 + 'px');
        }
    };

    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'feedback',
        index: 240,
        extend: function () {
            var currentSetting = settings.get('feedback/show', 'both');
            if (currentSetting === 'both' || currentSetting === 'topbar') {
                this.append(
                    $('<a href="#" data-action="feedback" role="menuitem" tabindex="-1">').text(gt('Give feedback'))
                    .on('click', function (e) {
                        e.preventDefault();
                        feedback.show();
                    })
                );
            }
        }
    });

    ext.point('io.ox/core/plugins').extend({
        id: 'feedback',
        draw: function () {
            if (_.device('smartphone')) return;
            var currentSetting = settings.get('feedback/show', 'both');
            if (!(currentSetting === 'both' || currentSetting === 'side')) return;
            feedback.drawButton();
        }
    });

    ext.point('plugins/core/feedback').invoke('initialize', this);

    return feedback;
});
