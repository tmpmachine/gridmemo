let compoNotif = (function() {
  
  let SELF = {
    Pop,
  };
  
  let timeout = null;
  
  function Pop(text = '') {
    let host = pipWindow ? pipWindow.document : document;
    let notif = host.querySelector('#notif');
    notif.querySelector('.notif').textContent = text;
    notif.classList.add('_active');
    window.clearTimeout(timeout);
    timeout = window.setTimeout(close, 2000);
  }
  
  function close() {
    let host = pipWindow ? pipWindow.document : document;
    let notif = host.querySelector('#notif');
    notif.classList.remove('_active');
  }
  
  return SELF;
  
})();