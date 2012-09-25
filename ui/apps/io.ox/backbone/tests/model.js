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
define("io.ox/backbone/tests/model", ["io.ox/core/extensions", "io.ox/backbone/modelFactory", "io.ox/backbone/tests/recipeApi"], function (ext, ModelFactory, api) {
    "use strict";
    // Firstly let's define a factory for use in our tests
    var ref = 'io.ox/lessons/recipes/model/' + new Date().getTime(); // Again namespaced fun
    
    var factory = new ModelFactory({
        ref: ref,
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
    
    ext.point("test/suite").extend({
        id: 'backbone-model',
        index: 100,
        test: function (j, utils) {
            j.describe("ModelFactory CRUD", function () {
                
                j.it("should be able to load entries", function () {
                    var recipe = null;
                    j.spyOn(api, 'get').andCallThrough();

                    utils.waitsFor(factory.get({folder: 12, id: 1}).done(function (loaded) {
                        recipe = loaded;
                    }));
                    
                    j.runs(function () {
                        j.expect(recipe).not.toBe(null);
                        j.expect(recipe.get('folder_id')).toEqual(12);
                        j.expect(recipe.get('id')).toEqual(1);
                        
                        j.expect(api.get).toHaveBeenCalledWith({folder: 12, id: 1});
                    });
                    
                });
                
                j.it("should be able to list folders", function () {
                    var allInFolder = null;
                    
                    j.spyOn(api, 'getAll').andCallThrough();
                    
                    utils.waitsFor(factory.getAll({folder: 12}).done(function (loaded) {
                        allInFolder = loaded;
                    }));
                    
                    j.runs(function () {
                        j.expect(allInFolder.length).toEqual(3);
                        
                        j.expect(_(allInFolder).pluck("id")).toEqual([1, 2, 3]);
                        j.expect(api.getAll).toHaveBeenCalledWith({folder: 12});
                    });
                });
                
                j.it("should be able to bulk-load entries", function () {
                    var listed = null;
                    
                    j.spyOn(api, 'getList').andCallThrough();
                    
                    // Use realm as a cache-buster
                    utils.waitsFor(factory.realm(new Date().getTime()).getList([{id: 1, folder: 12}, {id: 3, folder: 12}]).done(function (loaded) {
                        listed = loaded;
                    }));
                    
                    j.runs(function () {
                        j.expect(listed.length).toEqual(2);
                        j.expect(_(listed).pluck("id")).toEqual([1, 3]);
                        j.expect(api.getList).toHaveBeenCalledWith([{id: 1, folder: 12}, {id: 3, folder: 12}]);
                    });
                });
                
                var testId = null;
                
                j.it("should be able to create entries", function () {
                    var newRecipe = factory.create({
                        title: "Test Recipe",
                        folder_id: 12
                    });
                    
                    j.spyOn(api, "create").andCallThrough();
                    
                    utils.waitsFor(newRecipe.save().done(function (response) {
                        testId = response.id;
                    }));
                
                    j.runs(function () {
                        j.expect(testId).not.toEqual(null);
                        
                        j.expect(api.create).toHaveBeenCalledWith({title: "Test Recipe", folder_id: 12});
                    });
                });

                j.it("should be able to update entries", function () {
                    j.expect(testId).toBeDefined();
                    j.expect(testId).not.toEqual(null);
                    
                    var updated = new utils.Done();
                    var reloadedEntry = null;
                    
                    j.spyOn(api, 'update').andCallThrough();
                    
                    factory.get({id: testId, folder: 12}).done(function (loaded) {
                        loaded.set('title', 'New Title');
                        loaded.save().done(updated.yep);
                    });
                    
                    j.waitsFor(updated, 'timeout', 5000);
                    
                    utils.waitsFor(factory.get({id: testId, folder: 12}).done(function (loaded) {
                        reloadedEntry = loaded;
                    }));
                    
                    j.runs(function () {
                        j.expect(reloadedEntry.get("title")).toEqual("New Title");
                    
                        j.expect(api.update).toHaveBeenCalledWith({id: testId, folder: 12, title: 'New Title'});
                    });
                });

                j.it("should be able to reload entries", function () {
                    j.expect(testId).toBeDefined();
                    j.expect(testId).not.toEqual(null);
                    
                    j.spyOn(api, 'get').andCallThrough();
                    
                    var originalTitle = null;
                    var recipe = null;
                    
                    var updated = new utils.Done();
                    
                    factory.get({id: testId, folder: 12}).done(function (loaded) {
                        recipe = loaded;
                        originalTitle = loaded.get("title");
                        loaded.set('title', 'Supercalifragilisticexpialidocious');
                        loaded.fetch().done(updated.yep);
                    });
                    j.waitsFor(updated, 'updated', 5000);
                    
                    j.runs(function () {
                        j.expect(recipe.get('title')).toEqual(originalTitle);
                        
                        j.expect(api.get).toHaveBeenCalledWith({id: testId, folder: 12});
                        j.expect(api.get).toHaveBeenCalledWith({id: testId, folder: 12});
                    });
                    
                    
                });
                
                j.it("should be able to delete entries", function () {
                    j.expect(testId).toBeDefined();
                    j.expect(testId).not.toEqual(null);
                    
                    j.spyOn(api, 'remove').andCallThrough();
                    
                    var updated = new utils.Done();
                    
                    factory.get({id: testId, folder: 12}).done(function (loaded) {
                        loaded.destroy().done(updated.yep);
                    });
                    j.waitsFor(updated, 'updated', 5000);
                    
                    j.runs(function () {
                        j.expect(api.remove).toHaveBeenCalledWith({id: testId, folder: 12});
                    });
                });
            });
            
            j.describe("ModelFactory validation", function () {
                
                j.it("should run an extension for each attribute", function () {
                    
                    // Create an extension that forces servings to be even
                    ext.point(ref + '/validation/servings').extend({
                        id: 'servings-must-be-even',
                        validate: function (value) {
                            if (!_.isNumber(value)) {
                                value = parseInt(value, 10);
                            }
                            if (value % 2 === 1) {
                                return "Servings must be even";
                            }
                        }
                    });
                    
                    // violate the rule
                    j.expect(factory.create().set("servings", 1).isValid()).toEqual(false);
                    j.expect(factory.create().set("servings", 2).get("servings")).toEqual(2);
                });
                
                j.it("should trigger 'invalid' and 'invalid:attribute' events", function () {
                    var model = factory.create();
                    var invalidTriggered, invalidServingsTriggered;
                    
                    model.on("invalid", function () {
                        invalidTriggered = true;
                    });
                    
                    model.on("invalid:servings", function () {
                        invalidServingsTriggered = true;
                    });
                    
                    model.set("servings", 1);
                    
                    j.expect(invalidTriggered).toEqual(true);
                    j.expect(invalidServingsTriggered).toEqual(true);
                    j.expect(model.invalidAttributes()).toEqual(['servings']);
                    
                });
                
                j.it("should run general validation extensions after attribute extensions", function () {
                    var validations = [];
                    
                    ext.point(ref + '/validation/servings').replace({
                        id: 'servings-must-be-even',
                        validate: function (value) {
                            validations.push('servings-must-be-even');
                            if (!_.isNumber(value)) {
                                value = parseInt(value, 10);
                            }
                            if (value % 2 === 1) {
                                return "Servings must be even";
                            }
                        }
                    });
                    
                    ext.point(ref + '/validation').extend({
                        id: 'general',
                        validate: function () {
                            validations.push('general');
                        }
                    });
                    
                    factory.create().set('servings', 2);
                    
                    j.expect(validations).toEqual(['servings-must-be-even', 'general']);
                });
                
                j.it("should trigger a 'valid' event if the model becomes valid again", function () {
                    var model = factory.create();
                    var invalidTriggered, validTriggered, validServingsTriggered;
                    
                    model.on("invalid", function () {
                        invalidTriggered = true;
                    });
                    
                    model.on("valid", function () {
                        validTriggered = true;
                    });
                    model.on("valid:servings", function () {
                        validServingsTriggered = true;
                    });
                    
                    model.set("servings", 2);
                    model.set("servings", 1);
                    model.set("servings", 2);
                    
                    j.expect(model.get("servings")).toEqual(2);
                    j.expect(invalidTriggered).toEqual(true);
                    j.expect(validTriggered).toEqual(true);
                    j.expect(validServingsTriggered).toEqual(true);
                });
                
                j.it("should try to reapply previously invalid attribute changes to see if they work now", function () {
                    ext.point(ref + '/validation/servings').disable('servings-must-be-even');
                    ext.point(ref + '/validation').extend({
                        id: 'servings-and-title',
                        validate: function (attributes) {
                            // Here is our funky business rule
                            // servings must be even, unless the title starts with 'The great'
                            
                            if (attributes.servings) {
                                if (attributes.title && /^The great/.test(attributes.title)) {
                                    return; // Yeah, we're happy with that
                                }
                                if (attributes.servings % 2 === 1) {
                                    this.add('servings', "Servings must be equal, unless the title starts with 'The great'");
                                }
                            }
                        }
                    });
                    
                    var model = factory.create();
                    
                    model.set('servings', 2); // Valid
                    j.expect(model.set('servings', 1).isValid()).toEqual(false); // Invalid
                    model.set('title', 'The great pancakes of yesteryear'); // Now servings of 1 are valid also
                    
                    j.expect(model.get('servings')).toEqual(1);
                    j.expect(model.get('title')).toEqual('The great pancakes of yesteryear');
                });
            });
            
            j.describe("ModelFactory realms", function () {
                
            });
            
            j.describe("ModelFactory change detection", function () {
                
            });
        }
    });
    
    return {};
});