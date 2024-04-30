# gridmemo

Grid layout note-taking app for the web.
Web app: https://gridmemo.web.app/

## Development
Run index.html on localhost or open directly in browser.
```
npm i
npm run setup           # copy node_modules scripts
npm run watch-divless   # if you're editing .divless/* files
```

- See **index.js** for app entry point.
- Caching files for offline support: see **manifest-cache.js**.
- Google Drive synchronization: see **js/components/gsi-component.js** and update `local.client_id` to your Google project client ID, and update `local.scopes` to your requirements.

### Divless HTML
I write HTML in [divless HTML format](https://github.com/tmpmachine/divless-html). Every HTML file may have a copy in `.divless` folder in the same directory.

```
/.divless
    index.html
index.html          -> Original file
```

**You should only edit the `.divless/*` files (if exists) to keep it in sync.**

Run `npm run watch-divless` to auto-convert the **.divless/*** files upon saving.

### Divless HTML in Summary
- Square brackets (`[]`) for tags.
- `[ ]` is a `<div>`.
- Hashtag (`#`) for ID. 
- Dot (`.`) for classes.
- Curly braces (`{}`) for inline style.

Example:
```
<!-- A div tag with two span tags -->
[ #label-info .text-center {padding:1rem}
    <span> Regular span tag </span>
    [span 'A span tag in divless HTML format']
    [s 'Another span tag using shortname']
]
```