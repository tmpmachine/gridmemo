(function() {
    
  'use strict';
  
  componentLoader.load([
    {
      urls: [
        "js/dom-events.js",
        "js/view-states.js",
        "js/utils/view-state-util.js",
      ],
      callback: function() {
        viewStates.Init();
        DOMEvents.Init();
      }
    },
    {
      urls: [
        "js/lib/sortable@1.15.1.min.js",
        
        "https://cdn.jsdelivr.net/gh/ccampbell/mousetrap@v1.6.5/mousetrap.min.js",
        "js/lib/tmpmachine/lsdb@v1.0.0.js",
        "js/lib/hotkeys.min@v3.12.2.js",
        "js/components/tab-manager-component.js",
        "js/components/backup-component.js",
        "js/components/workspace-component.js",
        "js/components/notes-component.js",

        "js/ui.js",
        "js/uis/file-tab-ui.js",
        "js/uis/workspace-ui.js",
        "js/uis/notes-ui.js",

        "js/lib/drive-api.js",
        "js/utils/uuidv4-util.js",
        "https://cdn.jsdelivr.net/gh/tmpmachine/templateslot.js@v1.0.2/templateslot.min.js",
      ],
    },
    {
      urls: [
        "js/app-data.js",
        "js/app.js",
      ],
      callback: function() {
        app.Init();
      }
    },
    {
      urls: [
        "js/lib/ace@1.32.7/ace.min.js",
        "js/components/gsi-component.js",
        // "https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.7/ace.min.js",
      ],
      callback: function() {
        ace.config.setModuleUrl('ace/theme/monokai', 'js/lib/ace@1.32.7/theme-monokai.min.js');
        ace.config.setModuleUrl('ace/mode/markdown', 'js/lib/ace@1.32.7/mode-markdown.min.js');
        // ace.config.setModuleUrl('ace/theme/my-custom-theme', '/self-hosted/assets/ace/theme-custom.js');
        
        initPiPEditor();
      }
    },
  ]);
  
})();

async function _onGsiClientReadyAsync() {
  await utilAwaiter.WaitUntilAsync(() => typeof(compoGsi) != 'undefined');
  compoGsi.InitTokenClient();
}