/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/backbone/tests/views", ["io.ox/core/extensions", "io.ox/backbone/modelFactory", "io.ox/backbone/views", "io.ox/backbone/tests/recipeApi"], function (ext, ModelFactory, views, api) {
    "use strict";

    var factory = new ModelFactory({
        ref: "io.ox/backbone/tests/views/factory" + _.now(),
        api: api
    });

    ext.point("test/suite").extend({
        id: 'backbone-views',
        index: 100,
        test: function (j, utils) {

            j.describe("view extension points", function () {

                j.it("should provide an extension point to draw into", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    point.basicExtend({
                        id: 'testExtension',
                        draw: function () {
                            this.append(
                                $('<div class="find-me">').text("Hello")
                            );
                        }
                    });

                    var View = point.createView();

                    var $el = new View().render().$el;

                    j.expect($el.find('.find-me').text()).toEqual("Hello");

                });


                j.it("should be extensible through new views", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    point.extend({
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        render: function () {
                            this.$el.text("Hello");
                        }
                    });

                    var View = point.createView();

                    var $el = new View().render().$el;

                    j.expect($el.find('.find-me').text()).toEqual("Hello");

                });

                j.it("should have extension views mark their node with extension-point, extension-id and objects composite id", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    point.extend({
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        render: function () {
                            this.$el.text("Hello");
                        }
                    });

                    var View = point.createView();

                    var $el = new View({model: factory.create({folder: 12, id: 23})}).render().$el;

                    var $extensionNode = $el.find('.find-me');

                    j.expect($extensionNode.data('extension-id')).toEqual("view");
                    j.expect($extensionNode.data('extension-point')).toEqual(ref);
                    j.expect(String($extensionNode.data('composite-id'))).toEqual("12.23");
                });

                j.it("should provide access to the baton, model and element to extension views", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var extension = null;

                    point.extend({
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        render: function () {
                            this.$el.text("Hello");
                            extension = this;
                        }
                    });

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    var $el = new View({model: recipe}).render().$el;

                    j.expect(extension).not.toEqual(null);

                    j.expect(extension.baton).toBeDefined();
                    j.expect(extension.baton).not.toEqual(null);
                    j.expect(extension.baton.model).toEqual(recipe);
                    j.expect(extension.baton instanceof ext.Baton).toEqual(true);

                    j.expect(extension.model).toBeDefined();
                    j.expect(extension.model).not.toEqual(null);
                    j.expect(extension.model).toEqual(recipe);


                    j.expect(extension.$el).toBeDefined();
                    j.expect(extension.$el).not.toEqual(null);
                    j.expect(extension.$el.text()).toEqual("Hello");

                });

                j.it("should automatically trigger update, invalid and valid methods", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var extension = {
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        render: function () {
                            this.$el.text("Hello");
                        },
                        update: function () {
                        },
                        modelInvalid: function () {
                        },
                        modelValid: function () {
                        }
                    };

                    j.spyOn(extension, 'update');
                    j.spyOn(extension, 'modelInvalid');
                    j.spyOn(extension, 'modelValid');

                    point.extend(extension);

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    new View({model: recipe}).render();

                    recipe.trigger('change');
                    j.expect(extension.update).toHaveBeenCalled();

                    recipe.trigger('invalid');
                    j.expect(extension.modelInvalid).toHaveBeenCalled();


                    recipe.trigger('valid');
                    j.expect(extension.modelValid).toHaveBeenCalled();

                });

                j.it("should allow extensions to observe an attribute", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var extension = {
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        observe: 'title',

                        render: function () {
                            this.$el.text("Hello");
                        },
                        onTitleChange: function () {
                        },
                        onTitleInvalid: function () {
                        },
                        onTitleValid: function () {
                        }
                    };

                    j.spyOn(extension, 'onTitleChange');
                    j.spyOn(extension, 'onTitleInvalid');
                    j.spyOn(extension, 'onTitleValid');

                    point.extend(extension);

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    new View({model: recipe}).render();

                    recipe.trigger('change:title');
                    j.expect(extension.onTitleChange).toHaveBeenCalled();

                    recipe.trigger('invalid:title');
                    j.expect(extension.onTitleInvalid).toHaveBeenCalled();


                    recipe.trigger('valid:title');
                    j.expect(extension.onTitleValid).toHaveBeenCalled();
                });

                j.it("should allow extensions to observe multiple attributes, and deal gracefully with snake-case or snake_case names", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var extension = {
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        observe: 'title description servings-number recipe_dot_com_rating',

                        render: function () {
                            this.$el.text("Hello");
                        },
                        onTitleChange: function () {
                        },
                        onTitleInvalid: function () {
                        },
                        onTitleValid: function () {
                        },
                        onDescriptionChange: function () {
                        },
                        onDescriptionInvalid: function () {
                        },
                        onDescriptionValid: function () {
                        },
                        onServingsNumberChange: function () {
                        },
                        onServingsNumberInvalid: function () {
                        },
                        onServingsNumberValid: function () {
                        },
                        onRecipeDotComRatingChange: function () {
                        },
                        onRecipeDotComRatingInvalid: function () {
                        },
                        onRecipeDotComRatingValid: function () {
                        }

                    };

                    j.spyOn(extension, 'onTitleChange');
                    j.spyOn(extension, 'onTitleInvalid');
                    j.spyOn(extension, 'onTitleValid');

                    j.spyOn(extension, 'onDescriptionChange');
                    j.spyOn(extension, 'onDescriptionInvalid');
                    j.spyOn(extension, 'onDescriptionValid');


                    j.spyOn(extension, 'onServingsNumberChange');
                    j.spyOn(extension, 'onServingsNumberInvalid');
                    j.spyOn(extension, 'onServingsNumberValid');

                    j.spyOn(extension, 'onRecipeDotComRatingChange');
                    j.spyOn(extension, 'onRecipeDotComRatingInvalid');
                    j.spyOn(extension, 'onRecipeDotComRatingValid');

                    point.extend(extension);

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    new View({model: recipe}).render();

                    recipe.trigger('change:title');
                    j.expect(extension.onTitleChange).toHaveBeenCalled();

                    recipe.trigger('invalid:title');
                    j.expect(extension.onTitleInvalid).toHaveBeenCalled();

                    recipe.trigger('valid:title');
                    j.expect(extension.onTitleValid).toHaveBeenCalled();



                    recipe.trigger('change:description');
                    j.expect(extension.onDescriptionChange).toHaveBeenCalled();

                    recipe.trigger('invalid:description');
                    j.expect(extension.onDescriptionInvalid).toHaveBeenCalled();

                    recipe.trigger('valid:description');
                    j.expect(extension.onDescriptionValid).toHaveBeenCalled();



                    recipe.trigger('change:servings-number');
                    j.expect(extension.onServingsNumberChange).toHaveBeenCalled();

                    recipe.trigger('invalid:servings-number');
                    j.expect(extension.onServingsNumberInvalid).toHaveBeenCalled();


                    recipe.trigger('valid:servings-number');
                    j.expect(extension.onServingsNumberValid).toHaveBeenCalled();



                    recipe.trigger('change:recipe_dot_com_rating');
                    j.expect(extension.onRecipeDotComRatingChange).toHaveBeenCalled();

                    recipe.trigger('invalid:recipe_dot_com_rating');
                    j.expect(extension.onRecipeDotComRatingInvalid).toHaveBeenCalled();


                    recipe.trigger('valid:recipe_dot_com_rating');
                    j.expect(extension.onTitleValid).toHaveBeenCalled();

                });

                j.it("should be able to register listeners for model events", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var extension = {
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',
                        modelEvents: {
                            "customEvent": "onCustomEvent"
                        },

                        render: function () {
                            this.$el.text("Hello");
                        },
                        onCustomEvent: function () {
                        }
                    };

                    j.spyOn(extension, 'onCustomEvent');

                    point.extend(extension);

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    new View({model: recipe}).render();

                    recipe.trigger('customEvent');
                    j.expect(extension.onCustomEvent).toHaveBeenCalled();

                });

                j.it("should allow extensions to use the parent view as an event bus", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    point.extend({
                        id: 'view',
                        tagName: 'div',
                        className: 'find-me',

                        render: function () {
                            this.$el.text("Hello");
                            this.baton.parentView.trigger("event");
                        }
                    });

                    var receivedEvent = false;

                    var View = point.createView();

                    var recipe = factory.create({folder: 12, id: 23});

                    var view = new View({model: recipe});
                    view.on('event', function () {
                        receivedEvent = true;
                    });
                    view.render();

                    j.expect(receivedEvent).toEqual(true);

                });

                j.it("should allow sub extension points", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    var subpoint1 = point.createSubpoint("section1", {tagName: 'div', className: 's1'});
                    var subpoint2 = point.createSubpoint("section2", {tagName: 'div', className: 's2'});


                    subpoint1.extend({
                        id: 'view1.1',
                        tagName: 'div',
                        className: 'view11',
                        render: function () {
                            this.$el.text("1.1");
                        }
                    });

                    subpoint1.extend({
                        id: 'view1.2',
                        tagName: 'div',
                        className: 'view12',
                        render: function () {
                            this.$el.text("1.2");
                        }
                    });

                    subpoint2.extend({
                        id: 'view2.1',
                        tagName: 'div',
                        className: 'view21',
                        render: function () {
                            this.$el.text("2.1");
                        }
                    });

                    subpoint2.extend({
                        id: 'view2.2',
                        tagName: 'div',
                        className: 'view22',
                        render: function () {
                            this.$el.text("2.2");
                        }
                    });

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23});

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find('.s1 .view11').text()).toEqual("1.1");
                    j.expect($el.find('.s1 .view12').text()).toEqual("1.2");
                    j.expect($el.find('.s2 .view21').text()).toEqual("2.1");
                    j.expect($el.find('.s2 .view22').text()).toEqual("2.2");

                });

            });

            j.describe("AttributeView", function () {
                j.it("should display and update an attribute value", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    point.extend(new views.AttributeView({
                        id: 'title',
                        tagName: 'h1',
                        attribute: 'title'
                    }));

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23, title: 'original title'});

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find("h1").text()).toEqual("original title");

                    recipe.set("title", "updated title");

                    j.expect($el.find("h1").text()).toEqual("updated title");

                });

                j.it("should be able to handle multiple attributes", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    point.extend(new views.AttributeView({
                        id: 'title',
                        tagName: 'h1',
                        attribute: ['title', 'subtitle']
                    }));

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23, title: 'original title', subtitle: 'subtitle'});

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find("h1").text()).toEqual("original title subtitle");

                    recipe.set("title", "updated title");

                    j.expect($el.find("h1").text()).toEqual("updated title subtitle");

                    recipe.set("subtitle", "updated subtitle");

                    j.expect($el.find("h1").text()).toEqual("updated title updated subtitle");

                });

                j.it("should allow a transformation function to be applied to values", function () {
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);
                    point.extend(new views.AttributeView({
                        id: 'title',
                        tagName: 'h1',
                        attribute: 'title',
                        transform: {
                            title: function (title) {
                                return "The great " + title;
                            }
                        }
                    }));

                    var View = point.createView();
                    var recipe = factory.create({folder: 12, id: 23, title: 'original title'});

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find("h1").text()).toEqual("The great original title");

                    recipe.set("title", "updated title");

                    j.expect($el.find("h1").text()).toEqual("The great updated title");
                });
            });
        }
    });



    return {};
});
