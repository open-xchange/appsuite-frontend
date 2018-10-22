const Helper = require('@open-xchange/codecept-helper').helper;
class MyHelper extends Helper {

    // helper to create a fresh contact including an attachment with evil filename
    createContactWithEvilAttachment() {
        let wdio = this.helpers['WebDriverIO'],
            browser = wdio.browser;

        browser.executeAsync((done) => {
            require(['io.ox/contacts/api', 'io.ox/core/http', 'io.ox/core/api/attachment'], function (api, http, attachAPI) {
                // create contact
                api.create({
                    folder_id: ox.rampup.jslobs['io.ox/core'].tree.folder.contacts,
                    first_name: 'Evil',
                    last_name: 'Knivel'
                }).then(function (contact) {
                    if (!contact || contact.error) done();

                    var form = new FormData();
                    // create malicious filename
                    form.append('file_0', new File([0xFF], '><img src=x onerror=alert(123)>', { type: 'text/plain' }));
                    form.append('json_0', JSON.stringify({ module: 7, attached: contact.id, folder: contact.folder_id }));

                    // attach file to new contact
                    http.UPLOAD({
                        module: 'attachment',
                        params: {
                            action: 'attach',
                            force_json_response: true
                        },
                        data: form,
                        fixPost: true
                    }).done(function () {

                        attachAPI.trigger('attach', { module: 'contacts', id: contact.id, folder_id: contact.folder_id });
                        api.trigger('refresh.all:import');
                        done();
                    });
                });
            });
        });

    }
}

module.exports = MyHelper;
