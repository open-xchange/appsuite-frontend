/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/wizards/mandatory/main', [
    'io.ox/core/extensions',
    'gettext!io.ox/wizards/firstStart'
], function (ext, gt) {

    'use strict';

    var point = ext.point('io.ox/wizards/firstStart');

    /**
     * Don’t use gt for this, because it contains some example text that should not be translated
     */
    point.extend({
        id: 'example_welcome',
        title: gt.format(gt('Welcome to %s'), ox.serverConfig.productName),
        draw: function (baton) {
            this.append(
                gt('Before you can continue using the product, you have to enter some basic information. It will take less than a minute.')
            );
            baton.buttons.enableNext();
        }
    });

    point.extend({
        id: 'name',
        title: gt('Your name'),
        load: function (baton) {
            var def = $.Deferred();

            require(['io.ox/core/api/user', 'io.ox/backbone/mini-views'], function (userAPI, mini) {
                baton.libraries = {
                    userAPI: userAPI,
                    mini: mini
                };
                userAPI.getCurrentUser().done(function (user) {
                    baton.user = user;

                    user.set('first_name');
                    user.set('last_name');

                    function updateButtonState() {
                        if (!_.isEmpty($.trim(user.get('first_name'))) && !_.isEmpty($.trim(user.get('last_name')))) {
                            baton.buttons.enableNext();
                        } else {
                            baton.buttons.disableNext();
                        }
                    }
                    baton.user.on('change', updateButtonState);

                    updateButtonState();

                    def.resolve();
                }).fail(def.reject);
            });

            return def;
        },

        draw: function (baton) {
            // Now, on to the serious business
            var mini = baton.libraries.mini;

            this.append(
                $('<form class="form-horizontal" />').append(
                    $('<div class="control-group" />').append(
                        $('<label class="control-label" for="first_name" />').text(gt('First name')),
                        $('<div class="controls" />').append(
                            baton.focusNode = new mini.InputView({ name: 'first_name', model: baton.user }).render().$el
                        )
                    ),
                    $('<div class="control-group" />').append(
                        $('<label class="control-label" for="last_name" />').text(gt('Last name')),
                        $('<div class="controls" />').append(
                            new mini.InputView({ name: 'last_name', model: baton.user }).render().$el
                        )
                    )
                )
            );

            this.find('input[type="text"]').on('keyup', _.debounce(function () {
                var valid = _($('input[type="text"]')).reduce(function (memo, element) {
                    return memo && !_.isEmpty($.trim($(element).val()));
                }, true);
                if (valid) {
                    baton.buttons.enableNext();
                } else {
                    baton.buttons.disableNext();
                }
            }, 100));

        },

        activate: function (baton) {
            baton.focusNode.focus();
        },

        finish: function (baton) {
            // Depending on the capabilities of the model, this could be more complicated
            // you might have to interrogate the model for the #changedAttributes
            // and call an API method. In any case, finish may return a deferred object
            // to denote the state of the save operation
            return baton.user.save();
        }
    });

    point.extend({
        id: 'timezone',
        title: gt('Your timezone'),
        load: function (baton) {
            return require([
                'settings!io.ox/core',
                'settings!io.ox/core/settingOptions',
                'io.ox/backbone/mini-views/common'
            ], function (settings, settingOptions, miniViews) {
                var available = settingOptions.get('availableTimeZones'),
                    technicalNames = _(available).keys(),
                    userTZ = settings.get('timezone', 'UTC'),
                    sorted = {};

                // Sort the technical names by the GMT offset
                technicalNames.sort(function (a, b) {
                    var va = available[a],
                        vb = available[b],
                        diff = Number(va.substr(4, 3)) - Number(vb.substr(4, 3));
                    if (diff === 0 || _.isNaN(diff)) {
                        return (vb === va) ? 0 : (va < vb) ? -1 : 1;
                    } else {
                        return diff;
                    }
                });

                // filter double entries and sum up results in 'sorted' array
                for (var i = 0; i < technicalNames.length; i++) {
                    var key = technicalNames[i],
                        key2 = technicalNames[i + 1];
                    if (key2 && available[key] === available[key2]) {
                        if (key2 === userTZ) {
                            sorted[key2] = available[key2];
                        } else {
                            sorted[key] = available[key];
                        }
                        i++;
                    } else {
                        sorted[key] = available[key];
                    }
                }

                baton.availableTimeZones = sorted;
                baton.model = settings;
                baton.libraries = {
                    forms: miniViews
                };

                baton.buttons.enableNext();
            });
        },

        draw: function (baton) {
            this.append(
                $('<form class="form-horizontal" />').append(
                    $('<label class="control-label" for="timezone">').text(gt('Timezone')),
                    baton.focusNode = new baton.libraries.forms.SelectView({
                        list: _.map(baton.availableTimeZones, function (key, val) { return { label: key, value: val }; }),
                        name: 'timezone',
                        model: baton.model.createModel(Backbone.Model),
                        id: 'timezone',
                        className: 'form-control input-xlarge'
                    }).render().$el
                )
            );
        },

        activate: function (baton) {
            baton.focusNode.focus();
        },

        finish: function (baton) {
            // Depending on the capabilities of the model, this could be more complicated
            // you might have to interrogate the model for the #changedAttributes
            // and call an API method. In any case, finish may return a deferred object
            // to denote the state of the save operation
            return baton.model.save();
        }
    });

    return {};
});
