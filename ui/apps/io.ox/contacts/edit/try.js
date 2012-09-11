define('io.ox/contacts/edit/try', ['io.ox/contacts/model', 'io.ox/contacts/edit/view-form', 'io.ox/core/tk/dialogs'], function (model, view, dialogs) {
    
    "use strict";
    
    var view = new view.ContactEditView({model: window.c = model.factory.create({'suffix': 'Hajj', 'spouse_name': 'Marianne'})});
    // create modal popup
    var pane = new dialogs.CreateDialog({ easyOut: true, async: true, width: 1000 });
    // header
    pane.header(
        $('<h3>').text('Edit contact')
    );
    // body
    pane.getBody()
        .append(view.render().$el);
    // footer
    pane.addPrimaryButton('save', 'Save')
        .addButton('cancel', 'Cancel');
    
    
    pane.show();
    
    return {};
    
    
});