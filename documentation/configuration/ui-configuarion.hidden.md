UI Properties
A common use case for the OX configuration system is to allow fine-tuning of the UI by providing configuration data on the backend. All properties defined in properties files below /opt/open-xchange/etc/groupware/settings are transported to the UI and are config cascade enabled. So every customization you can specify for the UI using these settings, can also be selectively overridden with the config cascade.

Since the config cascade only overrides existing settings, whether a property is a UI property or a server property is automatically determined by the directory in which the corresponding .properties file is found. For example if /opt/open-xchange/etc/settings/appsuite.properties contains the setting

io.ox/core//theme=default
Then you can overwrite it for any context (or user, context set, etc.):

$ changecontext [...] --config/io.ox/core//theme=org.example.theme
The values are first parsed using JSON syntax. If that fails, they are interpreted as plain strings.
