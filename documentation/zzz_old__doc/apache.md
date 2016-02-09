---
---
<h1>Apache Configuration</h1>

<div>
<p>If you read this in your browser you should have done this already:</p>
<pre class="text">
1.  Check out the UI from git

2.  Figure out Apache's document root. Common places are:

    - MacOS: <i>/Library/WebServer/Documents</i>
    - Linux: <i>/var/www</i>

3.  Create a new folder <i>appsuite</i> in Apache's document root

4.  You need node.js to build the UI:

    For MacOS (use /var/www instead of /Library/WebServer/Documents for debian):

    - Visit <a href="https://sites.google.com/site/nodejsmacosx/">https://sites.google.com/site/nodejsmacosx/</a>
      and install stable version.

    - Open terminal

    - Set environment variable:
        <i>export buildir="/Library/WebServer/Documents/appsuite"</i>

    - Build UI:
      <i>./build.sh</i>

    - Build documentation:
      <i>./build.sh docs</i>

    Note: Instead of exporting the builddir every time your want to build the ui or run the appserver, you can also create a file <em>local.conf</em> and set the directory in there. This way, every time the buildsystem or appserver runs, it automatically picks up the correct directory.
    <br>
    local.conf:<br>
    <i>
    export buildir="/Library/WebServer/Documents/appsuite"
    </i>

5.  Run the app loading server:
      <i>./appserver.sh</i>

    Don't worry: If it doesn't tell you anything it's happily running.

6.  If everything works fine, the documentation should be at
    <a href="http://localhost/appsuite/doc">http://localhost/appsuite/doc</a>.

</pre>
</div>

<p>Now configure Apache:</p>
<pre class="text">
1.  Make sure Apache loads the following modules:

    <i>mod_proxy, mod_proxy_ajp, mod_expires, mod_deflate, mod_rewrite,
    mod_headers, mod_mime, and mod_setenvif</i>

2.  Tell your Apache to process .htaccess files and how to connect to backend:

    <i>
    ProxyPass /appsuite/api/apps/load/ http://localhost:8337/apps/load/
    ProxyPass /appsuite/api ajp://127.0.0.1:8009/ajax
    # optional parameters: retry=0 connectiontimeout=5 timeout=10

    &lt;Directory /Library/WebServer/Documents/appsuite>
      Options None +FollowSymLinks
      AllowOverride Indexes FileInfo
    &lt;/Directory></i>

    Use the proper document root depending on your OS or custom configuration!

3.  If backend does not run on <i>localhost</i> (127.0.0.1),
    you have to adjust the ProxyPass directive.

4.  Restart Apache, e.g. <i>sudo apachectl restart</i>
</pre>

<p>And please double check everything you're doing!</p>
