function alertMessage(message, status, location, isautoclosing) {
    
    if(!['top-center','bottom-center','top-left','top-right','bottom-right','bottom-left'].includes(location)){
      location="top-center";
    }
    
    if(!['success','warning','danger','info'].includes(status)){
      status="info";
    }
    
    if(typeof isautoclosing === 'undefined'){
      isautoclosing=false;
    }

    const alert = document.createElement("div");
    const alertIcon = document.createElement("div");
    const alertContent = document.createElement("div");
    const alertMessage = document.createElement("div");
    const alertDismiss = document.createElement("div");

    const delay = 100;
    
    // alert
    alert.className = "alert";
    setTimeout(function () {
      alert.classList.add("alert-active");
      alert.classList.add(`alert-${status}`);
    }, delay);

    // content
    alertContent.className = "alert-content";

    // message
    alertMessage.className = "alert-message";
    alertMessage.innerHTML = message;
   
    // icon
    alertIcon.className = "alert-icon ";

    // dismiss
    alertDismiss.className = "alert-dismiss";

    // append
    alertContent.appendChild(alertIcon);
    alertContent.appendChild(alertMessage);
    alert.appendChild(alertContent);
    alert.appendChild(alertDismiss);

    // add to dom
    addDom(alert, location);

    // auto closing
    if(isautoclosing){
      setTimeout(function () {
        alert.classList.remove("alert-active");
        alert.classList.add("alert-closing");
  
        // remove element from dom
        setTimeout(function () {
          alert.remove();
        }, 500);
      }, 10000 + delay);
    }

    // remove by clicking
    function dismissAlert(event) {
      if (event.target.parentElement.classList.contains("alert")) {
        // console.log("true");
        const alert = event.target.parentElement;
        alert.classList.remove("alert-active");
        alert.classList.add("alert-closing");
        setTimeout(function () {
          alert.remove();
        }, 500);
      }
    }
    
    document.addEventListener("click", dismissAlert);
  }
   
  function addDom(alert, location) {
    // si encuentra la clase no crear 
    let classlocation='alert-wrapper alert-'+location;
    let toast=document.getElementsByClassName(classlocation);
    if(toast.length>0){
      toast[0].prepend(alert);
    }else{
      toast = document.createElement("div");
      toast.className=classlocation;
      document.body.insertBefore(toast, document.body.firstChild);
      toast.prepend(alert);
    };
  }