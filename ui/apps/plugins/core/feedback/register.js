/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/core/feedback/register', [
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core',
    'io.ox/core/notifications',
    'settings!io.ox/core',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'less!plugins/core/feedback/style'
], function (dialogs, gt, notifications, settings, api, ext) {

    'use strict';

    var includeUserInfo = settings.get('feeback/includeUserInfo', false);
    function buildStarWidget(number, hover) {
        //number of stars and boolean to enable or disable the hovereffect, default is 5 stars and hover enabled
        number = number || 5;
        //0 on init
        var value = 0,
            node = $('<div tabindex="1" class="star-wrapper tabindex="1" ' +
                                 //#. %1$d is current raiting
                                 //#. %2$d is the maximum rating
                                 //#, c-format
                'aria-label="' + gt('Rating %1$d of %2$d. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', value, number) + '">')
                .on('keydown', function (e) {
                    //left arrow
                    var activestars;
                    if (e.which === 37) {
                        activestars = node.find('.active-star').length;
                        if (activestars - 1 >= 0) {
                            updateStars({ data: { starnumber: activestars - 1 } });
                        }
                        node.attr('aria-label', gt('Rating %1$d of %2$d. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', activestars - 1, number));
                    } else if (e.which === 39) {
                        //right arrow
                        activestars = node.find('.active-star').length;
                        if (activestars + 1 <= number) {
                            updateStars({ data: { starnumber: activestars + 1 } });
                        }
                        node.attr('aria-label', gt('Rating %1$d of %2$d. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', activestars + 1, number));
                    } else if (e.which === 13) {
                        //enter
                        updateStars({ type: 'click', data: { starnumber: node.find('.active-star').length } });
                        node.attr('aria-label', gt('Rating %1$d of %2$d confirmed. Use the left and right arrowkeys to adjust your rating.', value, number));
                    } else if (e.which === 9) {
                        //tab
                        updateStars({ type: 'mouseleave', data: { starnumber: value } });
                        node.attr('aria-label', gt('Rating %1$d of %2$d. Press Enter to confirm or use the left and right arrowkeys to adjust your rating.', value, number));
                    }
                }),
            stars = [];
        //update function
        function updateStars(e) {
            var starnumber = e.data.starnumber;

            //reset stars on mouseleave
            if (e.type === 'mouseleave') {
                starnumber = value;
            }
            _(stars).each(function (star, index) {

                if (index < starnumber) {
                    star.addClass('active-star');
                } else {
                    star.removeClass('active-star');
                }
            });
            //update on click
            if (e.type === 'click') {
                //save value
                value = starnumber;
            }
        }
        //build stars
        for (var i = 0; i < number; i++) {
            stars.push($('<i class="fa fa-star rating-star">')
              .on((hover === false ? 'click' : 'click mouseenter mouseleave'), { starnumber: i + 1 }, updateStars));
        }
        //trigger initial update
        updateStars({ data: { starnumber: value } });

        node.append(stars);

        return { getValue: function () { return value; }, node: node };
    }

    function sendFeedback(data) {
        if (includeUserInfo) {
            return api.getCurrentUser().then(function (userdata) {
                data.user_id = ox.user_id;
                data.email = userdata.get('email1');
                //print data to console for now
                console.log(data);
                return $.when();
                // TODO: check if backend is ready now?
                //when backend is ready remove the placeholder 'console.log and return $.when' and use the correct function below

                /*return http.PUT({//could be done to use all folders, see portal widget but not sure if this is needed
                    module: 'feedback',
                    params: { action: 'send',
                        timezone: 'UTC'
                    },
                    data: data
                });*/
            });
        }
        //print data to console for now
        console.log(data);
        return $.when();
        // TODO: check if backend is ready now?
        // when backend is ready remove the placeholder 'console.log and return $.when' and use the correct function below

        /*return http.PUT({//could be done to use all folders, see portal widget but not sure if this is needed
            module: 'feedback',
            params: { action: 'send',
                timezone: 'UTC'
            },
            data: data
        });*/
    }

    var feedback = {
        show: function () {
            var guid = _.uniqueId('feedback-note-'),
                popup = new dialogs.ModalDialog()
                    .header($('<h4>').text(gt('Feedback')))
                    .addPrimaryButton('send', gt('Send feedback'), 'send', { tabIndex: 1 })
                    .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 }),
                stars = buildStarWidget(settings.get('feeback/numberOfStars', 5), settings.get('feeback/showHover', true)),
                note = $('<textarea tabindex="1" id="' + guid + '" class="feedback-note form-control" rows="5">'),
                supportlink = settings.get('feedback/supportlink', '');
            if (supportlink !== '') {
                supportlink = $('<a href="' + supportlink + '" tabindex="1">');
            }

            popup.getBody().append(
                $('<div class="feedback-welcome-text">')
                    .text(gt('Welcome. Please provide your feedback about this product')),
                stars.node,
                $('<label class="feedback-label" for="' + guid + '">').text(gt('Comments and suggestions')),
                note,
                $('<div class="feedback-info">')
                    .text(gt('Please note, that support requests cannot be handled via the feedback-formular. When you have questions or problems please contact our support directly')),
                supportlink,
                $('<div class="feedback-userdata-notice">').text(includeUserInfo ? gt('Your email address will be included when sending this feedback') : ''));

            popup.show().done(function (action) {
                if (action === 'send') {
                    sendFeedback({ rating: stars.getValue(), message: note.val() })
                    .done(function () {
                        notifications.yell('success', gt('Thank you for your feedback'));
                    })
                    .fail(function (error) {
                        notifications.yell(error);
                    });
                }
            });
        },
        drawButton: function () {
            var position = settings.get('feedback/position', 'left'),
                feedbackButton = $('<div class="feedback-button">').text('Feedback')
                .addClass(position + 'side-button')
                .on('click', this.show);

            $('#io-ox-core').append(feedbackButton);
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
                        $('<a href="#" data-action="feedback" role="menuitem" tabindex="1">').text(gt('Give feedback'))
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

    return feedback;
});
