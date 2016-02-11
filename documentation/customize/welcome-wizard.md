---
title: Welcome Wizards
description: Build a simple welcome wizard that tries to complete the users information
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Writing_a_wizard
---

# Writing a wizard

## A simple welcome wizzard


```javascript
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
 * @author Francisco Laguna <...>
 */
 
/**
* In this example we will build a simple welcome wizard, that tries to complete the users information.
*/
define('io.ox/dev/wizard/welcomeWizard', ['io.ox/core/extensions', 'io.ox/core/wizard/registry'], function (ext, wizards) {
    'use strict';
    // Grab the extension point for the wizard
    // Every page in the wizard will be an extension to this extension point
    var point = ext.point("io.ox/dev/wizard/welcomeWizard");
 
    // We will build a few pages here to showcase how you can use the framework.
    // Firstly, the simplest case, just a static page
    // It's a nice trick to start off with a static page, so the subsequent page 
    // can already start loading data
    // and initialize itself without the user having to wait around for that. 
    // Distract them with a nice welcome page!
    point.extend({
        id: 'welcomeMessage',
        index: 100,
        title: "Welcome to App Suite", // be sure to internationalize this
        draw: function (baton) {
            // A regular #draw method, that you may know and love from other extension points
            // Just append to 'this' to draw what you need. One caveat though: Make sure to 
            // unlock the 'next' button
            // so this step can be finished
 
            // Some text. Note that you want to take some more care here, to make this look
            // good and make sense. We'll firmly stay in example land here and not make a 
            // fuss about looks
            // Make sure you do better than this, also, this needs to be internationalized 
            // with a gt() call!
            this.append($("<p>").text("Hi there, stranger! Welcome to OX App Suite, glad you made it. To make sure your experience with us is a pleasant one, let's set up some basics together!"));
 
            // Enable the next (or 'done', if this is the last page) button.
            // You will have to call this once for every page, once every needed entry has been made.
            baton.buttons.enableNext();
        }
    });
 
    // Now let's actually ask for some user input. Let's start with the users gender.
    point.extend({
        id: 'gender',
        index: 200,
        title: "Gender",
        draw: function (baton) {
            // Every method of a page is always called with a baton that is unique to 
            // every page instance, so
            // we can set state information in it to our hearts content without 
            // bothering everyone else.
            // The baton holds some interesting objects, though. 'wizard' is the instance 
            // of the wizard object, 'buttons', like above
            // can be used to enable or disable the next button. The wizard also has a 
            // pageData member object that we can use to store
            // data that is available to every subsequent page. Note though, that that 
            // tightly couples pages together, so use this with care!
            // We will use this for some fun, though.
            baton.form = {};
 
            this.append(
                $('<p/>').text("Please pick one:"),
                $('<form>').append(
                    $("<fieldset>").append(
                        $('<label class="radio">').append(
                            baton.form.male = $('<input type="radio" name="genderRadio" value="male">'),
                            $.txt("Gentleman")
                        ),
                        $('<label class="radio">').append(
                            baton.form.female = $('<input type="radio" name="genderRadio" value="male">'),
                            $.txt("Lady")
                        )
                    )
                )
            );
 
            // We want to enable the navigation once the user picked his or her gender.
            // And we'll capture that logic in one method that we call everytime we have
            // reason to believe the state changed
            baton.helpers = {
                updateState: function () {
                    if (baton.form.male.attr("checked") === 'checked' || baton.form.female.attr("checked") === 'checked') {
                        // One of the two was picked, so enable the next button
                        baton.buttons.enableNext();
                    } else {
                        // No choice was made, so disable the button
                        baton.buttons.disableNext();
                    }
                }
            };
            baton.form.male.on('click', baton.helpers.updateState);
            baton.form.female.on('click', baton.helpers.updateState);
 
        },
 
        activate: function (baton) {
            // Whenever the page is entered, the activate method is called.
            // we just have to make sure the button state is correct
            baton.helpers.updateState();
        },
 
        finish: function (baton) {
            // When the page is left, the 'finish' method is called and we can do something
            // with the entered value, in this case we'll remember it in the wizards data section for inter-page stuff
 
            var gender = null;
            if (baton.form.male.attr("checked") === 'checked') {
                gender = 'male';
            } else if (baton.form.female.attr("checked") === 'checked') {
                gender = 'female';
            }
 
            baton.wizard.pageData.gender = gender;
        }
    });
 
    // Anything above a trivial form may benefit from using backbone model and view classes
    point.extend({
        id: 'completeUserInfo',
        index: 300,
        title: "Personal Information",
        load: function (baton) {
            // The load method is an optional method. It is called to load data that you 
            // need to set up the page
            // And it is called as soon as the page is the 'next' or 'previous' page of the 
            // active page, so you can start loading
            // even before the page shows up. Return a deferred to let the wizard framework 
            // know when you're done.
 
 
            // We will fetch the user data for our example.
            var def = $.Deferred();
 
            require(["io.ox/core/api/user", "io.ox/backbone/basicModel", "io.ox/backbone/mini-views"], function (userAPI, Model, mini) {
                // Alright, let's stick the APIs into our baton, we'll need these later
                // This is also a nice little trick for loading APIs in the wizard framework.
                baton.libraries = {
                    userAPI: userAPI,
                    mini: mini
                };
 
                // And let's load the current user
 
                userAPI.getCurrentUser().done(function (user) {
                    // Note, that this is a backbone model
                    // We could turn this into a model by instantiating a BasicModel, otherwise.
                    baton.user = user;
 
                    // We want to enable the next button on this page based on whether a first 
                    // an last name is set, so, let's listen for the change events on the user object
                    function updateButtonState() {
                        if (!_.isEmpty(user.get("first_name")) && !_.isEmpty(user.get("last_name"))) {
                            baton.buttons.enableNext();
                        } else {
                            baton.buttons.disableNext();
                        }
                    }
                    baton.user.on('change', updateButtonState);
 
                    updateButtonState();
 
                    // And we're done
                    def.resolve();
                }).fail(def.reject);
            });
 
            return def;
        },
 
        draw: function (baton) {
            // Now, for fun, let's try and build a backbone backed form
            // Depending on the complexity of the form, this is a good route to take
            // I would, however, also suggest to scour the appsuite source code for
            // reusable parts, as they will usually be internationalized, localized,
            // responsive to different devices and accessible. Depending on the use of this
            // wizard, you'll have to take care of these aspects yourself.
 
            // Firstly some fun, though. Why not have this wizard be flirtatious, since it's just
            // getting to know the user. Personally, I think software would do well to be more 
            // flirtatious, but I'm just a lonely developer, so YMMV
            if (baton.wizard.pageData.gender && baton.wizard.pageData.gender === 'male') {
                this.append($("<p>").text("So, who are you, handsome?"));
            } else if (baton.wizard.pageData.gender && baton.wizard.pageData.gender === 'female') {
                this.append($("<p>").text("So, who are you, beautiful?"));
            } else {
                this.append($("<p>").text("So, who are you, stranger?"));
            }
 
            // Now, on to the serious business
            var mini = baton.libraries.mini;
 
            this.append(
                $('<form class="form-horizontal" />').append(
                    $('<div class="control-group" />').append(
                        $('<label class="control-label" for="first_name" />').text("First Name"), // Don't forget i18n in your own wizard!
                        $('<div class="controls" />').append(
                            new mini.InputView({name: 'first_name', model: baton.user}).render().$el
                        )
                    ),
                    $('<div class="control-group" />').append(
                        $('<label class="control-label" for="last_name" />').text("Last Name"), // Don't forget i18n in your own wizard!
                        $('<div class="controls" />').append(
                            new mini.InputView({name: 'last_name', model: baton.user}).render().$el
                        )
                    )
                )
            );
 
        },
 
        finish: function (baton) {
            // Depending on the capabilities of the model, this could be more complicated
            // you might have to interrogate the model for the #changedAttributes
            // and call an API method. In any case, finish may return a deferred object
            // to denote the state of the save operation
            return baton.user.save();
        }
    });
 
    // If you want to provide your own navigation controls in the page
    // (useful for a simple choice), you can get rid of the default buttons
    // of the dialog, but have to then call baton.wizard.next or baton.wizard.prev 
    // or baton.wizard.goToPage(pageNumberOrID) manually.
 
    point.extend({
        id: 'spamMe',
        index: 400,
        title: "Special Offers",
        hideButtons: 'true',
        draw: function (baton) {
            this.append(
                $('<div />').text("Would you like to be informed of special offers from time to time?"),
                "<br />",
                $('<div />').append(
                    $('<button class="btn btn-primary" />').text("Yes! Send me information about special offers").on("click", function () {
                        baton.specialOffers = true;
                        baton.buttons.enableNext();
                        baton.wizard.next();
                    })
                ),
                "<br />",
                $('<div />').append(
                    $('<button class="btn" />').text("No, thanks").on("click", function () {
                        baton.specialOffers = false;
                        baton.buttons.enableNext();
                        baton.wizard.next();
                    })
                )
            );
        },
 
        finish: function (baton) {
            // Save baton.specialOffers preference
            console.log(baton.specialOffers);
        }
    });
 
    point.extend({
        id: 'byebye',
        index: 500,
        title: "Thank you!",
        draw: function (baton) {
            this.append($("<p>").text("Thank you for completing our welcome wizard! Be sure to tell us what you like and what we could improve in App Suite!"));
            baton.buttons.enableNext();
        }
    });
 
    // To enable the wizard to run upon startup, you have to use the extension system to add a new 
    // stage to the boot process.
    // Use a manifest.json to extend the core/main file:
    // {
    //      namespace: 'io.ox/core/main'
    // }
 
    // Then, in the plugins file, define a new stage that runs the wizard after the curtain has 
    // been drawn back:
 
    /*
    define('...', ['io.ox/core/extPatterns/stage'], function (Stage) {
    'use strict';
 
        new Stage('io.ox/core/stages', {
            id: 'welcome-wizard',
            after: 'curtain',
            run: function (baton) {
                var def = $.Deferred();
                //TODO: Check a JSLob if the wizard needs to be run, or has been cleared successfully
                // If it has to be run, require the wizards source file and trigger the wizard
                require(["io.ox/dev/wizard/welcomeWizard"], function (w) {
                    w.getInstance().start().done(function () {
                        //TODO: Mark this wizard as passed, so as not to start it again
                        // Resolve the deferred, so the next stage can start
                        def.resolve();
                    }).fail(def.reject);
                });
 
                return def;
            }
        });
 
 
    });
 
    */
    return {
        getInstance: function () {
            // Create a new instance of the wizard. Note that the id of the wizard determines 
            // the extension point
            // that pages have to extend
            return wizards.getWizard({id: 'io.ox/dev/wizard/welcomeWizard', closeable: true});
        }
    };
})
```


