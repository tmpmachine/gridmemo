let uiNotes = (function() {

  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    DeleteSelectedNote,
    ListNotesAsync,
    GetActiveNoteId,
    InsertNote,
    GetAllGridContent,
    HandleClickNotes,
  };
  
  function GetAllGridContent() {
    let values = Array.from($$('._notesContainer textarea')).map(node => {
      return {
        id: node.closest('[data-kind="item"]')?.dataset.id,
        content: node.value,
      };
    });
    
    return values;
  }
  
  async function editTitleAsync(id) {
    let { data } = await compoNotes.GetByIdAsync(id);
    let noRefData = JSON.parse(JSON.stringify(data));
    
    let userVal = await windog.prompt('Note title', data.title ?? '');
    if (userVal === null) return;
    
    noRefData.title = userVal.trim();
    
    // reset note color if title is empty
    if (userVal.trim().length == 0) {
      delete noRefData.color;
      refreshNoteColorById(id);
    }
    await compoNotes.UpdateAsync(noRefData);
    refreshNoteTitleById(id, userVal);
  }
  
  function refreshNoteTitleById(id, newTitle) {
    let el = $(`._notesContainer [data-kind="item"][data-id="${id}"] [data-slot="title"]`);
    el?.replaceChildren(newTitle);
    if (newTitle.trim().length == 0) {
      el.classList.remove('_isShown');
    }
  }
  
  function handleClickAction(action, data, itemEl) {
    switch (action) {
      case 'change-color': changeColor(data.id); break;
      case 'edit-title': editTitleAsync(data.id); break;
      default: toggleRGB(itemEl);
    }
  }
  
  function changeColor(id) {
    $('._noteColorPicker')?.remove(); // remove existing one if exists due to pressing escape key
    
    let el = document.createElement('input');
    el.setAttribute('type', 'color');
    el.classList.add('_noteColorPicker');
    $('._limbo').append(el);
    el.click();
    
    let handleInputColor = debounce(15, (inputData) => {
      let hex = inputData;
      refreshNoteColorById(id, hex);
    });
    
    el.addEventListener('input', (evt) => {
      handleInputColor(evt.target.value);
    });
    el.addEventListener('change', async (evt) => {
      let hex = evt.target.value;
      el.remove();
      await compoNotes.UpdateColorByIdAsync(id, hex);
      refreshNoteColorById(id, hex);
    });
  }
  
  function getNoteElById(id) {
    return $(`._notesContainer [data-id="${id}"]`);
  }
  
  function refreshNoteColorById(id, hex) {
    let el = getNoteElById(id);
    let titleEl = el.querySelector('[data-kind="title"]');
    if (!titleEl) return;

    if (hex) {
      titleEl.style.background = hex;
    } else {
      titleEl.removeAttribute('style');
    }
  }
  
  function debounce(time, callback) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(...args);
      }, time);
    };
  }
  
  function HandleClickNotes(evt) {
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="item"]');
    let action = targetEl?.closest('[data-action]')?.dataset.action;
    
    if (!itemEl) return;
      
    let data = {
      id: itemEl.dataset.id,
    };
        
    handleClickAction(action, data, itemEl);
  }
  
  async function ListNotesAsync(noteObjs = []) {
    $('#wrapper')?.replaceChildren('');
    for (let obj of noteObjs) {
      appendNoteEl(obj);
    }
  }
  
  function toggleRGB(nodeEl) {
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    nodeEl.querySelector('.notes-inner')?.classList.toggle('active', true);
  }
  
  async function InsertNote() {
    
    let workspace = compoWorkspace.GetActiveGroup();
    if (workspace === null) return;
    
    let result = await compoNotes.AddAsync('');
    if (!result.success) return;
    
    let noteId = result.data;
    
    let activeNoteIndex = 0;
    let activeNoteId = uiNotes.GetActiveNoteId();

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
  
  
  function appendNoteElAtIndex(data, insertIndex) {
    
    let docFrag = document.createDocumentFragment();

    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-note').content.cloneNode(true), 
    });
    
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
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
  
  function setActiveNoteElById(id) {
    let noteEl = $(`.notes[data-id="${id}"]`);
    if (!noteEl) return;
    
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    
    noteEl.querySelector('.notes-inner').classList.toggle('active', true);
  }
  
  function appendNoteEl(data) {
    let docFrag = document.createDocumentFragment();
    let el = document.querySelector('#tmp-list-note').content.cloneNode(true);
    let titleEl = el.querySelector('[data-slot="title"]');
    
    if (data.title) {
      titleEl?.classList.add('_isShown');
    }
    if (titleEl && data.color) {
      titleEl.style.background = data.color;
    }
    titleEl?.replaceChildren(data.title ?? '');
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
    el.querySelector('textarea').value = data.content;
    el.querySelector('textarea').tempData = {
      editorSesionCustomFoldData: data.editorSession?.foldData,
    };
    
    docFrag.append(el);
    
    $('#wrapper').append(docFrag);
  }
  
  async function DeleteSelectedNote() {
    let id = GetActiveNoteId();
    let noteEl = $(`.notes[data-id="${id}"]`);
    
    if (!noteEl) return;
    
    let noteObj = await compoNotes.GetByIdAsync(id);
    
    if (noteObj?.data?.content?.trim().length > 0) {
      let isConfirm = await windog.confirm('Delete this note? This process cannot be undone');
      if (!isConfirm) return;
    }
    
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
  
  return SELF;
  
})();