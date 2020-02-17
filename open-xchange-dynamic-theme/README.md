# Dynamic Theme

See [`../documentation/theming/dynamic-theming.md`](https://documentation.open-xchange.com/latest/ui/theming/dynamic-theming.html) for the documentation.

## HOWTO quickly test:

1. Build the core UI in `../ui` with `yarn && grunt`
2. Build the plugin with `yarn && grunt`
3. `yarn test`
4. Test the core UI with `grunt dev`
5. Set some interesting colors in the browser console:
   ```javascript
   require('io.ox/dynamic-theme/less').setVars({ mainColor: 'red' })
   ```
