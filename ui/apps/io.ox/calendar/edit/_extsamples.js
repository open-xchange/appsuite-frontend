// NOJSHINT


// possible
require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/shownas').extend({
        id: 'awesome',
        draw: function () {
            this.append($('<option>').text('wtf awesome'));
        }
    });
});


require(['io.ox/core/extensions'], function (ext) {
    ext.point('io.ox/calendar/edit/section').disable('description');
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




