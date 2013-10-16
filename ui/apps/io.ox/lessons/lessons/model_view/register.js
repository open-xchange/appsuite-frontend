/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/lessons/lessons/model_view/register',
    ['io.ox/core/extensions',
     'io.ox/lessons/editor',
     'io.ox/lessons/toc',
     'io.ox/backbone/modelFactory',
     'io.ox/lessons/lessons/model_view/api'
    ], function (ext, Editor, TOC, ModelFactory, api) {

    'use strict';

    var factory = new ModelFactory({
        ref: 'io.ox/lessons/recipes/model',
        api: api,
        model: {
            addIngredient: function (ingredient) {
                if (! _(this.get('ingredients')).contains(ingredient)) {
                    this.get('ingredients').push(ingredient);
                    this.trigger('change');
                    this.trigger('change:ingredients');
                }
            },

            removeIngredient: function (ingredient) {
                this.set('ingredients', _(this.get('ingredients')).without(ingredient), {validate: true});
            }
        }
    });

    ext.point('io.ox/lessons/lesson').extend({
        id: 'model_view',
        index: 500,
        title: 'On models and views',
        description: 'In which changes will be observed, validations run and data displayed many times',
        section: 'Architecture',
        start: function (options) {
            require(['text!io.ox/lessons/lessons/model_view/lesson.html'], function (html) {
                var win = options.win;
                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main, {
                    contexts: {
                        factory: {
                            model: {
                                factory: factory,
                                Recipe: factory.model,
                                Recipes: factory.collection
                            }
                        }
                    }
                });
            });
        }
    });
});
