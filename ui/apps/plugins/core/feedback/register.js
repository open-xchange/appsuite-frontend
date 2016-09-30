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
    'gettext!io.ox/core',
    'io.ox/core/yell',
    'io.ox/backbone/disposable',
    'settings!io.ox/core',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'less!plugins/core/feedback/style'
], function (ModalDialog, gt, yell, DisposableView, settings, api, ext) {

    'use strict';

    // disabled as this is evil privacy: includeUserInfo = settings.get('feeback/includeUserInfo', false),
    var StarRatingView = DisposableView.extend({

        className: 'star-wrapper',

        events: {
            'keydown': 'onKeyDown',
            'click .rating-star': 'updateStars',
            'mouseenter .rating-star': 'updateStars',
            'mouseleave .rating-star': 'updateStars'
        },

        initialize: function (options) {
            options = _.extend({ hover: true }, options);
            this.value = 0;
            this.options = options;

            //#. %1$d is current raiting
            //#, c-format
            this.$el.attr({ 'aria-label': gt('Rating %1$d of 5. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', this.value), tabindex: 0 });
        },

        render: function () {
            this.$el.empty();
            //build stars
            for (var i = 0; i < 5; i++) {
                this.$el.append($('<i class="fa fa-star rating-star">').attr('starnumber', i + 1));
            }
            return this;
        },

        getValue: function () {
            return this.value;
        },

        updateStars: function (e) {
            if (!this.options.hover && (e.type === 'mouseleave' && e.type === 'mouseenter')) return;

            var starnumber = e.starnumber || $(e.target).attr('starnumber');

            // reset stars on mouseleave
            if (e.type === 'mouseleave') starnumber = this.value;

            _(this.$('.rating-star')).each(function (star, index) {
                $(star).toggleClass('active-star', index < starnumber);
            });
            // update on click
            if (e.type === 'click') this.value = starnumber;
        },

        onKeyDown: function (e) {
            var activestars = this.$('.active-star').length;
            switch (e.which) {
                case 37:
                    // left arrow
                    if (activestars - 1 >= 0) {
                        this.updateStars({ starnumber: activestars - 1 });
                    }
                    this.$el.attr('aria-label', gt('Rating %1$d of 5. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', activestars - 1));
                    break;
                case 39:
                    // right arrow
                    if (activestars + 1 <= 5) {
                        this.updateStars({ starnumber: activestars + 1 });
                    }
                    this.$el.attr('aria-label', gt('Rating %1$d of 5. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', activestars + 1));
                    break;
                case 13:
                    // enter
                    this.updateStars({ type: 'click', starnumber: activestars });
                    this.$el.attr('aria-label', gt('Rating %1$d of 5 confirmed. Use the left and right arrowkeys to adjust your rating.', this.value));
                    break;
                case 9:
                    // tab
                    this.updateStars({ type: 'mouseleave', starnumber: this.value });
                    this.$el.attr('aria-label', gt('Rating %1$d of 5. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', this.value));
                    break;
                    // no default
            }
        }
    });

    var apiToken, // temporary API token
        feedbackService;

    ext.point('plugins/core/feedback').extend({
        id: 'api',
        index: 100,
        initialize: function () {
            console.info('Using debug feedback-service');
            apiToken = '!Afasdfasfqa9asd8fnRFFAsd';
            feedbackService = {
                sendFeedback: function (data) {
                    return $.ajax({
                        method: 'PUT',
                        // url: 'http://localhost:5000/feedback',
                        url: 'https://ox-feedback.herokuapp.com/feedback',
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=UTF-8',
                        processData: false,
                        headers: { 'api-token': apiToken }
                    });
                }
            };
        }
    });

    function sendFeedback(data) {
        /*if (includeUserInfo) {
            return api.getCurrentUser().then(function (userdata) {
                data.user = { id: ox.user_id, email: userdata.get('email1') };
                // feedbackservice was loaded via SCRIPT tag, is an external script like
                // analytics and should be implemented by the customer or OX SAAS
                if (window.feedbackService) {
                    return window.feedbackService.sendFeedback(data, apiToken);
                }
                return $.when();
            });
        }*/
        if (feedbackService) {
            return feedbackService.sendFeedback(data);
        }
        return $.when();
    }

    var feedback = {
        show: function () {
            var guid = _.uniqueId('feedback-note-'),
                starRatingView = new StarRatingView({ hover: settings.get('feeback/showHover', true) });
            new ModalDialog({ enter: 'send', point: 'plugins/core/feedback', title: 'Feedback' })
                .extend({
                    title: function () {
                        this.$body.append($('<div class="feedback-welcome-text">').text(gt('Please rate this product')));
                    },
                    starView: function () {
                        this.$body.append(starRatingView.render().$el);
                    },
                    comment: function () {
                        this.$body.append($('<label class="feedback-label">').attr('for', guid).text(gt('Comments and suggestions')), $('<textarea class="feedback-note form-control" rows="5">').attr('id', guid));
                    },
                    infotext: function () {
                        this.$body.append($('<div class="feedback-info">')
                                .text(gt('Please note, that support requests cannot be handled via the feedback-formular. If you have questions or problems please contact our support directly')));
                    },
                    supportlink: function () {
                        if (settings.get('feedback/supportlink', '') === '') return;
                        this.$body.append($('<a>').attr('href', settings.get('feedback/supportlink', '')));
                    }
                })
                .addButton({ action: 'send', label: gt('Send') })
                .addCancelButton()
                .on('send', function () {
                    var data = {
                        feedback: {
                            rating: starRatingView.getValue(),
                            text: this.$body.find('#' + guid).val()
                        },
                        client: {
                            ua: window.navigator.userAgent,
                            browser: _(_.browser).pick(function (val) { return !!val; }),
                            lang: ox.language
                        },
                        meta: {
                            serverVersion: ox.serverConfig.serverVersion,
                            uiVersion: ox.serverConfig.version,
                            productName: ox.serverConfig.productName,
                            path: ox.abs
                        }
                    };

                    sendFeedback(data)
                        .done(function () {
                            yell('success', gt('Thank you for your feedback'));
                        })
                        .fail(function (error) {
                            yell(error);
                        });
                })
                .open();
        },
        drawButton: function () {
            $('#io-ox-core').append($('<div class="feedback-button">')
                .text('Feedback')
                .addClass(settings.get('feedback/position', 'right') + 'side-button')
                .on('click', this.show));
        }
    };

    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'feedback',
        index: 250,
        draw: function () {
            var currentSetting = settings.get('feeback/show', 'both');
            if (currentSetting === 'both' || currentSetting === 'topbar') {
                this.append(
                    $('<li>').append(
                        $('<a href="#" data-action="feedback" role="menuitem">').text(gt('Give feedback'))
                    )
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
            var currentSetting = settings.get('feeback/show', 'both');
            if (_.device('!smartphone') && (currentSetting === 'both' || currentSetting === 'side')) {
                feedback.drawButton();
            }

        }
    });

    ext.point('plugins/core/feedback').invoke('initialize', this);

    return feedback;
});
