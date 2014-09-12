function verify(email, password){
    $.getJSON( "http://services.mapossum.org/verify?email=" + email + "&password=" + password + "&callback=?", function( data ) {
      console.log(data.location)
      map.panTo([50, 30]);
    });
}

function addUser(email, password, affiliation, first, last, location){
    $.getJSON( "http://services.mapossum.org/adduser?email=" + email + "&password=" + password + "&affiliation=" + affiliation + "&first=" + first + "&last=" + last + "&location=" + location +"&callback=?", function( data ) {
      console.log(data)      
    });
}