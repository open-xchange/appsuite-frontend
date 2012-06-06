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
