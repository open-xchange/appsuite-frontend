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
define("io.ox/backbone/tests/forms", ["io.ox/core/extensions", "io.ox/backbone/modelFactory", "io.ox/backbone/views", "io.ox/backbone/forms", "io.ox/backbone/tests/recipeApi"], function (ext, ModelFactory, views, forms, api) {
    "use strict";

    var ref = 'io.ox/lessons/recipes/model/' + _.now(); // Again namespaced fun

    var factory = new ModelFactory({
        ref: ref,
        api: api
    });

    ext.point("test/suite").extend({
        id: 'backbone-forms',
        index: 100,
        test: function (j, utils) {
            j.describe("ErrorAlerts", function () {
                j.it("should show a generic error message", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ErrorAlert({
                        id: 'error-alert'
                    }));

                    // Draw the models state
                    var recipe = factory.create();
                    var View = point.createView();
                    var $el = new View({model: recipe}).render().$el;

                    // Simulate a backendError
                    recipe.trigger("backendError", {error: 'No connection to database'});

                    // Expect the error message to be shown
                    j.expect($el.find(".error-alerts .alert").length).not.toEqual(0);

                });

                j.it("should allow users to format an error", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ErrorAlert({
                        id: 'error-alert',
                        formatError: function (response) {
                            return "Something went very wrong here: " + response.error;
                        }
                    }));

                    // Draw the models state
                    var recipe = factory.create();
                    var View = point.createView();
                    var $el = new View({model: recipe}).render().$el;

                    // Simulate a backendError
                    recipe.trigger("backendError", {error: 'No connection to database'});

                    // Expect the error message to be shown
                    j.expect($el.find(".error-alerts .alert").length).not.toEqual(0);
                    j.expect($el.find(".error-alerts .alert").text()).toMatch(/.*?No connection to database.*/);
                });
            });

            j.describe("ControlGroup", function () {

                j.it("should draw a control conforming to bootstraps horizontal-form conventions", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;

                    // First the structure
                    j.expect($el.find(".control-group").length).toEqual(1);
                    j.expect($el.find(".control-group label.control-label").length).toEqual(1);
                    j.expect($el.find(".control-group .controls").length).toEqual(1);
                    j.expect($el.find(".control-group .controls input[type=text]").length).toEqual(1);


                    // Then the content
                    j.expect($el.find(".control-group label.control-label").text()).toEqual("Title");
                    j.expect($el.find(".control-group .controls input[type=text]").val()).toEqual("A glass of water");
                });

                j.it("should react to model changes", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find(".control-group .controls input[type=text]").val()).toEqual("A glass of water");

                    // Now change the model

                    recipe.set("title", "A glass of water á la niçoise");
                    j.expect($el.find(".control-group .controls input[type=text]").val()).toEqual("A glass of water á la niçoise");


                });

                j.it("should react to user input", function () {
                     // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $input = $el.find(".control-group .controls input[type=text]");

                    j.expect($input.val()).toEqual("A glass of water");

                    // Now change the input value and then trigger the 'change' event

                    $input.val("A glass of water á la niçoise");
                    $input.trigger("change");

                    j.expect(recipe.get("title")).toEqual("A glass of water á la niçoise");
                });

                j.it("should toggle between valid and invalid states according to the model events", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $controlGroup = $el.find(".control-group");

                    // Now let's trigger the invalid event for the title, and have the control group
                    // transition to the error state

                    recipe.trigger("invalid:title", ["The title is not french enough for real haute cuisine. Add the words 'á la niçoise', for example, to make it sound more sophisticated."]);

                    j.expect($controlGroup.is(".error")).toEqual(true);
                    j.expect($controlGroup.find(".controls .help-block.error").length).toEqual(1);
                    j.expect($controlGroup.find(".controls .help-block.error").text()).toMatch(/.*?The title is not french enough for real haute cuisine.*/);

                    // and declare it valid again forcing the
                    // control group out of the error state
                    recipe.trigger("valid:title");

                    j.expect($controlGroup.is(".error")).toEqual(false);
                    j.expect($controlGroup.find(".controls .help-block.error").length).toEqual(0);
                });

                j.it("should allow users to customize transfer of values between model and input", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">',
                        setValueInModel: function () {
                            this.model.set("title", this.nodes.element.val().toLowerCase());
                        },
                        setValueInElement: function () {
                            this.nodes.element.val(this.model.get("title").toUpperCase());
                        }
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $input = $el.find(".control-group .controls input[type=text]");

                    j.expect($input.val()).toEqual("A GLASS OF WATER");

                    // Now change the input value and then trigger the 'change' event

                    $input.val("A COLD GLASS OF WATER");
                    $input.trigger("change");

                    j.expect(recipe.get("title")).toEqual("a cold glass of water");

                    recipe.set("title", "a warm glass of water");

                    j.expect($input.val()).toEqual("A WARM GLASS OF WATER");
                });

                j.it("should allow users to mark its attribute as only rarely showing up (i.e. once it has already been set)", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.ControlGroup({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">',
                        rare: true // Mark this attribute as 'rare', meaning the control group will only be visible, if a value is present on the model
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                    });


                    var View = point.createView({
                        tagName: 'form',                // For the elements to look good put them
                        className: 'form-horizontal'    // into a bootstrap horizontal form
                    });

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find(".control-group").css("display")).toEqual("none");

                    recipe.set("title", "A glass of water");
                    // Now since the value is set in the model, the control group should turn visible

                    j.expect($el.find(".control-group").css("display")).not.toEqual("none");

                });
            });

            j.describe("InputField", function () {
                j.it("should be synchronized with its attribute", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.InputField({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">' // Actually this is optional. Use it when you need a textarea, for example
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $input = $el.find("input[type=text]");

                    j.expect($input.val()).toEqual("A glass of water");

                    // Now change the model

                    recipe.set("title", "A glass of water á la niçoise");
                    j.expect($input.val()).toEqual("A glass of water á la niçoise");

                    // And now the input field

                    $input.val("A great glass of water");
                    $input.trigger("change");

                    j.expect(recipe.get("title")).toEqual("A great glass of water");
                });

                j.it("should switch to invalid/valid states according to model events", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.InputField({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        control: '<input type="text">', // Actually this is optional. Use it when you need a textarea, for example
                        className: 'find-me'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });


                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el.find(".find-me");

                    // Now trigger the invalid event and verify an error is shown

                    recipe.trigger("invalid:title", ["Not a nice title!"]);
                    j.expect($el.is(".error")).toEqual(true);
                    j.expect($el.find(".help-block").text()).toMatch(/.*?Not a nice title!.*/);

                    // Now trigger the valid event and verify the error state has ended

                    recipe.trigger("valid:title");

                    j.expect($el.is(".error")).toEqual(false);
                    j.expect($el.find(".help-block").length).toEqual(0);
                });

            });

            j.describe("CheckBoxField", function () {
                j.it("should be synchronized with its attribute", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.CheckBoxField({
                        id: 'favorite',
                        attribute: 'favorite',
                        label: 'Favorite'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water",
                        favorite: true
                    });


                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $input = $el.find("input[type=checkbox]");
                    j.expect($input.is(":checked")).toEqual(true);

                    // Now change the model

                    recipe.set("favorite", false);
                    j.expect($input.is(":checked")).toEqual(false);

                    // And now the input field
                    $input.attr({checked: true});
                    $input.trigger("change");

                    j.expect(recipe.get("favorite")).toEqual(true);

                    $input.attr({checked: false});
                    $input.trigger("change");

                    j.expect(recipe.get("favorite")).toEqual(false);
                });

                j.it("should switch to invalid/valid states according to model events", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.CheckBoxField({
                        id: 'favorite',
                        attribute: 'favorite',
                        label: 'Favorite',
                        className: 'find-me'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water",
                        favorite: true
                    });


                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el.find(".find-me");

                    // Now trigger the invalid event and verify an error is shown

                    recipe.trigger("invalid:favorite", ["It's not that nice, actually"]);
                    j.expect($el.is(".error")).toEqual(true);
                    j.expect($el.find(".help-block").text()).toMatch(/.*?It's not that nice, actually.*/);

                    // Now trigger the valid event and verify the error state has ended

                    recipe.trigger("valid:favorite");

                    j.expect($el.is(".error")).toEqual(false);
                    j.expect($el.find(".help-block").length).toEqual(0);
                });

            });

            j.describe("SelectField", function () {
                j.it("should be synchronized with its attribute", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.SelectBoxField({
                        id: 'difficulty',
                        attribute: 'difficulty',
                        label: 'Difficulty',
                        selectOptions: {
                            1: "Easy",
                            2: "Normal",
                            3: "Hard"
                        }
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water",
                        difficulty: 1
                    });


                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el;
                    var $input = $el.find("select");

                    // Verify the options
                    j.expect($input.find("option[value=1]").text()).toEqual("Easy");
                    j.expect($input.find("option[value=2]").text()).toEqual("Normal");
                    j.expect($input.find("option[value=3]").text()).toEqual("Hard");


                    j.expect($input.find("option[value=1]").is(":selected")).toEqual(true);

                    // Now change the model

                    recipe.set("difficulty", 2);
                    j.expect($input.find("option[value=1]").is(":selected")).toEqual(false);
                    j.expect($input.find("option[value=2]").is(":selected")).toEqual(true);

                    // And now the input field
                    $input.val(3);
                    $input.trigger("change");

                    j.expect(recipe.get("difficulty")).toEqual("3");

                });

                j.it("should switch to invalid/valid states according to model events", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.SelectBoxField({
                        id: 'difficulty',
                        attribute: 'difficulty',
                        label: 'Difficulty',
                        selectOptions: {
                            1: "Easy",
                            2: "Normal",
                            3: "Hard"
                        },
                        className: 'find-me'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water",
                        difficulty: 1
                    });

                    var View = point.createView({
                        tagName: 'form'
                    });

                    var $el = new View({model: recipe}).render().$el.find(".find-me");

                    // Now trigger the invalid event and verify an error is shown

                    recipe.trigger("invalid:difficulty", ["It's not that hard, actually"]);
                    j.expect($el.is(".error")).toEqual(true);
                    j.expect($el.find(".help-block").text()).toMatch(/.*?It's not that hard, actually.*/);

                    // Now trigger the valid event and verify the error state has ended

                    recipe.trigger("valid:difficulty");

                    j.expect($el.is(".error")).toEqual(false);
                    j.expect($el.find(".help-block").length).toEqual(0);
                });
            });

            j.describe("SectionLegend", function () {
                j.it("should display a section title", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    // Let's plug in our test instance
                    point.extend(new forms.SectionLegend({
                        id: 'legend',
                        label: 'Legend'
                    }));

                    var View = point.createView();

                    var $el = new View().render().$el;

                    j.expect($el.find("legend").length).toEqual(1);
                    j.expect($el.find("legend").text()).toEqual("Legend");

                });
            });

            j.describe("Section", function () {
                j.it("should provide an extension point for section entries", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    var sectionRef = ref + "/section1";
                    var sectionPoint = views.point(sectionRef);

                    // Let's plug in our test instance
                    point.extend(new forms.Section({
                        id: 'section1',
                        title: 'Section',
                        ref: sectionRef
                    }));

                    // And extend the section with a node

                    sectionPoint.extend(new forms.InputField({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title'
                    }));

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water",
                        difficulty: 1
                    });

                    var View = point.createView();

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find(".sectionheader a").text()).toEqual('Section');

                });

                j.it("should collapse completely if all entries are hidden", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    var sectionRef = ref + "/section1";
                    var sectionPoint = views.point(sectionRef);

                    // Let's plug in our test instance
                    point.extend(new forms.Section({
                        id: 'section1',
                        title: 'Section',
                        ref: sectionRef
                    }));

                    // And extend the section with a node

                    sectionPoint.extend(new forms.InputField({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        className: 'find-me'
                    }), {
                        hidden: true
                    });

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });

                    var View = point.createView();

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find(".sectionheader.collapsed a").text()).toEqual("Section");
                    j.expect($el.find(".find-me").closest('.form-horizontal').css("display")).toEqual("none");

                    // Unhide the section
                    $el.find(".sectionheader.collapsed a").click();
                    j.expect($el.find(".find-me").closest('.form-horizontal').css("display")).toEqual("block");

                });

                j.it("should add a more/less toggle if some extensions are hidden", function () {
                    // Firstly we need an extension point
                    var ref = "io.ox/backbone/tests/testView-" + _.now();
                    var point = views.point(ref);

                    var sectionRef = ref + "/section1";
                    var sectionPoint = views.point(sectionRef);

                    // Let's plug in our test instance
                    point.extend(new forms.Section({
                        id: 'section1',
                        title: 'Section',
                        ref: sectionRef
                    }));

                    // And extend the section with two nodes, one hidden, one not

                    sectionPoint.extend(new forms.InputField({
                        id: 'title',
                        attribute: 'title',
                        label: 'Title',
                        className: 'find-me-title'
                    }));

                    sectionPoint.extend(new forms.InputField({
                        id: 'description',
                        attribute: 'description',
                        label: 'Description',
                        className: 'find-me-description'
                    }), {
                        hidden: true
                    });

                    // Draw the models state
                    var recipe = factory.create({
                        title: "A glass of water"
                    });

                    var View = point.createView();

                    var $el = new View({model: recipe}).render().$el;

                    j.expect($el.find(".sectionheader a").text()).toEqual("Section");
                    j.expect($el.find(".find-me-description").parent().css("display")).toEqual("none");

                    // Unhide the section
                    $el.find(".sectionheader a").click();
                    j.expect($el.find(".find-me-description").parent().css("display")).toEqual("block");
                });
            });
        }
    });

    return {};
});
