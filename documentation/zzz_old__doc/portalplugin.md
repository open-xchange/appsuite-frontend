---
---

<h1>Declaring a portal plugin</h1>

<p>
    A portal plugin basically consists of two files, both placed in <em>ui/apps/plugins/portal/[PLUGINNAME]</em><br>
    <em>manifest.json</em>:
</p>

<script type="text/example">
    {
        namespace: "portal",
        requires: "disabled"
    }
</script>
<p>and <em>register.js</em></p>

<p>
    Every portal plugin needs to be registered. For development purpose this is done by adding it to the <em>DEV_PLUGINS</em> array found in <em>io.ox/portal/widgets.js</em>.
</p>


<script type="text/example">
    
    var DEV_PLUGINS = ['plugins/portal/[PLUGINNAME]/register'];
    
</script>

<p>
    In register.js use the extensionpoint <em>io.ox/portal/widget/[PLUGINNAME]]</em> to define the functions for widget handling.
</p>

<p>A widget title can be set:</p>
<script type="text/example">
    title: 'Hello World'
</script>

<p>If the widget title needs to be clickable this can be done by implementing <em>action</em>: </p>

<script type="text/example">
action: function (baton) {
        alert(baton.hello);
}
</script>

<p>To extend the baton <em>initialize</em> can be used. This is optional.</p>
<script type="text/example">
initialize: function (baton) {
        baton.hello = String('Hello World');
}
</script>

<p><em>load</em> is called right after <em>initialize</em>. It returns a deferred object when done.</p>
<script type="text/example">
load: function (baton) {
        return $.when();
}
</script>

<p>After <em>load</em> returns, <em>preview</em> draws the content of the widget:</p>

<script type="text/example">
preview: function (baton) {
        var content = $('<div class="content pointer">').text(baton.hello);
        this.append(content);
}
</script>

<p><em>draw</em> is used to draw contend into a side-popup. The side-popup uses the following delegate: '.item, .content.pointer' </p>

<script type="text/example">
draw: function (baton) {
        this.append(
            $('<h1>').text(baton.hello)
        );
}
</script>

<p>
    Finally use a extensionpoint <em>io.ox/portal/widget/[PLUGINNAME]/settings</em> to make the plugin appear in the portal settings.<br><br>
    To make this plugin editable set <em>editable</em> to true.<br>
    Create a <em>edit</em> function in <em>register.js</em> that handles the editprocess. The model and the view of the Plugin are available as arguments.<br>
    Add <em>edit: edit </em> to the extensionpoint to make this function available to the view.<br>
    
</p>   
<p>
    If <em>unique</em> is set to true only one instance of this plugin is allowed.<br>
</p>
<script type="text/example">
ext.point('io.ox/portal/widget/[PLUGINNAME]/settings').extend({
        title: gt('Hello World'),
        type: 'helloworld',
        editable: true,
        edit: edit,
        unique: true
});
</script>

