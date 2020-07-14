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
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (ext, Wizard, DisposableView, gt) {
    'use strict';

    var title = gt('Connect your device'),
        /* platforms =
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
        ], */
        wizard;

    var platformList = new Backbone.Collection([
        {
            'title': 'Windows PC',
            'icon': 'fa-windows',
            'platform': 'desktop'
        },
        {
            'title': 'Android phone or tablet',
            'icon': 'fa-android',
            'platform': 'android'
        },
        {
            'title': 'MacOS',
            'icon': 'fa-apple',
            'platform': 'macos'
        },
        {
            'title': 'iPhone or iPad',
            'icon': 'fa-apple',
            'platform': 'iphone'
        }
    ]);

    var appList = new Backbone.Collection([
        {
            'title': 'Drive App',
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'desktop'
        },
        {
            'title': 'Mail',
            'icon': 'fa-envelope-o',
            'app': 'mail',
            'platform': 'desktop'
        },
        {
            'title': 'Mail + Calendar + Address Book',
            'icon': 'fa-users',
            'app': 'emclient',
            'platform': 'desktop'
        },
        {
            'title': 'Email über Android Mail',
            'icon': 'fa-cloud',
            'app': 'mailsync',
            'platform': 'android'
        },
        {
            'title': 'Email über die OX Mail App',
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'android'
        },
        {
            'title': 'Contacts',
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'android'
        },
        {
            'title': 'Calendar',
            'icon': 'fa-users',
            'app': 'calendar',
            'platform': 'android'
        },
        {
            'title': 'Drive',
            'icon': 'fa-users',
            'app': 'driveapp',
            'platform': 'android'
        }

    ]);

    var PlatformView = Backbone.View.extend({

        tagName: 'div',
        className: 'description',

        initialize: function () {
            this.listView = new ListView({ collection: platformList, model: this.model });
        },

        render: function () {
            this.$el.empty()
            .append(
                $('<p class="info">').text(gt('This wizard helps you to use App Suite on other devices.')),
                $('<p class="prompt">').text(gt('Which device do you want to configure?'))
            );
            this.$el.append(this.listView.render().$el);
            return this;
        }
    });

    var AppView = Backbone.View.extend({

        tagName: 'div',
        className: 'description',

        initialize: function () {
            this.listView = new ListView({ collection: appList, model: this.model });
        },

        render: function () {
            this.$el.empty()
            .append(
                $('<p class="prompt">').text(gt('Which application do you want to use?'))
            );
            this.$el.append(this.listView.render().$el);
            return this;
        }
    });

    var ListView = Backbone.View.extend({

        tagName: 'ul',
        className: 'content-list',

        initialize: function () {

            this.listenTo(this.model, 'change', this.renderListItems);
        },
        events: {
            'click .list-btn': 'selectItem'
        },
        selectItem: function (e) {
            var target = $(e.currentTarget);
            this.model.set('app', target.attr('data-app'));
            this.model.set('platform', target.attr('data-platform'));
        },

        render: function () {
            console.log('%c events', 'background: #222; color: #bada55', { event: this.events, el: this.$el });
            this.$el.empty();
            this.renderListItems();
            return this;
        },

        renderListItems: function () {
            var list = this.collection,
                self = this;

            self.$el.append(
                list
                .filter(function (model) {
                    return self.model.get('platform') === undefined || self.model.get('platform') === model.get('platform');
                })
                .map(function (model) {
                    var view = new ListItemView({ model: model });
                    return view.render().$el;
                })
            );

        }
    });

    var ListItemView = DisposableView.extend({
        tagName: 'li',
        className: 'list-item',

        render: function () {
            this.$el
                .append(
                    $('<button type="button" class="list-btn" data-action="next">')
                    .addClass(this.model.get('data'))
                    .attr('data-platform', this.model.get('platform'))
                    .attr('data-app', this.model.get('app'))
                    .append(
                        $('<i class="icon-btn fa">').addClass(this.model.get('icon')),
                        $('<div class="list-description">').text(this.model.get('title')),
                        $('<i class="icon-next fa fa-chevron-right">')
                    ));
            return this;
        }
    });

    var ProgressionView = Backbone.View.extend({

        tagName: 'div',
        className: 'progress-container',

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },
        render: function () {
            var platform = !!this.model.get('platform'),
                app = !!this.model.get('app');
            this.$el.empty()
                .append($('<ul class="progress-steps">')
                .append(
                    $('<li class="progress-step-one">').text('1').append($('<p class="progress-description">').text(gt('Platform')))
                    .addClass(!platform && !app ? 'active' : ''),
                    $('<li class="progress-step-two">').text('2').append($('<p class="progress-description">').text(gt('App')))
                    .addClass(platform && !app ? 'active' : ''),
                    $('<li class="progress-step-three">').text('3').append($('<p class="progress-description">').text(gt('Setup')))
                ));
            return this;
        }

    });

    function drawScaffold() {
        this.$('div[role="document"]').addClass('connect-wizard');
        this.$('.wizard-title').text(title);
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

    function drawSetup() {
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

    var ConnectDeviceView = DisposableView.extend({

        initialize: function () {

            var options = {
                id: 'connect-wizard',
                title: title
            };
            this.model = new Backbone.Model({ app: undefined, platform: undefined });
            Wizard.registry.add(options, this.render.bind(this));
            Wizard.registry.run(options.id);
        },

        render: function () {
            var connectTour = new Wizard(),
                wizardModel = this.model;

            var platformsView = new PlatformView({ model: wizardModel });
            var appsView = new AppView({ model: wizardModel });
            var progressView = new ProgressionView({ model: wizardModel });

            connectTour.on('step:close', function () {
                console.log('close');
                platformsView.listView.remove();
                platformsView.remove();
                appsView.listView.remove();
                appsView.remove();
                progressView.remove();
            });

            progressView.render();

            connectTour.step({
                id: 'platform',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', function () {
                var el = platformsView.render();
                drawScaffold.call(this);
                this.$('.wizard-content').empty().append(
                    progressView.$el,
                    el.$el);

            })
            .end()
            .step({
                id: 'apps',
                back: false,
                next: false,
                minWidth: '600px'
            })
            .on('before:show', function () {
                var el = appsView.render();
                drawScaffold.call(this);
                this.$('.wizard-content').empty().append(
                    progressView.$el,
                    el.$el);

            })
            .on('back', function () {
                wizardModel.set('platform', undefined);
            })
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
