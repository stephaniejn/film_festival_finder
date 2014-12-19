$(function(){

  $('#country').chosen()

	$('.deleteFav').on('click', function(event) 
		{
			console.log("clicking!")
		event.preventDefault();
		// alert($(this).data('id'))

		var thisDeleteButton = $(this);

		$.ajax({
			url:'/favoriteList/'+thisDeleteButton.data('id'),
			type: 'DELETE',
			success: function(result){
				thisDeleteButton.closest('div').fadeOut('slow', function(){
					$(this).remove();
				});
			}
		})
	})
	$( "#datepicker" ).datepicker();
	$( "#datepicker2" ).datepicker();

})


