

// SEARCH BUTTON FUNCTIONS //
    // added 11/22/2021//
      //random workout button //
   document.getElementById('randomWorkout').addEventListener('click', event => {
        // API search for excercise //
        // added 11/19/2021
        axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
          .then(res => {

            const exercise = res.data;
            let dataLog = console.log(exercise);
            // select random excercise from muscle group //
            let randomWorkout = Math.floor(Math.random() * exercise.length);
           
            // edit HTML to match //
            document.getElementById('workoutHTML').innerHTML = `
            <h1>${exercise[randomWorkout].bodyPart}</h1>
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
document.getElementById('randomMusic').addEventListener('click', event => {
  // generate random number //
  let randomGenre = Math.floor(Math.random() * genres.length)
  // select random genre from genres array //
  let song = genres[randomGenre];
  console.log(song)
  const options = {
    method: 'GET',
    url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
    params: { country_code: 'US', genre_code: `${song}`, limit: '50' },
    headers: {
      'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
      'x-rapidapi-key': '8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953'
    }
  };
  // requesting data from api //
  axios.request(options).then(function (music) {
    console.log(music.data);
let randomNum = Math.floor(Math.random() * 50)
    // change html to match request //
    document.getElementById('musicHTML').innerHTML = `
    <h1>${music.data[randomNum].title}</h1>
    <h2>${music.data[randomNum].subtitle}</h2>
  <img src="${music.data[randomNum].images.background}" alt="">

  `
   // splice song from array once used //
    music.data.splice(randomNum, 1)

  }).catch(function (error) {
    console.error(error);
  });
})


// DEFINE USER WORKOUT //

// WORKOUT SEARCH BUTTON //
document.getElementById('searchWorkout').addEventListener('click', event => {
  
  axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=96154b7598mshc548ed73c637939p15a21bjsn5c928f7eb144`)
     .then(res => {
       let userWorkout = document.getElementById('inputWorkout').value.toLowerCase();
       console.log(userWorkout)
      var options = {
        method: 'GET',
        url: `https://exercisedb.p.rapidapi.com/exercises/bodyPart/%7B${userWorkout}%7D`,
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': '96154b7598mshc548ed73c637939p15a21bjsn5c928f7eb144'
              }
            };
        const exercise = res.data;
       let waistArray = [];
       let upperLegsArray = [];
       let backArray = [];
       let chestArray = [];
       let upperArmsArray = [];
       let cardioArray = [];
       let shoulderArray = [];
       let lowerLegsArray = [];
       let lowerArmsArray = [];
        console.log(exercise)

       for (let i = 0; i < exercise.length; i++) {
            if(exercise[i].bodyPart === `${userWorkout}`) {
              `${userWorkout}Array`.push(exercise[i])
            }
          }
           let  randomWorkout = Math.floor(Math.random() * `${userWorkout}Array`.length)

                   // edit HTML to match //
        document.getElementById('workoutHTML').innerHTML = `
            <h1>${userWorkout}[randomWorkout]</h1 >
            <img src=${userWorkout}[randomWorkout].gifUrl alt="">
            `;
            // splice workout from array once used //
              `${userWorkout}Array`.splice('randomWorkout', 1);

        });
      }).catch(function (error) {
        console.error(error);
      });



