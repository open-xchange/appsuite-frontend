/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/onboarding/main', [
    'io.ox/core/extensions',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (ext, Wizard, gt) {
    'use strict';

    var title = gt('Connect your device'),
        platforms =
        [
            {
                'title': 'Windows PC',
                'icon': 'fa-windows',
                'data': 'desktop',
                'choices':
                [
                    {
                        'title': 'Drive App',
                        'icon': 'fa-cloud',
                        'data': 'drive'
                    },
                    {
                        'title': 'Mail',
                        'icon': 'fa-envelope-o',
                        'data': 'mail'
                    },
                    {
                        'title': 'Mail + Calendar + Address Book',
                        'icon': 'fa-users',
                        'data': 'emclient'
                    }
                ]
            },
            {
                'title': 'Android phone or tablet',
                'icon': 'fa-android',
                'data': 'android',
                'choices':
                [
                    {
                        'title': 'Email über Android Mail',
                        'icon': 'fa-cloud',
                        'data': 'mailsync',
                        'setupdata':
                        {
                            'description':
                            [
                                {
                                    'class': 'info',
                                    'text': gt('At first, please try to add your mail address max.mustermann@open-xchange.com to check wheter Android Mail can automatically configure your email account.')
                                },
                                {
                                    'class': 'info',
                                    'text': gt('If an automatic configuration is not possible, please use the following information to manually setup your mail account:')
                                }
                            ]
                        }
                    },
                    {
                        'title': 'Email über die OX Mail App',
                        'icon': 'fa-envelope-o',
                        'data': 'mailapp'
                    },
                    {
                        'title': 'Contacts',
                        'icon': 'fa-users',
                        'data': 'addressbook'
                    },
                    {
                        'title': 'Calendar',
                        'icon': 'fa-users',
                        'data': 'calendar'
                    },
                    {
                        'title': 'Drive',
                        'icon': 'fa-users',
                        'data': 'driveapp'
                    }
                ]
            },
            {
                'title': 'MacOS',
                'icon': 'fa-apple',
                'data': 'macos'
            },
            {
                'title': 'iPhone or iPad',
                'icon': 'fa-apple',
                'data': 'iphone'
            }
        ],
        descriptions =
        [
            [
                {
                    'class': 'info',
                    'text': gt('This wizard helps you to use App Suite on other devices.')
                },
                {
                    'class': 'prompt',
                    'text': gt('Which device do you want to configure?')
                }
            ],
            [
                {
                    'class': 'prompt',
                    'text': gt('Which application do you want to use?')
                }
            ]
        ],

        wizard;

    function drawScaffold() {
        this.$('div[role="document"]').addClass('connect-wizard');
        this.$('.wizard-title').text(title);
        this.$('.wizard-content').append($('<div class="progress-container">'));
        this.$('.wizard-footer').empty().append(
            this.parent.currentStep === 0 ? '' : $('<button type="button" class="btn btn-default" data-action="back">').text(gt('Back')),
            $('<button type="button" class="btn btn-default" data-action="close">').text(gt('Close'))
        );
    }

    function drawProgress(currentStep) {
        this.$('.progress-container').empty()
            .append($('<ul class="progress-steps">')
                .append(
                    $('<li class="progress-step-one">').text('1').append($('<p class="progress-description">').text(gt('Platform')))
                    .addClass(currentStep === 0 ? 'active' : ''),
                    $('<li class="progress-step-two">').text('2').append($('<p class="progress-description">').text(gt('App')))
                    .addClass(currentStep === 1 ? 'active' : ''),
                    $('<li class="progress-step-three">').text('3').append($('<p class="progress-description">').text(gt('Setup')))
                    .addClass(currentStep === 2 ? 'active' : '')
                ));
    }

    function drawContent() {
        var wizard = this.parent,
            currentStep = wizard.currentStep,
            model = currentStep === 0 ? wizard.model : wizard.currentModel.choices;
        console.log('%c currentStep', 'background: #222; color: #bada55', { currentStep: currentStep, currentModel: model });
        this.$('.wizard-content').empty();
        drawScaffold.call(this);
        drawProgress.call(this, currentStep);

        this.$('.wizard-content')
                .append(
                    $('<div class="description">')
                        .append(function () {
                            return descriptions[currentStep].map(function (desc) {
                                return $('<p>').addClass(desc.class).text(desc.text);
                            });
                        }
                        ),
                    $('<ul class="content-list">').append(
                        function () {
                            return model.map(
                                function (content) {
                                    return $('<li class="apps">')
                                        .attr('data-value', content.data)
                                        .append(
                                            $('<button type="button" class="list-btn" data-action="next">')
                                            .addClass(content.data)
                                            .attr('data-value', content.data)
                                            .append(
                                                $('<i class="icon-btn fa">').addClass(content.icon),
                                                $('<div class="list-description">').text(content.title),
                                                $('<i class="icon-next fa fa-chevron-right">')
                                            )
                                            .click(function () {
                                                var data = $(this).attr('data-value'),
                                                    choiceModel = model.find(function (item) {
                                                        return item.data === data;
                                                    });
                                                wizard.currentModel = choiceModel;
                                            })
                                        );
                                }
                            );
                        }
                    )
                );
    }

    function drawSetup() {
        console.log('%c currentStep', 'background: #222; color: #bada55', { currentStep: currentStep, currentModel: model });
        var wizard = this.parent,
            currentStep = wizard.currentStep,
            model = wizard.currentModel.setupdata;

        this.$('.wizard-content').empty();
        drawScaffold.call(this);
        drawProgress.call(this, currentStep);

        this.$('.wizard-content')
                .append(
                    $('<div class="description">')
                        .append(function () {
                            return model.description.map(function (desc) {
                                return $('<p>').addClass(desc.class).text(desc.text);
                            });
                        }
                        ));
    }

    var ConnectDeviceView = Backbone.View.extend({

        initialize: function () {

            var options = {
                id: 'connect-wizard',
                title: title
            };
            this.model = this.currentModel = platforms;
            Wizard.registry.add(options, this.render.bind(this));
            Wizard.registry.run(options.id);
        },

        render: function () {
            var connectTour = new Wizard();

            connectTour.model = this.model;
            connectTour.currentModel = this.model;

            connectTour.step({
                id: 'platform',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', drawContent)
            .end()
            .step({
                id: 'apps',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', drawContent)
            .end()
            .step({
                id: 'setup',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', drawSetup)
            .end();

            connectTour.start();
        }
    });

    ext.point('io.ox/onboarding/main').extend({
        id: 'connect-wizard',
        index: 10
    });


    wizard = {
        run: function () {
            console.log(title);
            return new ConnectDeviceView();
        }
    };
    return wizard;

});
