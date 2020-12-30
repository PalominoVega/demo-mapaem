define([
  "esri/core/watchUtils",
], function(
  watchUtils,
){
  var __prevextent = false,
    __preextent = null,
    __currentextent = null,
    __extenthistory = [],
    __extenthistoryIndx = 0,
    __nextextent = false;

  $('#btn_previous').on('click',function(evt){
    evt.preventDefault();
    extentHistoryChange();
    if(!$(this).hasClass("disabled")){
      if(__extenthistory[__extenthistoryIndx].preextent){
        __prevextent = true;
        __globspace.currentview.goTo(__extenthistory[__extenthistoryIndx].preextent);
        __extenthistoryIndx--;
      }
    }
  });

  $('#btn_next').on('click',function(evt){
    evt.preventDefault();
    extentHistoryChange();
    if(!$(this).hasClass("disabled")){
      __nextextent = true;
      __extenthistoryIndx++;
      __globspace.currentview.goTo(__extenthistory[__extenthistoryIndx].currentextent);
    }
  });

  watchUtils.whenTrue(__globspace.currentview, "ready", function(){
    watchUtils.whenOnce(__globspace.currentview, "extent", function(){
      watchUtils.when(__globspace.currentview, 'stationary', function(evt){
        if(evt){
          extentChangeHandler(__globspace.currentview.extent);
        }
      });
    });
  });

  function extentChangeHandler(evt){
    if(__prevextent || __nextextent){
      __currentextent = evt;
    }else{
      __preextent = __currentextent;
      __currentextent = evt;
      __extenthistory.push({
        preextent: __preextent,
        currentextent: __currentextent
      });
      __extenthistoryIndx = __extenthistory.length - 1;
    }
    __prevextent = __nextextent = false;
    extentHistoryChange();
  }


  function extentHistoryChange() {
    if(__extenthistoryIndx > __extenthistory.length - 1){
      $('#btn_next').addClass('disabled');
      __extenthistoryIndx = __extenthistory.length - 1;
    }
    if(__extenthistory.length === 0 || __extenthistoryIndx === 0 ){
      $('#btn_previous').addClass('disabled');
    } else {
      $('#btn_previous').removeClass('disabled');
    }
    if(__extenthistory.length === 0 || __extenthistoryIndx === __extenthistory.length - 1){
      $('#btn_next').addClass('disabled');
    } else {
      $('#btn_next').removeClass('disabled');
    }
  }
})