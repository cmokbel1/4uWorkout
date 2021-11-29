

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
// SEARCH BUTTON FUNCTIONS //
// added 11/22/2021//
//random workout button //
// let workoutList = document.getElementById('workoutList')
let searchBar = document.getElementById('searchBar')
let searchType = ""
let searchIndex = 0
// let workouts = [];
// console.log(searchBar);
// console.log(searchBar)

function search() {
  searchType = "search"
  let search = searchBar.value
  axios.get('https://exercisedb.p.rapidapi.com/exercises/bodyPart/' + search + '?rapidapi-key=321bd4bca0msh582df64d6374373p15da64jsn5c07f585d9d7')
    .then(exercise => {
      console.log(exercise)
      document.getElementById('workoutHTML').innerHTML = `
            <h3>Muscle group: ${exercise.data[searchIndex].bodyPart}</h3>
            <h4>Target(s): ${exercise.data[searchIndex].target}</h4>
            <h4>Name of Workout: ${exercise.data[searchIndex].name}</h4>
            <img src="${exercise.data[searchIndex].gifUrl}" alt="">
            `;
    })
}
document.getElementById('searchWorkout').addEventListener('click', search)

// searchBar.addEventListener('keyup', (e) => {
//   console.log(e.target.value)
//   let searchSrings = e.target.value;
//   workouts.filter( exercise => {
//     return exercise.bodyPart.contain(searchString) || exercise.name.contain(searchString);
//   })
// })


document.getElementById('randomWorkout').addEventListener('click', event => {
  searchType = "random"
  // API search for excercise //
  // added 11/19/2021
  axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=321bd4bca0msh582df64d6374373p15da64jsn5c07f585d9d7`)
    .then(res => {
      
      const exercise = res.data;
      // local storage to set data for exercise
      localStorage.setItem('data', JSON.stringify(exercise))
      let dataLog = console.log(exercise);
      // select random excercise from muscle group //
      let randomWorkout = Math.floor(Math.random() * exercise.length);
      // local storage for skip button for specific bodyPart
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].bodyPart))
      // console.log(exercise[randomWorkout])
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].name))
      localStorage.setItem('type', JSON.stringify(exercise[randomWorkout].target))
      var options = {
        method: 'GET',
        url: `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${randomWorkout}`,
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': '321bd4bca0msh582df64d6374373p15da64jsn5c07f585d9d7'
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
       let waistArrayUrl = [];
       let upperLegsArrayUrl = [];
       let backArrayUrl = [];
       let chestArrayUrl = [];
       let upperArmsArrayUrl = [];
       let cardioArrayUrl = [];
       let shoulderArrayUrl = [];
       let lowerLegsArrayUrl = [];
       let lowerArmsArrayUrl = [];

       let waistArrayName = [];
       let upperLegsArrayName = [];
       let backArrayName = [];
       let chestArrayName = [];
       let upperArmsArrayName = [];
       let cardioArrayName = [];
       let shoulderArrayName = [];
       let lowerLegsArrayName = [];
       let lowerArmsArrayName = [];


       document.getElementById('workoutHTML').innerHTML = `
            <h1>${exercise[0].bodyPart}</h1>
            <img src="${exercise[0].gifUrl}" alt="">
            `
       for (let i = 0; i < exercise.length; i++) {

         if (exercise[i].bodyPart == "waist") {
           waistArrayUrl.push(exercise[i].gifUrl)
           waistArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "upper legs") {
           upperLegsArrayUrl.push(exercise[i].gifUrl)
           upperLegsArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "back") {
           backArrayUrl.push(exercise[i].gifUrl)
           backArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "chest") {
           chestArrayUrl.push(exercise[i].gifUrl)
           chestArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "upper arms") {
           upperArmsArrayUrl.push(exercise[i].gifUrl)
           upperArmsArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "cardio") {
           cardioArrayUrl.push(exercise[i].gifUrl)
           cardioArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "shoulders") {
           shoulderArrayUrl.push(exercise[i].gifUrl)
           shoulderArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "lower legs") {
           lowerLegsArrayUrl.push(exercise[i].gifUrl)
           lowerLegsArrayName.push(exercise[i].name)
         }
         if (exercise[i].bodyPart == "lower arms") {
           lowerArmsArrayUrl.push(exercise[i].gifUrl)
           lowerArmsArrayName.push(exercise[i].name)
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

 

// let bodyParts = ["lower legs", "upper legs", "lower arms", "upper arms", "chest", "cardio", "shoulders", "back", "waist"]

//Skip Workout button
document.getElementById('skipWorkout').addEventListener('click', skip)

function skip() {
  if(searchType === "search") {
    searchIndex++
    search()
    return
  }
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


//function save and display workout(s)
function saveWorkout() {
  document.getElementById('saved').style.display = "block";
  let save = document.getElementById('workoutHTML').innerHTML;
  localStorage.setItem("workoutBodypart", save);
  let saveType = localStorage.getItem("workoutBodypart") 
  console.log(saveType)
  document.getElementById('savedWorkout').innerHTML = saveType

  append()
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
// hide favorite button elements 
document.getElementById("favoriteBtnIcon").style.display = "none"
document.getElementById("favoriteBtnText").style.display = "none"
document.getElementById("favoriteBtn").style.display = "none"
// hide favorite button elements

//changes drop down text to the currently selected genre
popDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Pop`

})
hiphopDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Hip Hop`

})
rockDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Rock`

})
filmDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Film`

})
electronicDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Electronic`

})
alternativeDrop.addEventListener("click", Event => {
  document.getElementById("titleDrop").innerText = `Alternative`

})
//changes drop down text to the currently selected genre


// EVENT CLICK FOR BUILD PLAYLIST BUTTON
playlistMusic.addEventListener("click", Event => {

  let genre = titleDrop.innerText

  if (genre == "Pop") {
    genre = "POP"
    console.log(genre);
  }
  if (genre == "Hip Hop") {
    genre = "HIP_HOP_RAP"
    console.log(genre);
  }
  if (genre == "Rock") {
    genre = "ROCK"
    console.log(genre);
  }
  if (genre == "Film") {
    genre = "FILM_TV"
    console.log(genre);
  }
  if (genre == "Electronic") {
    genre = "ELECTRONIC"
    console.log(genre);
  }
  if (genre == "Alternative") {
    genre = "ALTERNATIVE"
    console.log(genre);
  }
  // EVENT CLICK FOR BUILD PLAYLIST BUTTON



  // Remove displays and appear favorite button.
  document.getElementById("playlistMusic").style.display = "none"
  document.getElementById("favoriteBtnIcon").style.display = "inline"
  document.getElementById("favoriteBtnText").style.display = "inline"
  document.getElementById("favoriteBtn").style.display = "inline"
  // Remove displays and appear favorite button.



  // API REQUEST
  const options = {
    method: 'GET',
    url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
    params: { country_code: 'US', genre_code: `${genre}`, limit: '50' },
    headers: {
      'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
      'x-rapidapi-key': '321bd4bca0msh582df64d6374373p15da64jsn5c07f585d9d7'
    }
  };

  axios.request(options).then(function (music) {
    console.log(music.data);




    let randomNum = Math.floor(Math.random() * 50)
    music.data.splice(randomNum, 1)

  }).catch(function (error) {
    console.error(error);
  });
  // API REQUEST




})

//-------------------------------------------------------- ABOVE IS MUSIC GENRE EVENT LISTENERS