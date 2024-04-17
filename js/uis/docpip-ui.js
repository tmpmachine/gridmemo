let uiDocPip = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    OpenWindow,
  };
  
  let local =  {
    workspaceId: null,
    noteId: null,
  };
  let pipNoteEl;
  
  async function OpenWindow() {
      
    let $ = document.querySelector.bind(document);
      
    if (!$('.active')) return;
      
    if (pipWindow) {
      pipWindow.close();
      await utilAwaiter.WaitUntilAsync( () => (pipWindow === null) );
    }
    
    pipNoteEl = $('.active');
    local.noteId = pipNoteEl.closest('[data-kind="item"]')?.dataset.id;
    local.workspaceId = compoWorkspace.GetActiveId();
    // const player = document.querySelector("#container-editor");
    
    // Open a Picture-in-Picture window.
    let presetWidth = pipNoteEl.querySelector('textarea').dataset.windowWidth;
    let presetHeight = pipNoteEl.querySelector('textarea').dataset.windowHeight;
  
    pipWindow = await documentPictureInPicture.requestWindow({
      width: presetWidth ? parseInt(presetWidth) : parseInt('350'),
      height: presetHeight ? parseInt(presetHeight) : parseInt('400'),
    });
    
    // Copy style sheets over from the initial document
    // so that the player looks the same.
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = document.createElement('style');
    
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
    
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
        
      }
    });
    
    pipWindow.addEventListener('pagehide', (evt) => onHide(evt));
    
    // Move the player to the Picture-in-Picture window.
    let editorEl = document.querySelector('#container-editor');
    pipWindow.document.body.append(editorEl);
    editorEl.append(document.querySelector('#notif'));
    
    let pipTextarea = pipNoteEl.querySelector('textarea');
    let js = ace.createEditSession(pipTextarea.value);
    
    editor.setSession(js);
    // restore folds session
    if (pipTextarea.tempData?.editorSesionCustomFoldData != null) {
      for (let item of pipTextarea.tempData?.editorSesionCustomFoldData) {
        editor.session.addFold(item.placeholder, createAceRange(item.foldRange));
      }
    }
    editor.session.setUseWrapMode(_isWrapMode);
    editor.session.setMode("ace/mode/markdown");
    
    // pipNoteEl.parentElement.classList.add('pip');
    
    // initPiPEditor();
  }
  
  function onHide(event) {
    const playerContainer = document.querySelector('#container-editor-hidden');
    const pipPlayer = event.target.querySelector('#container-editor');
    let pipContent = editor.getValue();
    
    playerContainer?.append(pipPlayer);

    // pipNoteEl.parentElement.classList.remove('pip');
    
    restoreTextFromPip(pipContent);

    let pipTextarea = pipNoteEl.querySelector('textarea');
    pipTextarea.dataset.windowWidth = event.currentTarget.outerWidth;
    pipTextarea.dataset.windowHeight = event.currentTarget.outerHeight;

    pipTextarea.value = pipContent;
    
    pipTextarea.tempData = {
      editorSesionCustomFoldData: editor.session.getAllFolds().map(x => {
        return {
          placeholder: x.placeholder,
          foldRange: JSON.parse(JSON.stringify(x.range)),
        };
      }),
    };
    
    let js = ace.createEditSession('');
    editor.setSession(js);
    
        
    document.body.append(document.querySelector('#notif'));
    
    pipWindow = null;
    local.workspaceId = null;
    local.noteId = null;
  }
  
  function restoreTextFromPip(pipContent) {
    let noteEl = $(`._notesContainer [data-id="${local.noteId}"]`);
    
    if (!noteEl) {
      compoTempWorkspace.UpdateNoteContentById(local.workspaceId, local.noteId, pipContent);
    } else {
      noteEl.querySelector('textarea').value = pipContent;
    }
  }
  
  return SELF;
  
})();