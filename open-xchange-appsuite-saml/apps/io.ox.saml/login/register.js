define.async('io.ox.saml/login/register', ['io.ox/core/extensions', 'io.ox.saml/handlers'], function (ext) {
	var def = $.Deferred();
    if (ox.serverConfig.samlLogin) {
    	$.get(ox.apiRoot + '/saml/init?flow=login').done(function (data) {
			var baton = new ext.Baton({data: data});
		    ext.point('io.ox.saml/login').invoke('handle', baton, baton);
		}).fail(def.reject);
		return def; // Never resolve, so the login page doesn't get drawn.    	
    } else {
    	def.resolve({});
    }
    return $.when();
});
