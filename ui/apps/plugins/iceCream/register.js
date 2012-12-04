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

define('plugins/iceCream/register', ['io.ox/core/extensions'], function (ext) {
	'use strict';

	require("themes").set("iceCream");

    var iceTypes = [
        ['chocolate', '#6D4C2C'],
        ['vanilla', '#CB1'],
        ['lemon', '#AA0'],
        ['strawberry', '#F20']
    ];
    

    function randomIce() {
        var index = Math.floor(Math.random() * iceTypes.length);
        var pair = iceTypes[index];

        return $('<span>').text(pair[0]).css({color: pair[1]});
    }

	// Append logo to the right side

	$('body').append($('<div class="ice-cream-logo">').css({
		width: 200,
		height: 200,
		right: 0,
		top: 40,
		position: 'absolute',
		backgroundImage: "url(" + ox.base + "/apps/themes/iceCream/logo.png)"
	}));


	// Insta-Ice

	$('body').append($('<div class="insta-ice">').css({
		width: 200,
		height: 200,
		right: 0,
		top: 240,
		position: 'absolute',
        cursor: 'pointer',
        zIndex: 1000
	}).on('click', function () {
		require(['io.ox/core/tk/dialogs', 'io.ox/core/notifications'], function (dialogs, notifications) {
			
            var $input;
            new dialogs.ModalDialog()
            .append(
                $("<h4>").text("Which ice cream do you want?")
            ).append(
                $input = $('<input type="text">')
            ).addPrimaryButton('get', "Get it!")
             .addButton('cancel', 'Cancel')
             .show(function () {
                $input.select();
            })
             .done(function (action) {
                if (action === 'cancel') {
                    return;
                }
                notifications.yell('success', 'The ice delivery specialist is dispatched immediately to fetch your ' + $input.val() + ' ice cream!');
            });

		});
	}).append($('<img src = "' + ox.base + '/apps/plugins/iceCream/icecream_large.png">')));
    
    function dispatch(e) {
        e.preventDefault();
        require(["io.ox/core/notifications"], function (notifications) {
            notifications.yell('success', 'Your ice delivery specialist has been notified about your ice cream order!');
        });
    }

	// Calendar Detail View
    // draw details
    ext.point("io.ox/calendar/detail").extend({
        index: 700,
        id: "details",
        draw: function (data) {
            var node = $("<div>")
                .append($("<div>").addClass("io-ox-label").text('Social Ice Cream'))
                .appendTo(this);
            node.append(
                $('<div class="alert alert-success">').append($('<img src = "' + ox.base + '/apps/plugins/iceCream/icecream.png">'), "Whenever you meet this group of people, you seem to prefer ", randomIce(), ". ", $('<a href="#">').text('Click here').on('click', dispatch), ' to make sure it arrives on time for the end of this meeting.')
            );
        }
    });

	// File Detail View
    require(['io.ox/core/extPatterns/links'], function (links) {
        new links.Action('io.ox/files/actions/iceCream/post', {
            id: 'post',
            action: function (baton) {
                require(["io.ox/core/notifications"], function (notifications) {
                    notifications.yell('success', 'The file has been posted to your Ice Cream Buddies!');
                });
            }
        });

        ext.point('io.ox/files/links/inline').extend(new links.Link({
            id: "icePost",
            index: 9,
            prio: 'hi',
            label: "Post to your Ice Buddies",
            ref: "io.ox/files/actions/iceCream/post"
        }));
    });

	// Mail Detail View

    ext.point('io.ox/mail/detail').extend({
        index: 199,
        id: 'ice-cream-coupon',
        draw: function (data) {
            this.append(
                $('<div class="alert alert-success">').append($('<img src = "' + ox.base + '/apps/plugins/iceCream/icecream.png">'), "Someone attached a coupon for ", randomIce(), " ice cream to this mail! ", $('<a href="#">').text('Click here').on('click', dispatch), ' to claim it.')
            );
        }
    });

    // Contacts

    ext.point("io.ox/contacts/detail").extend({
        index: 350,
        id: 'ice-cream',
        draw: function (baton) {
            this.append(
                $('<div class="alert alert-success">').append($('<img src = "' + ox.base + '/apps/plugins/iceCream/icecream.png">'), "This person's favorite ice cream is ", randomIce(), " ice cream! ", $('<a href="#">').text('Click here').on('click', dispatch), ' to bribe this person with a delicious treat!')
            );
                 
        }
    });
    

    /*
    ext.point("io.ox/portal/widget").extend({
        id: 'iceCream1',
        index: 301,
        title: 'Rate this ice cream!',
        load: function () {
            return $.when();
        },
        draw: function () {
            this.append(
                $('<form>').append(
                    $('<label>').text("Flavor"),
                    $('<input type="text">'),
                    $('<label>').text("Coldness"),
                    $('<input type="text">'),
                    $('<label>').text("Smushiness"),
                    $('<input type="text">'),
                    $('<br>'),
                    $('<button class="btn">').text("Submit").on('click', function (e) {
                        e.preventDefault();
                        require(['io.ox/core/notifications'], function (n) {
                            n.yell('success', 'The social ice cream experience design team has been notified. Thanks for making our ice cream better. Three credit cones have been added to your account.');
                        });
                    })
                )
            );
            return $.when();
        },
        preview: function () {
            return $('<div>').append('You last had ', randomIce(), '. Please rate your ice cream experience.');
        }
    });
    


	// Portal Plugin 2

    ext.point("io.ox/portal/widget").extend({
        id: 'iceCream2',
        index: 302,
        title: 'Recommended ice cream for you',
        load: function () {
            return $.when();
        },
        draw: function () {
            this.append(
                $('<img src = "' + ox.base + '/apps/plugins/iceCream/icecream_large.png">'),
                $('<button class="btn btn-primary">').text('Get me the ice cream!').on('click', dispatch)
            );
            return $.when();
        },
        preview: function () {
            return $('<div>').append('Based on your past ratings, the ice cream experience team suggests you try ', randomIce(), ' ice cream.');
        }
    });
    */
});