---
---

<h1>Manifests</h1>

<p>
    Manifest files in the app suite declare either apps or plugins. They tell the app suite runtime which files to load when, so the code in it can take effect at the appropriate time. This document should be read by everyone that wants to either build a plugin or an app and contains a description of how to get app suite to run your code. 
</p>

<h2>Declaring apps</h2>

The minimal declaration for an app looks like this:<br><br>

<pre class="prettyprint">
    {
        title: "My App",
        path: "com.example/myapp/main"
    }
</pre>

It consists of a title for the app and the path to the main entry file, by convention always called <em>main.js</em>. This declaration is usually found in the file <em>manifest.json</em> right next to the app in question, but could theoretically be located anywhere. If the file is located in the same directory as the main entry file and the file is, as is the convention, called <em>main.js</em> you can leave out the path as it will be added automatically by the buildsystem, so the minimal definition then becomes:<br><br>

<pre class="prettyprint">
    {
        title: "My App"
    }
</pre>

<h2>Declaring a plugin</h2>

<p>
    In turn, this is the definition of a plugin file:

<pre class="prettyprint">
    {
        namespace: "io.ox/contacts/view-detail",
        path: "com.example/myapp/contacts/register"
    }
</pre>

    The <em>namespace</em> contains the name of a frontend module for which the plugin is relevant. Declaring a plugin like this has the effect, that the plugin is loaded before the file named as the namespace is loaded, so it can affect what the core file is doing, commonly by extending an extension point. The convention is to always put plugins into the file <em>register.js</em>, so again, the path can be omitted if the <em>manifest.json</em> is placed alongside the <em>register.js</em> containing the plugin. A plugin may be associated with more than one namespace, in that case, just use a list as the value for the namespace attribute:<br><br>

<pre class="prettyprint">
    {
        namespace: ["io.ox/contacts/view-detail", "io.ox/contacts/edit/view-form"]
    }
</pre>

    Whichever module is loaded first will trigger the plugin to be loaded.
</p>

<h2>Capabilities</h2>

<p>
    Sometimes a plugin or an app is only available if either the backend has a certain bundle installed or the user must have a certain permission. Both permissions and backend capabilities are rolled into the concept of a "capability". If your plugin, for example, is only relevant when the user has access to the calendar module, you can add a <em>requires</em> attribute to the declaration:

    <pre class="prettyprint">
    {
        namespace: "io.ox/contacts/view-detail",
        requires: "calendar"
    }
    </pre>

    Which capabilities are available can be checked by either reading through existing manifests or by running this in the javascript console once logged into appsuite:<br><br>

    <pre class="prettyprint">
        _(ox.serverConfig.capabilities).pluck("id")
    </pre>
</p>

<h2>Multiple declarations in one file</h2>
<p>
    If you need more than declaration in a <em>manifest.json</em> file, you can include them in a list:

    <pre class="prettyprint">
    [
        {
            namespace: "io.ox/contacts/view-detail",
            path: "com.example/myapp/contacts/viewPlugin"
        },
        {
            namespace: "io.ox/contacts/view-form",
            path: "com.example/myapp/contacts/formPlugin"
        }
    ]
    </pre>

</p>

<h2>What happens to these files?</h2>

<p>
    During a build run the buildsystem picks up these manifest files and consolidates them into a single file <em>build/manifests/[myapp].json</em>. This file, either by creating a symlink to a locally run backend or by installing the app package on a remote backend, winds up in the manifests directory of the backend and is processed and sent to the frontend. You can see all manifest declarations, that have been sent by the backend by looking at

    <pre class="prettyprint">
        ox.serverConfig.manifests
    </pre>

    in the javascript console. 
</p>

<h2>Loading additional manifests during development</h2>

<p>
    Since during development restarting the backend or, in case of a remote backend, updating it every time the manifests change, you can tell the frontend to load the file "src/manifests.js" and add the manifests to the ones provided by the backend. The file is supposed to be an anonymous require module that returns the array of manifest entries:

    <pre class="prettyprint">
        define(function () {
            return [
                {
                    path: "com.example/main",
                    title: 'Hello World App'
                },
                {
                    path: "com.example/contacts/register",
                    namespace: "io.ox/contacts/view-detail"
                }
            ];
        });
    </pre>

    Note that here the buildsystem doesn't add the <em>path</em> elements for this file. It's useful to have the buildsystem assemble the manifest.json files and then copy the resulting manifest entries into the array returned in the definition function. This file has to be linked into the deployed source folder:<br><br>

    <pre class="prettyprint nocode">
        <code class="pln">rm /var/www/appsuite/src/manifests.js
        ln -s /var/www/appsuite/src/manifests.js /path/to/custom/manifests.js</code>
    </pre>

    To tell app suite to load the custom manifest file, you have to invoke the frontend with the "customManifests" switch turned to "true": <a href="/appsuite/#!&customManifests=true">/appsuite/#!&customManifests=true</a>
</p>

<h2>Special namespaces</h2>

<h3>signin</h3>

<p>
    Plugins that choose "signin" as (or amongst) their namespace, are loaded when the login page is shown. The code can be used to rearrange parts of the signin page or add custom behaviour to it. 
</p>

<h3>core</h3>

<p>
    Core plugins are loaded as soon as the frontend starts up after successfully logging in or reauthenticating with the autologin. This is useful if you need to run code very early.
</p>
