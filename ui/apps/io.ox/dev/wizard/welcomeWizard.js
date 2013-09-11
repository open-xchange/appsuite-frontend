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
	// It's a nice trick to start off with a static page, so the subsequent page can already start loading data
	// and initialize itself without the user having to wait around for that. Distract them with a nice welcome page!
	point.extend({
		id: 'welcomeMessage',
		index: 100,
		title: "Welcome to App Suite", // be sure to internationalize this
		draw: function (baton) {
			// A regular #draw message, that you may know and love from other extension points
			// Just append to 'this' to draw up what you need. One caveat though: Make sure to unlock the 'next' button
			// So this step can be finished

			// Some text. Note that you want to take some more care here, to make this look
			// good and make sense. We'll firmly stay in example land here and not make a fuss about looks
			// Make sure you do better than this, also, this needs to be internationalized with a gt() call!
			this.append($("<p>").text("Hi there, stranger! Welcome to OX App Suite, glad you made it. To make sure your experience with us is a pleasent one, let's set up some basics together!"));

			// Enable the next (or 'done', if this is the last page) button. 
			// You will have to call this once for every page, once every needed entry has been made.
			baton.buttons.enableNext();
		}
	});

	// Now let's actually ask for some user input. Let's say, we want to make sure the first and last name of the user is correct.
	point.extend({
		id: 'gender',
		index: 200,
		title: "Gender",
		draw: function (baton) {
			// Every method of a page is always called with a baton that is unique to every page instance, so 
			// we can set state information in it to our hearts content without bothering everyone else. 
			// The baton holds some interesting objects, though. 'wizard' is the instance of the wizard object, 'buttons', like above
			// can be used to enable or disable the next button. The wizard also has a pageInfo member object that we can use to store
			// data that is available to every subsequent page. Note though, that that tightly couples pages together, so use this with care!
			// We will use this for some fun, though.
			baton.form = {};

			this.append(
				$('<form>').append(
					$("<fieldset>").append(
						$('<label class="radio">').append(
							baton.form.male = $('<input type="radio" name="genderRadio" value="male">'),
							$.txt("Gentleman")
						),
						$('<label class="radio">').append(
							baton.form.female = $('<input type="radio" name="genderRadio" value="male">'),
							$.txt("Lady")
						),
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
			}
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
	})


	point.extend({
		id: 'completeUserInfo',
		index: 300,
		title: "Personal Information",
		load: function (baton) {
			// The load method is an optional method. It is called to load data that you need to set up the page
			// And it is called as soon as the page is the 'next' or 'previous' page of the active page, so you can start loading
			// even before the page shows up. Return a deferred to let the wizard framework know when you're done. 
			

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
					// Let's turn this into a Backbone Model, so we can use this in our form later
					baton.user = new Model(user);
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
			// getting to know the user. Personally, I think software would do well to be more flirtatious, but
			// I'm just a lonely developer, so YMMV
			if (baton.wizard.pageData.gender && baton.wizard.pageData.gender === 'male') {
				this.append($("<p>").text("So, who are you, handsome?"));				
			} else if (baton.wizard.pageData.gender && baton.wizard.pageData.gender === 'female') {
				this.append($("<p>").text("So, who are you, beautiful?"));
			} else {
				this.append($("<p>").text("So, who are you, stranger?"));				
			}

			// Now, on to the serious business
			var mini = baton.libraries.mini;

			// TODO
		}
	});


	return {
		getInstance: function () {
			// Create a new instance of the wizard. Note that the id of the wizard determines the extension point
			// that pages have to extend
			return wizards.getWizard({id: 'io.ox/dev/wizard/welcomeWizard'});
		}
	};
});