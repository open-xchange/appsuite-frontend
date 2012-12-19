_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr, selector) {
        view.$('[' + selector + '~=' + attr + ']').closest('.control-group').removeClass('error');
        view.$('[' + selector + '~=' + attr + ']').closest('.control-group').find('.errortext').remove();

    },
    invalid: function (view, attr, error, selector) {
        view.$('[' + selector + '~=' + attr + ']').closest('.control-group').addClass('error');

        //clean up first
        view.$('[' + selector + '~=' + attr + ']').closest('.control-group').find('.errortext').remove();
        view.$('[' + selector + '~=' + attr + ']').closest('.control-group').append(
            $('<span>')
                .addClass('help-inline errortext')
                .text(error)
        );
    }
});

_.extend(Backbone.Validation.validators, {
    greaterThan: function (value, attr, greaterThan, model, computed) {
        if (value < computed[greaterThan]) {
            return 'error';
        }
    },
    smallerThan: function (value, attr, smallerThan, model, computed) {
        if (value > computed[smallerThan]) {
            return 'error';
        }
    }
});
