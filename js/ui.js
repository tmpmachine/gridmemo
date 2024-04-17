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
          app.save();
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
  
  function shiftLine(event) {
    
    let node = event.target;
    if (!node.matches('textarea')) {
      return;
    }
    textarea = node;
    
    if (event.ctrlKey && event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      
      const textarea = event.target;
      const value = textarea.value;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const lines = value.split("\n");
  
      // Calculate the index of the line to shift
      let lineIndex = value.substr(0, selectionStart).split("\n").length - 1;
      if (event.key === "ArrowUp") {
        // Make sure the line index is within bounds
        if (lineIndex < 0 || lineIndex >= lines.length) {
          return;
        }
        // lineIndex--;
      } else {
        // Make sure the line index is within bounds
        if (lineIndex < 0 || lineIndex >= lines.length) {
          return;
        }
      }
  
      // Remove the line to be shifted from the array
      const lineToShift = lines.splice(lineIndex, 1)[0];
  
      // Calculate the index of the line to insert the shifted line
      let insertIndex = lineIndex;
      if (event.key === "ArrowDown") {
        insertIndex++;
      } else {
        insertIndex--;
      }
  
      // Make sure the insert index is within bounds
      if (insertIndex < 0) {
        insertIndex = 0;
      } else if (insertIndex > lines.length) {
        insertIndex = lines.length;
      }
      // Insert the shifted line into the array
      lines.splice(insertIndex, 0, lineToShift);
  
      // Update the textarea value and selection position
      textarea.value = lines.join("\n");
  
      let result = lines.reduce((acc, curr, index) => {
        if (event.key === "ArrowDown" && index <= lineIndex) {
          return acc + curr.length + 1;
        } else if (event.key === "ArrowUp" && index < lineIndex) {
          return acc + curr.length + 1;
        } 
        return acc;
      }, 0);
      
      if (event.key === "ArrowUp") {
        result -= lineToShift.length + 1;
        result = Math.max(0, result);
      } 
      
      textarea.setSelectionRange(result, result);
    }
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