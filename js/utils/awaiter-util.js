let utilAwaiter = (function() {
  
  let SELF = {
    WaitUntilAsync,
  };
  
  function WaitUntilAsync(stateCheckCallback, delay = 100) {
    return new Promise(resolve => {
        let interval = window.setInterval(() => {
        let shouldResolve = stateCheckCallback();
        if (shouldResolve) {
            window.clearInterval(interval);
            resolve();
        }
        }, delay);
    });
  }
  
  return SELF;
  
})();