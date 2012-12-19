/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/lessons/lessons/model_view/register', ['io.ox/core/extensions', 'io.ox/lessons/editor', 'io.ox/lessons/toc', 'io.ox/backbone/modelFactory', 'io.ox/lessons/lessons/model_view/api'], function (ext, Editor, TOC, ModelFactory, api) {
    "use strict";
    var factory = new ModelFactory({
        ref: 'io.ox/lessons/recipes/model',
        api: api,
        model: {
            addIngredient: function (ingredient) {
                if (! _(this.get('ingredients')).contains(ingredient)) {
                    this.get('ingredients').push(ingredient);
                    this.trigger("change");
                    this.trigger("change:ingredients");
                }
            },

            removeIngredient: function (ingredient) {
                this.set('ingredients', _(this.get('ingredients')).without(ingredient));
            }
        }
    });
    
    ext.point("io.ox/lessons/lesson").extend({
        id: 'model_view',
        index: 500,
        title: 'On models and views',
        description: 'In which changes will be observed, validations run and data displayed many times',
        section: 'Architecture',
        start: function (options) {
            var win = options.win;
            require(["text!io.ox/lessons/lessons/model_view/lesson.html"], function (html) {
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