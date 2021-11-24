// SEARCH BUTTON FUNCTIONS //
// added 11/22/2021//
//random workout button //

document.getElementById('randomWorkout').addEventListener('click', event => {
  // API search for excercise //
  // added 11/19/2021
  axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
    .then(res => {

      const exercise = res.data;
      // local storage to set data for exercise
      localStorage.setItem('data', JSON.stringify(exercise))
      let dataLog = console.log(exercise);
      // select random excercise from muscle group //
      let randomWorkout = Math.floor(Math.random() * exercise.length);
      // local storage for skip button for specific bodyPart
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].bodyPart))
      console.log(exercise[randomWorkout])
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].name))
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].target))
      var options = {
        method: 'GET',
        url: `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${randomWorkout}`,
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': '96154b7598mshc548ed73c637939p15a21bjsn5c928f7eb144'
        }
      };
      // edit HTML to match //
      document.getElementById('workoutHTML').innerHTML = `
            <h3>Muscle group: ${exercise[randomWorkout].bodyPart}</h3>
            <h4>Target(s): ${exercise[randomWorkout].target}</h4>
            <h4>Name of Workout: ${exercise[randomWorkout].name}</h4>
            <img src="${exercise[randomWorkout].gifUrl}" alt="">
            `;
      // splice workout from array once used //
      exercise.splice('randomWorkout', 1);

    })
    .catch(err => console.log(err));


})

// RANDOMIZE DA MUSIC //
//added 11/22/21//
// genre array
genres = ['POP', 'HIP_HOP_RAP', 'DANCE', 'ELECTRONIC', 'SOUL_RNB', 'ALTERNATIVE', 'ROCK', 'LATIN', 'FILM_TV', 'COUNTRY', 'AFRO_BEATS', 'WORLDWIDE', 'REGGAE_DANCE_HALL', 'HOUSE', 'K_POP', 'FRENCH_POP', 'SINGER_SONGWRITER', 'REG_MEXICO']
//api code added 11/19/21//

 

// let bodyParts = ["lower legs", "upper legs", "lower arms", "upper arms", "chest", "cardio", "shoulders", "back", "waist"]

//Skip Workout button
document.getElementById('skipWorkout').addEventListener('click', skip)

function skip() {
  //retrieve bodyPart workout
  let exerciseType = JSON.parse(localStorage.getItem("type"))
  //retrieve data for exercises
  let exercises = JSON.parse(localStorage.getItem("data"))

  // console.log(exerciseType)
  //filter exercises to specific bodyPart
  let filteredExercises = exercises.filter(item => item.bodyPart === exerciseType || item.name === exerciseType || item.target === exerciseType) 
  console.log(filteredExercises)
  //randomize filteredExercises for specific bodyPart
  let specificBodypartWorkout = filteredExercises[Math.floor(Math.random() * filteredExercises.length)];
  console.log(specificBodypartWorkout)
  document.getElementById('workoutHTML').innerHTML = `
        <h3>Muscle Group: ${specificBodypartWorkout.bodyPart}</h3>
        <h4>Target(s): ${specificBodypartWorkout.target}</h4>
        <h4>Name of Workout: ${specificBodypartWorkout.name}</h4>
        <img src="${specificBodypartWorkout.gifUrl}" alt="">
            `;
}

//function to hide buttons before search button
function showButtons() {
  document.getElementById('showButtons').style.display = "block";
}

//function to hide start screen, hide image and btn
function showCards() {
  document.getElementById('showFunctionCards').style.display = "block";
  document.getElementById('startScreen').style.display = "none";

}


//-------------------------------------------------------- BELOW IS MUSIC GENRE EVENT LISTENERS


popDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Pop`

})
hiphopDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Hip Hop`

})
rockDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Rock`

})
filmDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Film`

})
electronicDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Electronic`

})
alternativeDrop.addEventListener("click", Event =>{
  document.getElementById("titleDrop").innerText = `Alternative`

})

playlistMusic.addEventListener("click", Event =>{

let genre = titleDrop.innerText

if(genre == "Pop"){
  genre = "POP"
  console.log(genre);
}
if(genre == "Hip Hop"){
  genre = "HIP_HOP_RAP"
  console.log(genre);
}
if(genre == "Rock"){
  genre = "ROCK"
  console.log(genre);
}
if(genre == "Film"){
  genre = "FILM_TV"
  console.log(genre);
}
if(genre == "Electronic"){
  genre = "ELECTRONIC"
  console.log(genre);
}
if(genre == "Alternative"){
  genre = "ALTERNATIVE"
  console.log(genre);
}





const options = {
  method: 'GET',
  url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
  params: { country_code: 'US', genre_code: `${genre}`, limit: '50' },
  headers: {
    'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
    'x-rapidapi-key': '321bd4bca0msh582df64d6374373p15da64jsn5c07f585d9d7'
  }
};
// requesting data from api //
axios.request(options).then(function (music) {
  console.log(music.data);




  let randomNum = Math.floor(Math.random() * 50)
  music.data.splice(randomNum, 1)

}).catch(function (error) {
  console.error(error);
});





})

//-------------------------------------------------------- ABOVE IS MUSIC GENRE EVENT LISTENERS
