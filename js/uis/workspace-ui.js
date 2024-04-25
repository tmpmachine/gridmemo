let uiWorkspace = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    HandleClickWorkspaces,
    ListWorkspace,
    CreateWorkspace,
    RefreshWorkspaceState,
    OpenRecentWorkspace,
    HandleDblClick,
    HighlightActiveWorkspace,
  };
  
  function syncFileTitleOnTab(id, title) {
    let item = compoTabManager.GetById(id);
    if (!item) return;
    
    item.title = title;
  }
  
  function HandleDblClick(evt) {
    // make sure not double click on action buttons
    if (evt.target.closest('[data-action]')) return;
    
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="itemWorkspace"]');
    let id = itemEl?.dataset.id;
    
    if (!itemEl) return;
    
    uiFileTab.SetPersistentTabByWorkspaceId(id);
  }
  
  function HandleClickWorkspaces(evt) {
    
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="itemWorkspace"]');
    let actionEl = targetEl?.closest('[data-action]');
    let action = actionEl?.dataset.action;
    
    // data
    let id = itemEl?.dataset.id;
    
    if (!itemEl) return;
    
    // todo
    switch (action) {
      case 'open': ui.OpenWorkspaceByIdAsync(id); break;
      case 'rename': renameWorkspaceById(id); break;
      case 'delete': deleteWorkspaceById(id); break;
      default: ui.OpenWorkspaceByIdAsync(id); break;
    }
    
  }
  
   async function OpenRecentWorkspace() {
    let workspace = compoWorkspace.GetActiveGroup();
    if (!workspace) return;
    
    let noteObjs = await compoNotes.GetAllByIdsAsync(workspace.noteIds);
    
    compoTempWorkspace.CaptureNotesAsync(workspace.id, noteObjs);
    await uiNotes.ListNotesAsync(noteObjs);
  }
  
  async function renameWorkspaceById(id) {
    let workspace = compoWorkspace.GetById(id);
    let userVal = await windog.prompt('Workspace name', workspace.title);
    if (!userVal) return;
    
    workspace.title = userVal;
    syncFileTitleOnTab(id, workspace.title);
    
    compoWorkspace.Commit();
    compoTabManager.Commit();
    appData.Save();
    
    ListWorkspace();
    uiFileTab.refreshListTab();
  }
  
  async function deleteWorkspaceById(id) {
    let isConfirm = await windog.confirm('Are you sure?');
    if (!isConfirm) return;
    
    compoTempWorkspace.DeleteById(id);
    let activeWorkspaceId = compoWorkspace.GetActiveId();
    let workspaces = compoWorkspace.GetById(id);
    
    for (let id of workspaces.noteIds) {
      await compoNotes.DeleteById(id);
    }
    
    compoWorkspace.deleteById(id);
    compoTabManager.DeleteById(id);
    
    compoWorkspace.Commit();
    compoTabManager.Commit();
    appData.Save();
    
    ListWorkspace();
    uiFileTab.refreshListTab();
    if (workspaces.id == activeWorkspaceId) {
      uiNotes.ListNotesAsync();
    }
  }
  
  async function CreateWorkspace() {
    let userVal = await windog.prompt('New workspace name');
    if (!userVal) return;
    
    let workspace = compoWorkspace.AddGroup(userVal);
    compoWorkspace.SetActiveById(workspace.id);
    compoWorkspace.Commit();
    appData.Save();
    
    uiFileTab.openWorkspaceInTab(workspace.id);
    uiWorkspace.ListWorkspace();
    uiNotes.ListNotesAsync();
    
    uiNotes.InsertNote();
  }
  
  function RefreshWorkspaceState() {
    let workspaces = compoWorkspace.GetGroups();
    let tabsCount = compoTabManager.CountAll();
    
    if (workspaces.length == 0) {
      viewStateUtil.Add('workspace', ['no-workspace']);
      viewStateUtil.Remove('workspace', ['has-workspace']);
    } else {
      viewStateUtil.Remove('workspace', ['no-workspace']);
      if (tabsCount > 0) {
        viewStateUtil.Remove('workspace', ['no-open-workspace']);
        viewStateUtil.Add('workspace', ['has-workspace']);
      } else {
        viewStateUtil.Remove('workspace', ['has-workspace']);
        viewStateUtil.Add('workspace', ['no-open-workspace']);
      }
    }
  }
  
  function ListWorkspace() {
    let workspaces = compoWorkspace.GetGroups();
    let docFrag = document.createDocumentFragment();
  
    for (let item of workspaces) {
      let el = window.templateSlot.fill({
        data: item, 
        template: document.querySelector('#tmp-list-workspace').content.cloneNode(true), 
      });
      
      el.querySelector('[data-kind="itemWorkspace"]').dataset.id = item.id;
      docFrag.append(el);
    }

    $('#container-workspace')?.replaceChildren('');
    $('#container-workspace')?.append(docFrag);
    
    HighlightActiveWorkspace();
    RefreshWorkspaceState();
  }
  
  function HighlightActiveWorkspace() {
    let activeWorkspaceId = compoWorkspace.GetActiveId();
    for (let el of $$('#container-workspace [data-kind="itemWorkspace"]')) {
      let isActive = (el.dataset.id == activeWorkspaceId);
      el.classList.toggle('is-active', isActive);
    }
  }
  
  return SELF;
  
})();