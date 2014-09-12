$("#dropdown").change(function() {
    	console.log('here')
        var selVal = $(this).val();
        console.log(selVal)
        $("#textboxDiv").html('');
        if(selVal > 0) {
            for(var i = 1; i<= selVal; i++) {
                $("#textboxDiv").append('<input type="text" name="textVal[]" value="test" />');
            }
        }
    });