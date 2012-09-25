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
                    j.expect("TODO: Implement me").toEqual(null);
                });
                
                                
            });
            
            j.describe("ModelFactory realms", function () {
                
            });
            
            j.describe("ModelFactory validation", function () {
                
            });
            
            j.describe("ModelFactory change detection", function () {
                
            });
        }
    });
    
    return {};
});