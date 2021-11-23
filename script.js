axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(res => {
          const exercise = res.data
          let dataLog = console.log(exercise)
          console.log(exercise[0]);
          console.log(exercise.length);

          let input = prompt("Enter lower")
          let lowerArray = [];
          for (let i = 0; i < lowerArray.length; i++) {
            `${input}Array`.push(lowerArray)
            
          }

          let waistCounter = 0;
          let upperLegsCounter = 0;
          let backCounter = 0;
          let chestCounter = 0;
          let upperArmsCounter = 0;
          let cardioCounter = 0;
          let shoulderCounter = 0;
          let lowerLegsCounter = 0;
          let lowerArmsCounter = 0;

          let bodyParts = ["lower legs", "upper legs", "lower arms", "upper arms", "chest", "cardio","shoulders", "back", "waist"]
          
            document.getElementById('workoutHTML').innerHTML = `
            <h1>${exercise[0].bodyPart}</h1>
            <img src="${exercise[0].gifUrl}" alt="">
            `
          for (let i = 0; i < exercise.length; i++) {
            // console.log(exercise[i].bodyPart);
            if (exercise[i].bodyPart == "waist") {
              waistCounter++
            }
            if (exercise[i].bodyPart == "upper legs") {
              upperLegsCounter++
            }
            if (exercise[i].bodyPart == "back") {
              backCounter++
            }
            if (exercise[i].bodyPart == "chest") {
              chestCounter++
            }
            if (exercise[i].bodyPart == "upper arms") {
              upperArmsCounter++
            }
            if (exercise[i].bodyPart == "cardio") {
              cardioCounter++
            }
            if (exercise[i].bodyPart == "shoulders") {
              shoulderCounter++
            }
            if (exercise[i].bodyPart == "lower legs") {
              lowerLegsCounter++
            }
            if (exercise[i].bodyPart == "lower arms") {
              lowerArmsCounter++
            }
            
          }

          console.log(waistCounter);
          console.log(upperLegsCounter);
          console.log(backCounter);
          console.log(chestCounter);
          console.log(upperArmsCounter);
          console.log(cardioCounter);
          console.log(shoulderCounter);
          console.log(lowerLegsCounter);
          console.log(lowerArmsCounter);


          console.log(waistCounter + upperLegsCounter + backCounter + chestCounter + upperArmsCounter + cardioCounter+ shoulderCounter+ lowerLegsCounter+ lowerArmsCounter +" out of 1327");

        })
        .catch(err => console.log(err))




// const options = {
//   method: 'GET',
//   url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
//   params: {country_code: 'US', genre_code: 'POP', limit: '50'},
//   headers: {
//     'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
//     'x-rapidapi-key': '8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953'
//   }
// };

// axios.request(options).then(function (music) {
// 	console.log(music.data[0]);

          
//   document.getElementById('musicHTML').innerHTML = `
//   <h1>${music.data[0].title}</h1>
//   <img src="${music.data[0].images.background}" alt="">
//   `


// }).catch(function (error) {
// 	console.error(error);
// });

//------------------------------------------------------------------------------------------------ ABOVE IS API FUNCTIONS, NO NEED TO EDIT ----



// document.getElementById("workoutHTML").innerHTML = `
// <h1>qwd</h1>
// `

$('#btn').click(function () {
  console.log('ping')
})