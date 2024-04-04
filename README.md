# gridmemo

Grid layout note-taking app for the web.
Web app: https://gridmemo.web.app/

## Development
Written in plain JavaScript. Scripts are loaded by appending `<script>` tags in batches in **index.js**.

- Caching files for offline support: see **manifest-cache.js**.
- Authorization Scopes (backup to Google Drive): see **js/components/gsi-component.js** and update `local.client_id` to your Google project client ID, and update `local.scopes` to your requirements.

### Project Structure
Main files and directories that you'd likely spend more time on :
```
/js
    /components
        workspace-component.js
        ...
    /uis
        workspace-ui.js
        ...

    app.js
    app-data.js

    dom-events.js
    ui.js
    view-states.js

index.html
index.js
manifest-cache.json
```
Unless tied to a component, I'd put UI script in **ui.js**.

### Divless HTML
I write HTML in [divless HTML format](https://github.com/tmpmachine/divless-html). Every HTML file has a copy in `.divless` folder in the same directory.

You'll need [vsce-divless](https://marketplace.visualstudio.com/items?itemName=PacoLemon.divlesshtml) (**VS Code extension**) to auto-convert the divless formatted HTML file, but you can edit the original file just fine.
```
/.divless
    index.html
index.html          -> Original file
```
In summary, divless HTML uses:
- square brackets (`[]`) for tags, 
- nameless tag for `<div>`, 
- hashtag (`#`) for ID, 
- dot (`.`) for classes, 
- and curly braces (`{}`) for inline style.

Example:
```
<!-- A div tag with two span tags-->
[ #label-info .text-center {padding:1rem}
    <span> Regular span tag </span>
    [span 'A span tag in divless HTML format']
    [s 'Another span tag using shortname']
]
```