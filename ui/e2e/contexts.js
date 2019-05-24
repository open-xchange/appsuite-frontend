const contexts = require('@open-xchange/codecept-helper/src/contexts'),
    helper = new (require('@open-xchange/codecept-helper').helper)(),
    wrappedCreate = contexts.create;

contexts.create = function createContext(ctxt) {
    return wrappedCreate.apply(this, [ctxt])
        .then(context => {
            context.hasQuota = async function (maxQuota) {
                this.ctxdata.maxQuota = maxQuota;
                await helper.executeSoapRequest('OXContextService', 'change', {
                    ctx: { id: this.id, maxQuota },
                    auth: this.auth
                });
                return this;
            };
            return context;
        });
};

module.exports = contexts;
