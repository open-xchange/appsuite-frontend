---
---

<h1>Getting started</h1>

<p> 
    Hello and welcome to OX app suite development. This document will get you started to develop your own plugins and apps for OX app suite. We will look at the steps necessary but will also tempt you to learn more by linking you to some more in-depth documentation about these topics. Depending on how you wound up reading this page, you will probably have already completed some of the steps below.  
</p>

<h2 id="prereq">Prerequisites</h2>

<p>
    Before we begin, here are a few things that you need to have set up before going on:

    - An OX Backend. We will not cover how to set up one of these. Either have it running locally on your development machine, if you are also developing backend functionality, or install an OX server on another machine as a normal set up. Either one is fine.

    - To follow this guide, on your development machine you will need <em>git</em>, <em>node (0.4 or later)</em>, an <em>apache web server</em> and a text editor, for the actual development.
</p>

<h2 id="git">Check out the source</h2>
<p>
    Firstly you will need to check out our source code. This also includes the most up to date version of this documentation. The source code for the frontend is hosted at <em>code.open-xchange.com/wd/frontend/web</em>. Since we're living on the edge here, we will use the branch where the actual development is going on, called <i>develop</i>. Depending on your needs and taste, the stable <i>master</i> branch might also be a good choice. In a shell navigate to where you want to work on the app suite and type:

    <pre class="nocode prettyprint">
    <code class="pln">git clone -b develop https://code.open-xchange.com/wd/frontend/web</code>
    </pre>
    and wait for the checkout to complete. This will create the directory <em>web</em> with the source code of the frontend in it.
</p>


<h2 id="build">Building the ui and documentation</h2>
<p>
    For this I will refer you to the file <em>readme.txt</em> you've just checked out. It will include the steps you need to do to build the frontend and the most current version of the documentation. Briefly though, here is what you want to do:

    - create a new file <em>local.conf</em> in the source folder you have just checked out. Enter in it:

    <pre class="nocode prettyprint">
    <code class="pln">export builddir="/var/www/appsuite"</code>
    </pre>

    (I am assuming debian here. For other systems you might have to point this elsewhere, a folder called "appsuite" below apaches document root, to be precise. When in doubt, refer to the readme.txt)

    - run the build:<br><br>
    <pre class="nocode prettyprint">
    <code class="pln">./build.sh && ./build.sh docs</code>
    </pre>
    - start the app loading server<br><br>
    <pre class="nocode prettyprint">
    <code class="pln">./appserver.sh</code>
    </pre>

    This command will not return, since there is now a server running. If it is silent, then everything is running fine. You can then continue reading the documentation at <a href="http://localhost/appsuite/doc/gettingStarted.html#apache">http://localhost/appsuite/doc/gettingStarted.html</a>
</p>


<h2 id="apache">Set up Apache </h2>
<p>
    For this step, I will refer you to <a href="apache.html">this page</a>. 
    You will notice two <em>ProxyPass</em> directives. The first one points at the app loading server you started in the previous step, the second one points at the backend, either running locally (then 127.0.0.1 is fine as the target) or remotely (in which case you have to point it to the IP of the backend system). If port 8009 (the ajp port) is not reachable due to some firewall restrictions, you can also use http by substituting the second ProxyPass with this:

    <pre class="nocode prettyprint">
    <code class="pln">ProxyPass /appsuite/api http://remote-host/ajax timeout=600</code>
    </pre>
</p>


<h2 id="external">Getting ready to develop your own plugins / apps </h2>
<p>
    Next, create a new directory in which you will develop your plugin(s) / app/(s). Let us call it <em>myplugin</em> for now. Depending on where you want to keep your projects, do something like this: 

    <pre class="nocode prettyprint">
    <code class="pln">cd ~/projects/appsuite
    mkdir myplugin
    cd myplugin
    mkdir apps
    /path/to/appsuite/frontend/web/ui/bin/build-appsuite init-packaging package=myplugin</code>
    </pre>
    And answer the questions. 

    Bonus points for putting the <em>build-appsuite</em> program into your <em>PATH</em> (see <a href="buildsystem">buildsystem</a> for how to do that). We'll assume from now on, that it is in the PATH.
</p>

<p>
    Now you will have to decide on a namespace for your code. Let us for now choose <em>com.example</em>. In your plugins directory ("myplugin") under <em>apps</em> create a directory:

    <pre class="nocode prettyprint">
    <code class="pln">cd apps
    mkdir com.example
    touch com.example/main.js</code>
    </pre>

    and run the buildscript once:<br><br>

    <pre class="nocode prettyprint">
    <code class="pln">cd ..
    build-appsuite app</code>
    </pre>

    NOTE: Make sure that the environment variable <em>builddir</em> is not set, as the buildsystem would then just copy the files it built into the deployed location. It is better to just create a softlink to our files:<br><br>

    <pre class="nocode prettyprint">
    <code class="pln">ln -s $(readlink -m build/apps/com.example) /var/www/appsuite/apps/com.example</code>
    </pre>
    
    or<br><br>

    <pre class="nocode prettyprint">
    <code class="pln">ln -s $(pwd)/build/apps/com.example /var/www/appsuite/apps/com.example</code>
    </pre>

    For the rest of this exercise follow the steps outlined <a href="buildsystem.html#app">here</a>. Don't worry about the manifest.json if you do not have a locally running backend, just skip those steps. You can manually launch the app by typing<br><br>

    <pre class="prettyprint">
    ox.launch("com.example/main")
    </pre>

    in the javascript console of your browser. For more information on the buildsystem, read the <a href="buildsystem.html">entire description</a> available in this documentation.
</p>

<h2>Apps, plugins and manifests</h2>

<p>
    In order for an app to show up in the launcher grid, it has to be declared in a manifest file, so the UI can find out about the app. As in the example in the <a href="buildsystem.html#app">buildsystem documentation</a>, create a file <em>myplugin/apps/com.example/manifest.json</em>:

    <pre class="prettyprint">
    {
        title: 'Hello World App'
    }
    </pre>

    The buildsystem will automatically add the path to the main.js file to this entry, so when compiled it winds up looking like this:<br><br>
    
    <pre class="prettyprint">
    {
        path: "com.example/main",
        title: 'Hello World App'
    }
    </pre>

    If you are using a local backend you can use the trick described in the <a href="buildsystem.html#app">buildsystem documentation</a> to have the app show up. You will have to restart your backend every time the manifests change, though. 

    If, on the other hand you are working with a remote backend, you can inject your own manifest definitions this way:

    - Create the file <em>myplugin/src/manifests.js</em> in your app:<br><br>

    <pre class="prettyprint">
    define(function () {
        return [
            {
                path: "com.example/main",
                title: 'Hello World App'
            }
        ];
    });
    </pre>

    and manually place it in the deployed src directory:<br><br>

    <pre class="nocode prettyprint">
    <code class="pln">rm /var/www/appsuite/src/manifest.js 
    ln -s $(pwd)/src/manifests.js /var/www/appsuite/src/manifests.js</code>
    </pre>

    In case you're rebuilding the base ui you might have to repeat the above step. To activate the extra manifests in src/manifests.js, reload the UI with the "customManifests" switch in the url set to true. So for example:

    <a href="/appsuite/#!&customManifests=true">/appsuite/#!&customManifests=true</a>

    and when you click the app grid icon (left most icon on the top), your custom app will be listed as well.
</p>

<p>
    The second way – apart from your own apps – your plugin code can interact with the app suite is by way of extension points and extensions. Stated briefly an extension point is an invitation to contributing an implementation to a part of the UI. For example the contact detail view consists of an extension point that receives contributions in the form of renderers, that render different parts of the contact. Say, one for rendering the display name, one for the mail addresses, one for the postal addresses and so on. All these, in turn then, make up the contacts detail view. It is easy for plugins to affect this set of extensions. A plugin can contribute its own extension to an extension point, thereby rendering a different part of a contact or contributing a new button to work on a contact. A plugin can also disable existing extensions, thereby removing parts of the UI. 
</p>

<p>
    As an example, let's add a new renderer to the contact detail view. Let's create a new file <em>myplugin/apps/com.example/contacts/register.js</em>:

    <pre class="prettyprint">
        define('com.example/contacts/register', ['io.ox/core/extensions'], function (ext) {
            'use strict';

            ext.point('io.ox/contacts/detail').extend({
                id: 'com-example-contact-reversename',
                after: 'contact-details',
                draw: function (baton) {

                    var name = baton.data.display_name;
                    var rev = name.split("").reverse().join("");

                    this.append(
                        $("&lt;h1&gt;").text(rev)
                    ));
                }
            });
        });
    </pre>

    How can you find out which extension points exist and what you have to implement to extend them? App Suite contains an ever increasing set of   examples in the lessons app, that you can open by typing<br><br>
    
    <pre class="prettyprint">
    ox.launch("io.ox/lessons/main")
    </pre>
    
    in the console. If you do not find a suitable example here, your next best bet is to inspect the DOM structure. It may contain hints as to the extension points and extensions used. You might then still have to look up its current use in the frontend source code. Failing that, look for other identifying marks in the DOM structure, like a certain css class being set and just search for that in the frontend code base. Of course you can always just as us. This documentation is a work in progress, so for now, these are your best choices. 
</p>

<p>
    Next we have to make sure our code is actually loaded by the UI at the right moment. The right moment in our case is right before it loads the file apps/io.ox/contacts/view-detail, where the extension point is processed. For this, we need another manifest file at <em>myplugin/apps/com.example/contacts/manifest.json</em>:

    <pre class="prettyprint">
    {
        namespace: "io.ox/contacts/view-detail"
    }
    </pre>

    the <em>namespace</em> denoting when a plugin should be loaded. Rebuild your plugin by issuing the<br><br>

    <pre class="nocode prettyprint">
    <code class="pln">build-appsuite app</code>
    </pre>

    command in the root directory of your plugin, and if using a local backend, restart it to pick up on the changed manifest, or, for a remote backend, edit <em>myplugin/src/manifests.js</em> again so it reads:<br><br>

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

    reload the UI and navigate to a contact. It should contain the new section with the display name in reverse.
</p>

<h2 id="further">Further reading</h2>

<p>
    Every article in this documentation is certainly worth your time, in particular, though, have a look at:<br><br>

    - <a href="buildsystem.html">Buildsystem</a><br>

    - <a href="manifests.html">Manifests</a><br><br>

    Also, for (interactive) examples, have a look at the lessons app by logging into app suite and typing:

    <pre class="prettyprint">
    ox.launch("io.ox/lessons/main")
    </pre>

    in the Javascript console.
</p>
