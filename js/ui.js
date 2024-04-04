let ui = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    Init,
    
    // workspaces
    OnDblClickContainerWorkspace,
    OpenWorkspaceFromCommandPalette,
    
    // notes
    InsertNote,
    DeleteSelectedNote,
    GetActiveNoteId,
    TaskListNotes,
    
    ToggleInsertSnippet,
  };
  
  
  function OpenWorkspaceFromCommandPalette(id) {
    OpenWorkspaceById(id);
  }
  
  async function InsertNote() {
    
    let workspace = compoWorkspace.GetActiveGroup();
    if (workspace === null) return;
    
    let result = await compoNotes.TaskAdd('');
    if (!result.success) return;
    
    let noteId = result.data;
    
    let activeNoteIndex = 0;
    let activeNoteId = ui.GetActiveNoteId();

    if (activeNoteId) {
      activeNoteIndex = workspace.noteIds.indexOf(activeNoteId);
    }
    
    workspace.noteIds.splice(activeNoteIndex, 0, noteId);
    compoWorkspace.Commit();
    appData.Save();
    
    appendNoteElAtIndex({
      id: noteId,
      content: '',
    }, activeNoteIndex);
    
    setActiveNoteElById(noteId);
  }
  
  async function DeleteSelectedNote() {
    let id = GetActiveNoteId();
    let noteEl = $(`.notes[data-id="${id}"]`);
    if (!noteEl) return;
    
    let result = await compoNotes.DeleteById(id);
    if (!result.success) return;
    
    noteEl.remove();
    
    let workspace = compoWorkspace.GetActiveGroup();
    compoWorkspace.DeleteWorkspaceNoteById(workspace.id, id);
    compoWorkspace.Commit();
    appData.Save();
  }
  
  function GetActiveNoteId() {
    let el = $('.notes-inner.active');
    if (!el) return null;
    
    return el.closest('[data-kind="item"]').dataset.id;
  }
  
  function OnDblClickContainerWorkspace(evt) {
    
    let targetEl = evt.target;
    let itemEl = targetEl.closest('[data-kind="item"]');
    if (!itemEl) return;
    
    let actionEl = targetEl.closest('[data-action]');
    if (!actionEl) return;
    
    let id = itemEl.dataset.id;
    let action = actionEl.dataset.action;
    
    // todo
    switch (action) {
      case 'open': uiFileTab.openWorkspaceInTab(id); break;
    }
    
  }
  
  
  function syncFileTitleOnTab(id, title) {
    let item = compoTabManager.GetById(id);
    if (!item) return;
    
    item.title = title;
  }
  
  
  
  
  function ApplyDocPiPFocusHackFix() {
    // prevent window.focus by Ace editor from PiP window that bring forth the opener window.
    window.nativeFocus = window.focus;
    window.focus = () => { };
  }
  
  function Init() {
    ApplyDocPiPFocusHackFix();
    
    uiWorkspace.ListWorkspace();
    uiFileTab.refreshListTab();
    TaskListNotes();
    initCommandPalette();
    
    attachCopyCutLinesListeners();
    initSortable();
    
    attachListeners();
  }
  
  function attachListeners() {
    
    hotkeys('esc,ctrl+s,ctrl+d,alt+p,alt+w,alt+.,alt+,,alt+n', function (event, handler){
      switch (handler.key) {
        case 'esc':
          if (document.activeElement.classList.contains('text')) {
            document.activeElement.parentNode.classList.toggle('active', false);
            document.activeElement.blur();
          }
          break;
        case 'ctrl+s': 
          event.preventDefault();
          saveNotes();
          break;
        case 'ctrl+d': 
          event.preventDefault();
          DeleteSelectedNote();
          break;
        case 'alt+p': openPiPNote(); break;
        case 'alt+w': uiFileTab.closeOpenTab(); break;
        case 'alt+.': uiFileTab.openNextTab(); break;
        case 'alt+,': uiFileTab.openPrevTab(); break;
        case 'alt+n': InsertNote(); break;
      }
    });
    
  }
  
  
  
  function initSortable() {
    new Sortable($('#wrapper'), {
        handle: '.handle', 
        animation: 150,
        onEnd: function (evt) {
      		compoWorkspace.UpdateNoteIndex(evt.oldIndex, evt.newIndex);
      		compoWorkspace.Commit();
      		appData.Save();
      	},
    });
  }

  
  function attachCopyCutLinesListeners() {
    
    $('#wrapper').addEventListener("keydown", shiftLine);
    
    // attach whole line copy & cut functionality
    $('#wrapper').addEventListener('copy', event => {
      let node = event.target;
      if (!node.matches('textarea')) {
        return;
      }
      textarea = node;
      
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      if (startPos != endPos) {
        return;
      }
      
      const text = textarea.value;
      const lines = text.split('\n');
      
      let totalLen = 0;
      const currentLineIndex = lines.findIndex(line => {
        if (startPos >= totalLen && endPos <= totalLen + line.length) {
          return true;
        }
        totalLen += line.length + 1;
        return false
      });
      
      if (currentLineIndex >= 0) {
        const currentLine = lines[currentLineIndex];
        const currentLineStart = text.lastIndexOf('\n', startPos - 1) + 1;
        const currentLineEnd = text.indexOf('\n', endPos) + 1 || text.length;
        textarea.setSelectionRange(currentLineStart, currentLineEnd);
        event.preventDefault();
        event.clipboardData.setData('text/plain', currentLine+'\n');
        textarea.setSelectionRange(startPos, endPos);
      }
    });
    
    $('#wrapper').addEventListener('cut', event => {
      let node = event.target;
      if (!node.matches('textarea')) {
        return;
      }
      textarea = node;
      
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      if (startPos != endPos) {
        return;
      }
      
      const text = textarea.value;
      const lines = text.split('\n');
      
      let totalLen = 0;
      const currentLineIndex = lines.findIndex(line => {
        if (startPos >= totalLen && endPos <= totalLen + line.length) {
          return true;
        }
        totalLen += line.length + 1;
        return false
      });
      
      if (currentLineIndex >= 0) {
        const currentLine = lines[currentLineIndex];
        const currentLineStart = text.lastIndexOf('\n', startPos - 1) + 1;
        const currentLineEnd = text.indexOf('\n', endPos) + 1 || text.length;
        textarea.setSelectionRange(currentLineStart, currentLineEnd);
        document.execCommand('cut');
        textarea.setSelectionRange(startPos, endPos);
      }
    });
  }
  
  function initCommandPalette() {
    // command palette
    Mousetrap.bind('ctrl+shift+p', (evt) => {
      evt.preventDefault();
      openPalette();
    });
  }
  
  function openPalette() {
    ToggleInsertSnippet()
  }
  
  function ToggleInsertSnippet(persistent) {
    let el = $('.search-box');
    el.classList.toggle('d-none')
    $('#search-input').addEventListener('blur', hidePalette);
    if (!el.classList.contains('d-none')) {
      $('#search-input').value = '';
      setTimeout(() => { $('#search-input').focus(); }, 1);
    } else {
      setTimeout(() => { document.activeElement.blur() }, 1);
      $('#search-input').value = '';
      $('#search-input').blur();
    }
  }
  
  async function hidePalette(event) {
    await delayMs(10);
    let el = $('.search-box');
    el.classList.toggle('d-none', true);
    $('#search-input').value = '';
    $('#search-input').removeEventListener('blur', hidePalette);
  }
  
  function delayMs(timeout) {
    return new Promise(resolve => window.setTimeout(resolve, timeout));
  }
  
  async function TaskListNotes() {
    
    $('#wrapper').innerHTML = '';
    
    let workspace = compoWorkspace.GetActiveGroup();
    if (!workspace) return;
    
    for (let noteId of workspace.noteIds) {
      
      let result = await compoNotes.TaskGetById(noteId);
      if (!result.success) continue;
      
      appendNoteEl(result.data);
    }
    
  }
  
  function appendNoteEl(data) {
    
    let docFrag = document.createDocumentFragment();

    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-note').content.cloneNode(true), 
    });
    
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
    el.querySelector('textarea').addEventListener('click', toggleRGB);
    el.querySelector('textarea').value = data.content;
    el.querySelector('textarea').tempData = {
      editorSesionCustomFoldData: data.editorSession?.foldData,
    };
    
    docFrag.append(el);
    
    $('#wrapper').append(docFrag);
  }
  
  function appendNoteElAtIndex(data, insertIndex) {
    
    let docFrag = document.createDocumentFragment();

    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-note').content.cloneNode(true), 
    });
    
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
    el.querySelector('textarea').addEventListener('click', toggleRGB);
    el.querySelector('textarea').value = data.content;
    
    docFrag.append(el);
    
    let noteEls = $('#wrapper').querySelectorAll('.notes');
    
    if (noteEls.length > 0) {
      for (let i = 0; i < noteEls.length; i++) {
        if (i == insertIndex) {
          $('#wrapper').insertBefore(docFrag, noteEls[i]);
          break;
        }
      }
    } else {
      $('#wrapper').append(docFrag);
    }
    
  }
  
  function toggleRGB(e) {
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    let node = e.target;
    node.parentNode.classList.toggle('active', true);
  }
  
  function setActiveNoteElById(id) {
    let noteEl = $(`.notes[data-id="${id}"]`);
    if (!noteEl) return;
    
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    
    noteEl.querySelector('.notes-inner').classList.toggle('active', true);
  }
  
  return SELF;
  
})();