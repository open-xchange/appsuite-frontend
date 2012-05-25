// NOJSHINT


// adds a new available option
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/shownas').extend({
        id: 'awesome',
        draw: function () {
            this.append($('<option>').val(42).text('wtf awesome'));
        }
    });
});

// just disables the description
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/section').disable('description');
});






// now disabling startdate and remove the corresponding binding
// so its save to edit the rest except the start-date (just a unuseful show case :))
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/startdates').disable('date');
    ext.point('io.ox/calendar/edit/startdates').disable('time');

    ext.point('io.ox/calendar/edit/bindings/common').extend({
        id: 'removestartdate',
        index: 100,
        modify: function (options) {
            delete options.bindings.start_date;
        }
    });
});


// add complete new section
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/section').extend({
        id: 'newawesomesection',
        index: 1, // on top?
        draw: function (options) {
            this.append(
                $('<div class="control-group">' +
                  '<label class="control-label" for="prependedInput">Enter Twitter-Handle for this Event</label>' +
                  '<div class="controls">' +
                  '<div class="input-prepend">' +
                  '<span class="add-on">@</span><input class="span2" id="prependedInput" size="16" type="text">' +
                  '</div>' +
                  '<p class="help-block">Heres some help text</p>' +
                  '</div>' +
                  '</div>'
                  )
            );
            return this;
        }
    });
});



require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/head').extend({
        index: 10000,
        id: 'location2',
        draw: function () {
            this.append(
                $('<input>', {type: 'text'})
                  .addClass('discreet location')
                  .val('Look what happens, every Event is now in Olpe-City!')
            );
        }
    });
});

require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/head').extend({
        index: 10000,
        id: 'location2',
        draw: function () {
            this.append(
                $('<div class="control-group">' +
                  '<label class="control-label" for="prependedInput">Enter Twitter-Handle for this Event</label>' +
                  '<div class="controls">' +
                  '<div class="input-prepend">' +
                  '<span class="add-on">@</span><input class="span2" id="prependedInput" size="16" type="text">' +
                  '</div>' +
                  '<p class="help-block">Heres some help text</p>' +
                  '</div>' +
                  '</div>'
                  )
            );
        }
    });
});






// not possible yet
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/head').replace({
        id: 'location',
        draw: function () {
            this.append(
                $('<input>', {type: 'text'})
                  .addClass('discreet location')
                  .text('Look what happens, every Event is now in Olpe-City!')
            );
        }
    });
});




