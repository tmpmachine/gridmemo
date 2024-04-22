let uiFileTab = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    HandleDblClickTab,
    HandleClickContainerTab,
    HandleMouseDownTab,
    openWorkspaceInTab,
    refreshListTab,
    openPrevTab,
    CloseOpenTab,
    closeOpenTab: CloseOpenTab,
    openNextTab,
    SetPersistentTabByWorkspaceId,
  };
  
  function handleClickActions(evt, data) {
    switch (evt.button) {
      case 1: handleMiddleClick(data); break;
    }
  }

  function handleMiddleClick(data) {
    closeFileTab(data.id);
  }

  function HandleMouseDownTab(evt) {
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="itemFileTab"]');

    if (!itemEl) return;

    let data = {
        id: itemEl.dataset.id,
    };

    handleClickActions(evt, data);
  }

  function openPrevTab() {
    let item = compoTabManager.GetPrevious();
    if (!item) return;
    
    ui.OpenWorkspaceByIdAsync(item.id);
  }
  
  function CloseOpenTab() {
    let item = compoTabManager.GetActive();
    if (!item) return;
    
    closeFileTab(item.id);
  }
  
  function openNextTab() {
    let item = compoTabManager.GetNext();
    if (!item) return;
    
    ui.OpenWorkspaceByIdAsync(item.id);
  }
  
  function openWorkspaceInTab(id) {
    let item = compoWorkspace.GetById(id);
    let tabItem = compoTabManager.GetById(id);
    
    if (tabItem) {
      if (tabItem.isTemp) {
        tabItem.isTemp = false;
      }
    } else {
      compoTabManager.Add(item.id, item.title);
    }
    compoTabManager.SetActiveById(item.id);
    
    compoTabManager.Commit();
    appData.Save();
    
    refreshListTab();
  }
  
  function HandleDblClickTab(evt) {
    let targetEl = evt.target;
    let itemEl = targetEl.closest('[data-kind="itemFileTab"]');
    if (!itemEl) return;
    
    let id = itemEl.dataset.id;
    
    SetPersistentTabByWorkspaceId(id);
  }
  
  function SetPersistentTabByWorkspaceId(id) {
    let item = compoTabManager.GetById(id);
    if (!item.isTemp) return;
    
    item.isTemp = false;
    compoTabManager.Commit();
    appData.Save();
    refreshListTab();
  }
  
  
  function HandleClickContainerTab(evt) {
    let targetEl = evt.target;
    if (!targetEl.closest('[data-kind="itemFileTab"]')) return;
    if (!targetEl.closest('[data-action]')) return;
    
    let itemEl = targetEl.closest('[data-kind="itemFileTab"]');
    if (!itemEl) return;
    
    let actionEl = targetEl.closest('[data-action]');
    if (!actionEl) return;
    
    let id = itemEl.dataset.id;
    let action = actionEl.dataset.action;
    
    switch (action) {
      case 'open': ui.OpenWorkspaceByIdAsync(id); break;
      case 'close': closeFileTab(id); break;
    }
  }
  
  function refreshListTab() {
    let items = compoTabManager.GetAll();
    let activeId = compoTabManager.GetActiveId();
    
    $('#container-tab').innerHTML = '';
    let docFrag = document.createDocumentFragment();
    
    for (let item of items) {
      
      let el = window.templateSlot.fill({
        data: item, 
        template: document.querySelector('#tmp-list-tab').content.cloneNode(true), 
      });
      
      let itemEl = el.querySelector('[data-kind="itemFileTab"]');
      
      itemEl.dataset.id = item.id;
      itemEl.classList.toggle('is-active', (item.id == activeId));
      itemEl.classList.toggle('is-temp', (item.isTemp === true));
      
      docFrag.append(el);
    }
    
    $('#container-tab').append(docFrag);
  }
  
  function setActiveTabBeforeDeletionOnId(id) {
    if (compoTabManager.CountAll() < 2) return null;
    
    let item = null;
    let lastItemIndex = compoTabManager.CountAll() - 1;
    let itemIndex = compoTabManager.GetIndexById(id);
    
    if (itemIndex == lastItemIndex) {
      item = compoTabManager.GetPrevious();
    } else {
      item = compoTabManager.GetNext();
    }
    compoTabManager.SetActiveById(item.id);
    
    return item;
  }
  
  function closeFileTab(id) {
    
    if (compoTempWorkspace.HasUnsavedChangesById(id)) {
      let isConfirm = window.confirm('Unsaved changes will be lost. Continue?');
      if (!isConfirm) return;
    }
    
    let newActiveTab = setActiveTabBeforeDeletionOnId(id);
    
    if (!newActiveTab) {
      compoWorkspace.ResetActiveId();
      compoWorkspace.Commit();
    }
    
    compoTempWorkspace.DeleteById(id);
    compoTabManager.DeleteById(id);
    compoTabManager.Commit();
    
    appData.Save();
    
    refreshListTab();
    
    if (newActiveTab) {
      ui.OpenWorkspaceByIdAsync(newActiveTab.id);
    }
    
    uiWorkspace.RefreshWorkspaceState();
  }
  
  
  return SELF;
  
})();