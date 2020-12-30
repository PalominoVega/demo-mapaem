$(' .draggable-element').draggable({
    handle: '.card-header-gis', 
    containment :"#mibody",
    scroll:false
});

$('#div_widgets').on('click', '.icon-close', function(event) { //cerrar card con icon-close
    event.preventDefault();
	$(this).parents('.card').removeClass('visible').addClass('notvisible');
});

$('#div_menu').on('click', '.item-menu', function(){
    let $container=$(this).attr('data-subcontainer');
    $($container).toggleClass('visible notvisible');
})

// widget
$('.modo3d .dropdown-menu').on('click', function (e) {
    e.stopPropagation();
});

$('#div_results').on('click', '.btn-tbltoggle', function(e){
    e.preventDefault();
    $(this).toggleClass('icon-caret-up icon-caret-down');
    $(this).parents('.card').toggleClass('max-size min-size');
})


//Leyenda
$('#div_view').on('click', '#btn_minlegend', function () {
    $('#div_btnmaximizadores').show(400);
    $('#wg_leyend').hide(400);
});

$('#div_btnmaximizadores').on('click', '#btn_maxlegend', function () {
    $('#div_btnmaximizadores').hide(400);
    $('#wg_leyend').show(400);
})