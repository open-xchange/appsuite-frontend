/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tours/factory',
    ['io.ox/core/extensions',
     'gettext!io.ox/core',
     'apps/io.ox/core/tours/tourist.min.js',
     'less!io.ox/core/tours/tourist.less'
    ], function (ext, gt) {

    'use strict';

    var registry = {}, customized = {};

    var api = {

        // id and title are mandatory to allow identifying and isting tours
        // options is handed over to tourist.js
        create: function (options) {

            options = options || {};
            var id = options.id, tour;

            if (!id || !options.title) {
                console.error('core/tours/factory: Tours must have an internal ID and a title!', options);
                return;
            }

            // duplicate?
            if (id in registry) {
                console.error('core/tours/factory: Duplicate tour id', id, registry);
            }

            options = _.extend({
                steps: [],
                tipClass: 'Bootstrap',
                tipOptions: { showEffect: 'slidein' }
            }, options);


            // add to registry
            registry[id] = options;
        },

        has: function (id) {
            return (id in registry);
        },

        get: function (id) {
            return registry[id];
        },

        start: function (id, container) {
            var options = registry[id], tour;
            if (options) {
                // call customize extensions?
                if (!customized[id]) {
                    // set container
                    options.steps = options.steps || [];
                    _(options.steps).each(function (step) {
                        if ('container' in step) return;
                        step.container = container;
                    });
                    // call customization only once!
                    ext.point('io.ox/core/tours').invoke('customize', this, options);
                    customized[id] = true;
                }
                // create start instance and start
                tour = new window.Tourist.Tour(options);
                tour.start();
                return tour;
            }
        }
    };

    // some basic i18n support
    _.extend(window.Tourist.Tip.Base.prototype, {
        finalButtonTemplate: '<button class="btn btn-primary btn-small pull-right tour-next">' + gt('Finish tour') + '</button>',
        nextButtonTemplate: '<button class="btn btn-primary btn-small pull-right tour-next">' + gt('Next step') + '</button>',
        skipButtonTemplate: '<button class="btn btn-small pull-right tour-next">' + gt('Skip this step') + '</button>'
    });

    api.create({
        id: 'io.ox/mail/tour1',
        title: 'Mail introduction',
        steps: [{
            content: '<p>YEEEEEAAAH!</p>',
            highlightTarget: true,
            nextButton: true,
            target: $('.vgrid'),
            my: 'left center',
            at: 'right center'
        }, {
            content: '<p>Step #2!</p>',
            highlightTarget: true,
            nextButton: true,
            target: $('.subject'),
            my: 'top center',
            at: 'bottom center'
        }]
    });

    ext.point('io.ox/core/tours').extend({
        customize: function (options) {
            console.log('customize', options);
            options.steps[0].content = '<p><b>Megageil</b></p>';
        }
    });

    console.log('hier?');
    api.start('io.ox/mail/tour1', $('.window-container'));

    return api;
});
