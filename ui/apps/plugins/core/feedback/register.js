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
        ],
        npsExtendedQuestions = [
            gt('What is the primary reason for your score?'),
            gt('How can we improve your experience?'),
            gt('Which features do you value or use the most?'),
            gt('What is the one thing we could do to make you happier?')
        ];

    // we want to limit spam, so offer a way to rate limit feedback
    function allowedToGiveFeedback() {
        // getSettings here for better readability later on
        // relative time stored as 3M for 3 Month etc, or absolute time stored in iso format 2014-06-20
        var timeLimit = settings.get('feedback/timeLimit', dialogMode === 'nps-v1' ? '6M' : undefined),
            // defaults is 1 if theres a limit, if not then we just allow infinite feedbacks
            maxNumberOfFeedbacks = settings.get('feedback/maxFeedbacks', timeLimit ? 1 : undefined),
            usedNumberOfFeedbacks = settings.get('feedback/usedFeedbacks', 0),
            // timestamp
            // we need to save the first feedback per timeslot, otherwise we could not use relative dates here (you are alloewd 3 feedbacks every month etc)
            firstFeedbackInTimeslot = settings.get('feedback/firstFeedbackTime');

        // no max number per timeslot => infinite number of feedbacks allowed
        if (!maxNumberOfFeedbacks) return true;

        if (firstFeedbackInTimeslot && timeLimit) {
            var tempTime;
            // absolute date
            if (timeLimit.indexOf('-') !== -1) {
                tempTime = moment(timeLimit).valueOf();
                // after specified date, need for reset?
                if (tempTime < _.now() && tempTime > firstFeedbackInTimeslot && usedNumberOfFeedbacks !== 0) {
                    usedNumberOfFeedbacks = 0;
                    settings.set('feedback/usedFeedbacks', 0).save();
                }
            // relative date
            } else {
                // limit is stored as 3M for 3 Month etc, so we have to split the string and apply it to the time the last feedback was given
                tempTime = moment(firstFeedbackInTimeslot).add(timeLimit.substring(0, timeLimit.length - 1), timeLimit.substring(timeLimit.length - 1)).valueOf();
                // after relative time, need for reset?
                if (tempTime < _.now() && usedNumberOfFeedbacks !== 0) {
                    usedNumberOfFeedbacks = 0;
                    settings.set('feedback/usedFeedbacks', 0).save();
                }
            }
        }

        return usedNumberOfFeedbacks < maxNumberOfFeedbacks;
    }

    function toggleButtons(state) {
        $('#io-ox-screens .feedback-button').toggle(state);
        $('#topbar-settings-dropdown [data-action="feedback"]').parent().toggle(state);
    }

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

        initialize: function () {
            // call super constructor
            StarRatingView.prototype.initialize.apply(this, arguments);
            // use value outside the range or the initial hover is set to 0 instead of nothing
            this.value = -1;
        },

        render: function () {

            this.$el.append(
                $('<div class="score-wrapper">').append(
                    _.range(0, 11).map(function (i) {
                        return $('<label>').append(
                            $('<input type="radio" name="nps-rating" class="sr-only">').val(i)
                                .attr('title', gt('%1$d of 10 points.', i)),
                            $('<span class="score" aria-hidden="true">').text(i)
                        );
                    })
                ),
                $('<div class="caption-wrapper">').append(
                    $('<caption>').text(gt('Not likely at all')),
                    $('<caption>').text(gt('Very likely'))
                )
            );

            return this;
        },

        renderRating: function (value) {
            var parsedValue = parseInt(value, 10);
            this.$('.score').each(function (index) {
                $(this).toggleClass('checked', index === parsedValue);
            });
        },

        setValue: function (value) {
            value = parseInt(value, 10);
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
                    var type = settings.get('feedback/mode', 'star-rating-v1');
                    return http.PUT({
                        module: 'userfeedback',
                        params: {
                            action: 'store',
                            // stars is a legacy type, map this to star-rating-v1
                            // if 'feedback/mode' is really set to stars, this means someone has forcefully overwritten the default config, backend will usually not send this (only nps-v1 and star-rating-v1 is valid).
                            type: (type === 'stars' ? 'star-rating-v1' : type)
                        },
                        data: data
                    });
                }
            };
        }
    });

    // for custom dev
    ext.point('plugins/core/feedback').extend({
        id: 'process',
        index: 200,
        process: $.noop
    });

    var modes = {
            'nps-v1': {
                ratingView: NpsRatingView,
                //#. %1$s is the product name, for example 'OX App Suite'
                title: gt('How likely are you to recommend %1$s to a friend or colleague?', ox.serverConfig.productName)
            },
            stars: {
                ratingView: StarRatingView,
                title: gt('Please rate this product')
            },
            'star-rating-v1': {
                ratingView: ModuleRatingView,
                title: gt('Please rate the following application:')
            }
        },
        // url parameter for testing purpose only
        dialogMode = _.url.hash('feedbackMode') || settings.get('feedback/mode', 'star-rating-v1');

    // make sure dialogMode is valid
    if (_(_(modes).keys()).indexOf(dialogMode) === -1) {
        dialogMode = 'star-rating-v1';
    }

    function sendFeedback(data) {
        return feedbackService ? feedbackService.sendFeedback(data) : $.when();
    }

    var feedback = {
        // not really used but helps with unit tests
        allowedToGiveFeedback: allowedToGiveFeedback,

        show: function () {
            var options = {
                async: true,
                enter: 'send',
                point: 'plugins/core/feedback',
                title: gt('We appreciate your feedback')
            };

            // nps view needs more space
            if (dialogMode === 'nps-v1') {
                options.width = 580;
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

                        this.$body.addClass(dialogMode + '-feedback-view').append(this.ratingView.render(this.$body).$el);
                    },
                    comment: function () {
                        if (dialogMode === 'nps-v1' && !settings.get('feedback/showQuestion', false)) return;

                        var guid = _.uniqueId('feedback-note-'),
                            // prepare for index out of bounds
                            text = dialogMode === 'nps-v1' ? npsExtendedQuestions[settings.get('feedback/questionIndex') || 0] || gt('What is the primary reason for your score?') : gt('Comments and suggestions');

                        this.$body.append(
                            $('<label>').attr('for', guid).text(text),
                            $('<textarea class="feedback-note form-control" rows="5">').attr('id', guid)
                        );
                    },
                    infotext: function () {
                        // without comment field infotext makes no sense
                        if (dialogMode === 'nps-v1') return;
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
                    var isNps = dialogMode === 'nps-v1',
                        rating = this.ratingView.getValue();

                    if ((isNps && rating === -1) || (!isNps && rating === 0)) {
                        yell('error', gt('Please select a rating.'));
                        this.idle();
                        return;
                    }

                    var currentApp = getAppOptions().currentApp,
                        found = false,
                        OS = ['iOS', 'MacOS', 'Android', 'Windows', 'Windows8'],
                        data = {
                            // feedback
                            score: rating,
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

                    if (isNps) { ox.trigger('feedback:nps', rating); }

                    if (isNps && settings.get('feedback/showQuestion', false)) {
                        // looks strange but works for index out of bounds and not set at all
                        data.questionId = npsExtendedQuestions[settings.get('feedback/questionIndex') || 0] ? settings.get('feedback/questionIndex') || 0 : 0;
                    }

                    _(_.browser).each(function (val, key) {
                        if (val && _(OS).indexOf(key) !== -1) {
                            data.operating_system = key;
                        }
                        if (!found && _.isNumber(val)) {
                            // distinguish correctly between IE and edge
                            // TODO can be removed when edge is no longer recognized as IE with higher version
                            if (key === 'IE' && _.browser.edge) {
                                data.browser = 'Edge';
                                // round to one decimal place
                                data.browser_version = parseInt(_.browser.Edge * 10, 10) / 10;
                            } else {
                                data.browser = key;
                                data.browser_version = val;
                            }
                            found = true;
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

                    var baton = ext.Baton.ensure(data);
                    ext.point('plugins/core/feedback').invoke('process', this, baton);
                    data = baton.data;
                    sendFeedback(data)
                        .done(function () {
                            // update settings
                            settings.set('feedback/usedFeedbacks', settings.get('feedback/usedFeedbacks', 0) + 1).save();
                            if (settings.get('feedback/usedFeedbacks', 0) === 1) settings.set('feedback/firstFeedbackTime', _.now()).save();

                            if (!allowedToGiveFeedback()) toggleButtons(false);
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

    ext.point('io.ox/core/appcontrol/right/account').extend({
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
                this.$ul.find('[data-action="feedback"]').parent().toggle(allowedToGiveFeedback());
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
            toggleButtons(allowedToGiveFeedback());
        }
    });

    // update on refresh should work
    ox.on('refresh^', function () {
        toggleButtons(allowedToGiveFeedback());
    });

    ext.point('plugins/core/feedback').invoke('initialize', this);

    return feedback;
});
