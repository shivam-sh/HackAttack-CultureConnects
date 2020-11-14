var me = new Peer({
	host: location.hostname,
	port: location.port || (location.protocol === 'https:' ? 443 : 80),
	path: '/peerjs'
})


var peerID;
var connected = false;
var people = [];
var connectedPeople = [];
var mediaStream;

$('.user:eq(0)').hide()
$('.user:eq(1)').hide()
$('.user:eq(2)').hide()
$('.user:eq(3)').hide()

$('.connect-imgs').hide()
      
    
me.on('open', function() {
  peerID = me.id;
  console.log('My PeerJS ID is:', me.id);
}, function(err) {
  console.log(err);
});
      
// handle browser prefixes
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);



function joinRoom() {
  // Get access to microphone
  navigator.getUserMedia (
           
    // Only request audio
    {video: false, audio: true},

    // Success callback
    function success(localAudioStream) {
      // Do something with audio stream
      mediaStream = localAudioStream;
      
      
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/people", true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      xhr.send(`id=${peerID}&user=${$('#displayname'). val()}`);
      
      
      fetch('/people', {method: 'GET'})
        .then(function(response) {
          if(response.ok) return response.json();
          throw new Error('Request failed.');
        })
        .then(function(data) {
          connected = true;
          people = data;
          console.log(people);
        })
        .catch(function(error) {
          console.log(error);
        });
    },
    // Failure callback
    function error(err) {
      // handle error
    }
  );
}

function closeRoom() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/clear", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  xhr.send(`id=${peerID}&user=${$('#displayname'). val()}`);
  connected = false;
}

me.on('call', 
function handleIncomingCall(incoming) {
  console.log('Answering incoming call from ' + incoming.peer);
  var peer = getPeer(incoming.peer);
  peer.incoming = incoming;
  incoming.answer(mediaStream);
  peer.incoming.on('stream', function(stream) {
    addIncomingStream(peer, stream);
  });
});

// Add the new audio stream. Either from an incoming call, or
// from the response to one of our outgoing calls
function addIncomingStream(peer, stream) {
  console.log('Adding incoming stream from ' + peer.id);
  peer.incomingStream = stream;
  playStream(stream);
}

function playStream(stream) {
  console.log("Trying to play!")
  var audio = $('<audio autoplay />').appendTo('body');
    audio.srcObject = stream;
}

function getPeer(peerId) {
  var exists = -1;
  
  for(var i = 0; i < people.length; i++) {
    if (people[i].id == peerId) {
      exists = i;
    }
  }
  
  if (exists != -1) {
    return people[exists];
  } else {

    return;
  }
}


setInterval(function() {
  if (people.length > 0) {
    fetch('/people', {method: 'GET'})
    .then(function(response) {
      if(response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then(function(data) {
      people = data;
    })
    .catch(function(error) {
      console.log(error);
    });
    
    for (var i = 0; i < people.length && i < 4; i++) {
      $(`.user:eq(${i})`).show()
      $(`.user:eq(${i})`).text(people[i].user)
      
      var peer = people[i]
      
      var alreadyThere = false;
      
      for (var j = 0; j < connectedPeople.length; j++) {
        if (connectedPeople[j] == peer || peer.id == peerID) {
          alreadyThere = true || alreadyThere;
        }
      }
      
      if (!alreadyThere) {
        console.log("calling " + people[i].id)
        peer.outgoing = me.call(people[i].id, mediaStream);
        
        peer.outgoing.on('error', function(err) {
          display(err);
        })
        
        peer.outgoing.on('stream', function(stream) {
          addIncomingStream(peer, stream);
        })
        
        connectedPeople.push(peer);
      }
    }

    $('.connect-imgs').show()
    
    
  } else {
    $('.user:eq(0)').hide()
    $('.user:eq(1)').hide()
    $('.user:eq(2)').hide()
    $('.user:eq(3)').hide()

    $('.connect-imgs').hide()
  }
}, 500);