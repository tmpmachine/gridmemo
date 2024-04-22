let DOMEvents = (function() {
    
  let eventsMap = {
    onclick: {
      'open-pip-canvas-module': () => ui.OpenPipCanvasModule(),
      'logout': () => compoGsi.Logout(),
      'authorize': () => compoGsi.RequestToken(),
    	'backup-to-cloud': () => app.BackupToCloud(),
    	'restore-from-cloud': () => app.RestoreFromCloud(),
    	'save-workspace': () => app.save(),
    	
    	'toggle-sidebar': () => viewStateUtil.Toggle('workspace', ['sidebar']),
    	
    	'workspace-create': () => uiWorkspace.CreateWorkspace(),
    	'on-click-container-workspace': (evt) => uiWorkspace.HandleClickWorkspaces(evt),
    	'handle-click-container-tab': (evt) => uiFileTab.HandleClickContainerTab(evt),
    	
    	'open-settings': () => viewStateUtil.Toggle('view-editor', ['settings', 'notes']),
    	'toggle-debug-log': () => viewStateUtil.Toggle('features-settings', ['debug-log-on', 'debug-log-off']),
      
      'insert-note': () => uiNotes.InsertNote(),
      'delete-selected-notes': () => uiNotes.DeleteSelectedNote(),
      'export-to-file': () => app.TaskExportDataToFile(),
      'import-from-file': () => app.TaskImportDataFromFile(),
      'clear-data': () => app.TaskClearData(),
    },
    onmousedown: {
      'handle-mousedown-tab': (evt) => uiFileTab.HandleMouseDownTab(evt), 
    },
    ondblclick: {
      'handle-dbl-click-workspace': (evt) => uiWorkspace.HandleDblClick(evt),
    	'handle-dblclick-tab': (evt) => uiFileTab.HandleDblClickTab(evt),
    },
    onkeydown: {
      'handle-notes-keydown': (evt) => ui.HandleNotesKeydown(evt),
    }
  };
  
  
  let listening = function(selector, dataKey, eventType, callbacks) {
    let elements = document.querySelectorAll(selector);
    for (let el of elements) {
      let callbackFunc = callbacks[el.dataset[dataKey]];
      el.addEventListener(eventType, callbackFunc);
    }
  };
  
  function Init() {
    listening('[data-onclick]', 'onclick', 'click', eventsMap.onclick);
    listening('[data-ondblclick]', 'ondblclick', 'dblclick', eventsMap.ondblclick);
    listening('[data-onmousedown]', 'onmousedown', 'mousedown', eventsMap.onmousedown);
    listening('[data-onkeydown]', 'onkeydown', 'keydown', eventsMap.onkeydown);
  }
  
  return {
    Init,
  };

})();