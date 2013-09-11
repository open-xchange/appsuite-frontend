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

			
		}
	})


	point.extend({
		id: 'completeUserInfo',
		index: 200,
		title: "Personal Information",
		load: function (baton) {
			// The load method is an optional method. It is called to load data that you need to set up the page
			// And it is called as soon as the page is the 'next' or 'previous' page of the active page, so you can start loading
			// even before the page shows up. Return a deferred to let the wizard framework know when you're done. 
			

			// We will fetch the user data for our example. 
			var def = $.Deferred();

			require(["io.ox/core/api/user"], function (userAPI) {
				// Alright, let's stick the user API into our baton, we'll need this later
				baton.userAPI = userAPI;

				// And let's load the current user

				userAPI.getCurrentUser().done(function (user) {
					baton.user = user;

					// And we're done
					def.resolve();
				}).fail(def.reject);
			});

			return def;
		},

		draw: function (baton) {
			// Depending on the complexity of the form and its validation
			// you will want to use a form with backbone model and view classes
			// Also look for views in app suite you can maybe reuse for this, as they
			// will usually take care of responsive design and accessibility, that you might have
			// to tackle yourself otherwise.
			// Again, for the sake of this being an example, we'll take the easy route. 

			this.append($("<p>").text("So, who are you really, handsome?"));


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