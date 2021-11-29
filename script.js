function playsong() {
  document.getElementById("Player").pause();
}

function pausesong() {
  document.getElementById("Player").pause();
}

function stopsong() {
  var player = document.getElementById("Player");
  player.pause();
  player.currentTime = 0;
}

function forwardAudio() {
  var player = document.getElementById("Player");
  player.currentTime += 30.0;
}