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
    };

    // disabled as this is evil privacy: includeUserInfo = settings.get('feeback/includeUserInfo', false),
    var StarRatingView = DisposableView.extend({

        className: 'star-rating',

        events: {
            'keydown': 'onKeyDown',
            'click .star': 'onClick',
            'mouseenter .star': 'onHover',
            'mouseleave .star': 'onHover'
        },

        initialize: function (options) {
            this.options = _.extend({ hover: true }, options);
            this.value = 0;
            this.$el.attr({
                'aria-label': gt('Use left and right cursor keys to adjust your rating.'),
                'aria-live': 'polite',
                role: 'group',
                tabindex: 0
            });
        },

        render: function () {
            this.$el.empty().append(
                _.range(0, 5).map(function (i) {
                    return $('<i class="fa fa-star star" role="presentation">').attr('data-rating', i + 1);
                }),
                $('<caption>').text('\u00a0')
            );
            return this;
        },

        renderRating: function (value) {
            this.$('.star').each(function (index) {
                $(this).toggleClass('checked', index < value);
            });
            this.$('caption').text(captions[value]);
        },

        getValue: function () {
            return this.value;
        },

        setValue: function (value) {
            if (value < 1 || value > 5) return;
            this.value = value;
            this.renderRating(value);
            this.$el.attr('aria-label', gt('Rating %1$d of 5', value));
        },

        onClick: function (e) {
            var value = $(e.currentTarget).data('rating');
            this.setValue(value);
        },

        onHover: function (e) {
            if (!this.options.hover) return;
            var value = e.type === 'mouseenter' ? $(e.currentTarget).data('rating') : this.value;
            this.renderRating(value);
        },

        onKeyDown: function (e) {
            var value = this.$('.checked').length;
            switch (e.which) {
                // cursor left
                case 37: this.setValue(value - 1); break;
                // cursor right
                case 39: this.setValue(value + 1); break;
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
        return feedbackService ? feedbackService.sendFeedback(data) : $.when();
    }

    var feedback = {

        show: function () {

            new ModalDialog({ enter: 'send', point: 'plugins/core/feedback', title: gt('Your feedback') })
                .extend({
                    title: function () {
                        this.$body.append(
                            $('<div class="feedback-welcome-text">').text(gt('Please rate this product'))
                        );
                    },
                    starView: function () {
                        this.starRatingView = new StarRatingView({ hover: settings.get('feeback/showHover', true) });
                        this.$body.append(this.starRatingView.render().$el);
                    },
                    comment: function () {
                        var guid = _.uniqueId('feedback-note-');
                        this.$body.append(
                            $('<label>').attr('for', guid).text(gt('Comments and suggestions')),
                            $('<textarea class="feedback-note form-control" rows="5">').attr('id', guid)
                        );
                    },
                    infotext: function () {
                        this.$body.append(
                            $('<div>').text(
                                gt('Please note that support requests cannot be handled via the feedback form. If you have questions or problems please contact our support directly')
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

                    var data = {
                        feedback: {
                            rating: this.starRatingView.getValue(),
                            text: this.$('.feedback-note').val()
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
                        .fail(yell);
                })
                .open();
        },

        drawButton: function () {
            $('#io-ox-core').append(
                $('<button role="button" class="feedback-button" tabindex="0">')
                .text(gt('Feedback'))
                .addClass(settings.get('feedback/position', 'right') + 'side-button')
                .on('click', this.show)
            );
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
