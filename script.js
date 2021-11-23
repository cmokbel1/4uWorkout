axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(res => {
          const exercise = res.data
          let dataLog = console.log(exercise)
          console.log(exercise[0]);
          console.log(exercise.length);


          let bodyParts = ["lower legs", "upper legs", "lower arms", "upper arms", "chest", "cardio","shoulders", "back", "waist"]

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

          console.log(waistArrayUrl);
          console.log(waistArrayName); // these console legs test to print both arrays of the url and the name, the numbers correspond.
          // to implement, just change the html to the url and the name at the index of the randomly generator index.


          

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





$('#btn').click(function () {
  console.log('ping')
})