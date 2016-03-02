---
title: Build Process
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Appserver
description: The _appserver_ acts as a reverse HTTP proxy for an existing OX App Suite installation and injects the tested JavaScript code in its replies.

---


__WARNING:__

These informations are only tested and validated for _DEBIAN_ installations! Please use a _DEBIAN_ virtual machine. Standalone version and using appserver with connect-based middleware should work in most cases, though.

# Installation

The core of _appserver_ is a Node.js script, so if your OS does not
provide a _nodejs_ package, you will have to install it manually, either
as a [3rd party
package](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
or directly from [nodejs.org](http://nodejs.org/).

Read more about how to install the tools for developing for OX App Suite
in the [ getting started
article](http://oxpedia.org/wiki/index.php?title=AppSuite:GettingStarted_7.6.0).

# Standalone use

In the simplest case of developing an app or a plugin, all that is
needed is the appserver npm package to be installed globally.

```bash
# on many Linux systems you need to run this using the
# sudo command. MacOS and Windows *should* work without

npm install -g appserver
```

Assuming you are in the top directory of your app's source code and _$builddir_ is not set:

```bash
appserver --server=https://www.ox.io/appsuite/ build
```

If there are no errors, you can point your browser to
[http://localhost:8337/appsuite/](http://localhost:8337/appsuite/) to test a version of OX App Suite which includes your app. 
Do not forget the _trailing slash_ in the URL.
Otherwise, the server sends a redirect from _/appsuite_ to _/appsuite/_ and includes its own absolute URL in the redirect.

You do not need to restart anything after re-building the app, a refresh of the browser page should be enough. 
If your code doesn’t show up after a refresh, our file cache mighgt not be up-to-date. Until this is fixed in appserver, you can append _&debug-js=true_ to your URL to disable the file cache.

# Usage with connect-based middleware

You can also integrate the collection of middleware classes shipped by appserver into any [connect](http://www.senchalabs.org/connect/)-based
middleware, such as
[grunt-contrib-connect](https://github.com/gruntjs/grunt-contrib-connect).

An example _Gruntfile.js_ can be found in the [appserver
repo](https://github.com/Open-Xchange-Frontend/appserver#example-usage-with-grunt-contrib-connect):

```javascript
    var appserver = require('appserver');
     grunt.config('connect', {
       server: {
           options: {
               port: 8337,
               base: ['build/'],
               livereload: true,
               middleware: function (connect, options, middlewares) {
                   var config = grunt.config().local.appserver;
                   if (config.server === ) {
                       grunt.log.error('Server not specified in grunt/local.conf.json');
                       grunt.log.writeln('Hint: If this is a new setup you may want to copy the file grunt/local.conf.defaults.json to grunt/local.conf.json and change its values according to your setup.');
                       grunt.fail.fatal('Please adjust your local.conf.json');
                   }
 
                   config.prefixes = (config.prefixes || []).concat([options.base, options.base + '/apps/']);
                   config.manifests = (config.manifests || []).concat(options.base + '/manifests/');
                   config = appserver.tools.unifyOptions(config);
 
                   middlewares.push(appserver.middleware.appsload(config));
                   middlewares.push(appserver.middleware.manifests(config));
                   middlewares.push(appserver.middleware.localfiles(config));
                   middlewares.push(appserver.middleware.proxy(config));
                   return middlewares;
               }
           }
       }
   });
```

# Use with Apache

For more complex cases involving testing your own build of the UI, or
apps which include static resources (e. g. images), a local web server
is required to serve static resources. 
The following examples use the Apache HTTP Server, but any web server which can act as a reverse HTTP proxy should work (assuming the configuration and _.htaccess_ files are adapted, of course).

First, make your app visible in Apache. 
The simplest way is to symlink the _[[AppSuite:UI build system#builddir|$builddir]]_ inside the document root. 
Assuming the app is in _/home/user/myapp_ and the web server's document root is _/var/www_:

```bash
sudo ln -s /home/user/myapp/build /var/www/myapp
```

In case Apache ignores the symlink, ensure that its configuration directive ``Directory /var/www/>`` contains "_Options FollowSymlinks_" or something to that effect.

Second, configure Apache to request from _appserver_ anything that it can't find locally. 
This configuration requires at least _mod_rewrite_, _mod_proxy_ and _mod_proxy_http_ to be enabled. 
Editing a file like _/etc/apache2/sites-enabled/000-default_ containing the proxy configuration, add the following inside an eventual _<VirtualHost>_ directive, but outside of any ``<Directory>`` directives:

```
RewriteEngine On
ProxyPreserveHost On

ProxyPassMatch ^/((appsuite|ajax|infostore|publications\
|realtime|servlet|usm-json|webservices)(/.*)?)$ \
http://localhost:8337/$1

RewriteCond %{DOCUMENT_ROOT}/myapp/$2 -f
RewriteRule ^/appsuite/(v=[^,/]+/)?(.*)$ /myapp/$2 [PT]
```

Take care configuring apache configuration, proxy definitions might take place in several files. 
For example _/etc/apache2/conf.d/proxy_http.conf_ does also often contain http proxy configuration, which may differ from the definitions in the file edited
above.

If you want to test multiple apps, use a different directory for each, and repeat the last two lines for each app, substituting the proper values for "_myapp_". 
If you are using aliases instead of symlinks then replace _%{DOCUMENT_ROOT}_ with the actual file system path from the _Alias_ directive.

Now, restart Apache and start _appserver_ adding the path to your symlinked build-path of the app as an parameter.

```bash
sudo apachectl restart
appserver --server=https://www.ox.io/appsuite/ /var/www/myapp
```

If there are no errors, you can point your browser to [http://localhost/appsuite/](http://localhost/appsuite/) to test a version of OX App Suite which includes your app. 
You do not need to restart anything after re-building the app, a refresh of the browser page should be enough.

## Custom UI builds

To test your own build of the core UI, use _/var/www/appsuite_ as directory, but don't add a _RewriteRule_ for it. 
Instead, replace "_appsuite_" with "_appsuite/api_" in the _ProxyPassMatch_ directive and add a _<Directory>_ directive like for any other OX App Suite installation:

```
<Directory /var/www/appsuite/>
    Options FollowSymlinks
    AllowOverride Indexes FileInfo
</Directory>
```


# Reference

_appserver_ is a reverse HTTP proxy. It accepts HTTP requests and forwards most of them to another HTTP server. There are currently two exceptions:

-   _api/apps/load_ is served from a list of local paths. Only files which could not be found are fetched from the remote HTTP server. This allows to inject the code of a tested app without installing it on the remote server. The list of paths is specified as non-option parameters on the command line. Each path should normally have at least the subdirectories _apps_ and _manifests_. Each injected file is looked up in the _apps_ subdirectory of each path, in the order in which they appear on the command line, and the first found file is used. If a file is not found in any path, and the _[[#server|--server]]_ option is specified, the file is downloaded from the server.
-   _api/apps/manifests?action=config_ is extended by local manifests.
    This is necessary to enable the tested app in the UI. If no
    _[[#manifests|--manifests]]_ options are specified, then all files
    from the _manifests_ subdirectory of each path are combined and
    added to the manifests from the remote server. Each manifest entry
    overrides any entries with the same _path_ attribute. Similar to the
    priority for files, manifest entries from earlier paths override
    entries from later paths, and local entries override remote entries.

## help

Displays a short summary of available options:

```
Usage: appserver [OPTION]... [PATH]...

  -h,      --help           print this help message and exit
  -m PATH, --manifests=PATH add manifests from the specified path (default:
                            the "manifests" subdirectory of every file path)
           --path=PATH      absolute path of the UI (default: /appsuite)
  -p PORT, --port=PORT      listen on PORT (default: 8337)
  -s URL,  --server=URL     use an existing server as fallback
  -v TYPE, --verbose=TYPE   print more information depending on TYPE:
                            local: local files, remote: remote files,
                            proxy: forwarded URLs, all: shortcut for all three
  -z PATH, --zoneinfo=PATH  use timezone data from the specified path
                            (default: /usr/share/zoneinfo/)
```

Files are searched in each PATH in order and requested from the server if not found. If no paths are specified, the default is /var/www/appsuite/.

## manifests

By default, the manifests of an app are collected and put into _[[AppSuite:UI build system#builddir|$builddir]]/manifests_. 
Therefore, by default, _appserver_ collects manifests from the _manifests_ subdirectoriy of each file path. 
Since the destination directory for manifests can be changed by setting _[[AppSuite:UI build system#manifestDir|$manifestDir]]_, the manifest directories can also be changed in _appserver_ by specifying each directory with a separate _--manifests_ option.

If at least one _--manifests_ option is specified, the default file paths are not used for manifests at all.

## path

By default, URLs belonging to the OX App Suite (i. e. starting with _/appsuite/_) get mapped to the URL of the _[[#server|--server]]_ parameter, while all other paths get mapped to identical paths on that server to allow services like _/publications_ to work.

This parameter changes the path of the local OX App Suite URL e. g. to allow testing multiple UIs with the same server.

## port

Specifies the port to listen on. The default is 8337. This option might be useful to run multiple instances of _appserver_ at once or when port 8337 is already in use.

## server

Specifies the URL of an existing OX App Suite installation. The URL must start with _http://_ or _https://_. 
To make forwarding of an HTTPS URL over HTTP possible, _appserver_ removes the _Secure_ attribute from all cookies set by the server.

This option is required for manifest injection to work, since the intercepted request contains more data than just the manifests.

## verbose

Enables verbose output. During normal operation, _appserver_ only writes errors to its console. By specifying this option one or more times, additional output can be enabled, depending on the value of each option:

#### __local__ 
The name of every read local file is written to standard output.

#### __local:error__
The name of files that have not been found locally are written to standard  output (good for debugging missing files).

#### __remote__
The URL of every request for missing local files is written to standard output.

#### __proxy__
The URL of every client request which is forwarded as-is is written to standard output.

#### __all__
This is just a shortcut for _-v local -v remote -v proxy_.

Output lines belonging to the same client request are grouped together and separated from the next request by an empty line.

## zoneinfo

Specifies the path to the zoneinfo database. On POSIX systems, the default of ``/usr/share/zoneinfo/`` should always work. 
Even on systems without the database everything should just work if ``--server`` is specified, since any missing files will be fetched from the remote server. 
This option may still be useful when debugging time zone problems caused by different versions of the zoneinfo database.
