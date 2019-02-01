const Helper = require('@open-xchange/codecept-helper').helper;

function assertElementExists(res, locator, prefixMessage = 'Element', postfixMessage = 'was not found by text|CSS|XPath') {
    if (!res || res.length === 0) {
        if (typeof locator === 'object') locator = locator.toString();
        throw new Error(`${prefixMessage} "${locator}" ${postfixMessage}`);
    }
}
class MyHelper extends Helper {

    // helper to create a fresh contact including an attachment with evil filename
    createContactWithEvilAttachment() {
        let wdio = this.helpers['WebDriver'],
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

    // will hopefully be removed when codecept 2.0 works as expected
    async grabHTMlFrom2(locator) {

        let wdio = this.helpers['WebDriver'];

        const elems = await wdio._locate(locator, true);
        assertElementExists(elems, locator);
        const html = Promise.all(elems.map(async elem => elem.getHTML()));
        this.debugSection('Grab', html);
        return html;

    }
}

module.exports = MyHelper;
