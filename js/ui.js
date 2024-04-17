let ui = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    Init,
    OpenWorkspaceFromCommandPalette,
    ToggleInsertSnippet,
  };
  
  function OpenWorkspaceFromCommandPalette(id) {
    uiWorkspace.OpenWorkspaceById(id);
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
    uiWorkspace.OpenRecentWorkspace();
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
          uiNotes.DeleteSelectedNote();
          break;
        case 'alt+p': uiDocPip.OpenWindow(); break;
        case 'alt+w': uiFileTab.closeOpenTab(); break;
        case 'alt+.': uiFileTab.openNextTab(); break;
        case 'alt+,': uiFileTab.openPrevTab(); break;
        case 'alt+n': uiNotes.InsertNote(); break;
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
        return false;
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
    ToggleInsertSnippet();
  }
  
  function ToggleInsertSnippet(persistent) {
    let el = $('.search-box');
    el.classList.toggle('d-none');
    $('#search-input').addEventListener('blur', hidePalette);
    if (!el.classList.contains('d-none')) {
      $('#search-input').value = '';
      setTimeout(() => { $('#search-input').focus(); }, 1);
    } else {
      setTimeout(() => { document.activeElement.blur(); }, 1);
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
  
  return SELF;
  
})();