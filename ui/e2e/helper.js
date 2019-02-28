const Helper = require('@open-xchange/codecept-helper').helper,
    axe = require('axe-core');

function assertElementExists(res, locator, prefixMessage = 'Element', postfixMessage = 'was not found by text|CSS|XPath') {
    if (!res || res.length === 0) {
        if (typeof locator === 'object') locator = locator.toString();
        throw new Error(`${prefixMessage} "${locator}" ${postfixMessage}`);
    }
}

const { util } = require('@open-xchange/codecept-helper');
const fs = require('fs');
const FormData = require('form-data');
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
    async createContact(contact, options) {
        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.put('/appsuite/api/contacts', contact, {
            params: {
                action: 'new',
                session: session
            }
        });
    }
    async getDefaultFolder(module, options) {
        const { httpClient, session } = await util.getSessionForUser(options);
        const response = await httpClient.put('/appsuite/api/jslob', ['io.ox/core'], {
            params: {
                action: 'list',
                session: session
            }
        });
        //Debug
        //console.log(response.data.data[0].tree)
        return response.data.data[0].tree.folder[module];
    }

    async importMail(options, folder, path) {
        let form = new FormData();
        form.append('file', fs.createReadStream(path));

        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.post('/appsuite/api/mail', form, {
            params: {
                action: 'import',
                session: session,
                folder: folder,
                force: true
            },
            headers: form.getHeaders()
        });
    }
    async importContact(options, folder, path) {
        let form = new FormData();
        form.append('file', fs.createReadStream(path));

        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.post('/appsuite/api/import', form, {
            params: {
                action: 'VCARD',
                session: session,
                ignoreUIDs: '',
                folder: folder
            },
            headers: form.getHeaders()
        });
    }

    async addAttachment(options, filepath, modulo, folder, id) {
        //The module type of the object: 1 (appointment), 4 (task), 7 (contact), 137 (infostore).
        let form = new FormData();
        form.append('json_0', JSON.stringify({ module: modulo, attached: id, folder: folder }));
        form.append('file_0', fs.createReadStream(filepath));

        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.post('/appsuite/api/attachment', form, {
            params: {
                action: 'attach',
                session: session,
                force_json_response: true
            },
            headers: form.getHeaders()
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

    // This needs to be a helper, as actors are too verbose in this case
    async grabAxeReport(context, options) {
        let wdio = this.helpers['WebDriver'],
            browser = wdio.browser;
        if (typeof options === 'undefined') options = {};
        if (typeof context === 'undefined') context = '';
        const report = await browser.executeAsync(function (axeSource, context, options, done) {
            if (typeof axe === 'undefined') {
                // eslint-disable-next-line no-eval
                window.eval(axeSource);
            }
            // Arity needs to be correct here so we need to compact arguments
            window.axe.run.apply(this, _.compact([context || $('html'), options])).then(function (report) {
                try {
                    var nodes = [];
                    for (const violation of report.violations) {
                        for (const node of violation.nodes) {
                            nodes.push(node.target);
                            for (const combinedNodes of [node.all, node.any, node.none]) {
                                if (!_.isEmpty(combinedNodes)) {
                                    for (const any of combinedNodes) {
                                        for (const relatedNode of any.relatedNodes) {
                                            nodes.push(relatedNode.target);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    $(nodes.join(',')).css('border', '2px solid red');
                } catch (err) {
                    done(err.message);
                }
                done(report);
            });
        }, axe.source, context, options);
        if (typeof report === 'string') throw report;
        return report;
    }
    async getContact(options, first_name, last_name) {
        const { httpClient, session } = await util.getSessionForUser(options);
        console.log(session);
        let test = { first_name: first_name, last_name: last_name };
        const response = await httpClient.put('/appsuite/api/contacts', test, {
            params: {
                action: 'search',
                session: session,
                columns: '1,20'
            }

        });
        //Debug
        return response.data.data.map(function (data) {
            return { id: data[0], folder: data[1] };
        });
    }
    async createFolder(folder, id, options) {
        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.put('/appsuite/api/folders', folder, {
            params: {
                action: 'new',
                autorename: true,
                folder_id: id,
                session: session,
                tree: 1
            }
        });
    }
}

module.exports = MyHelper;
