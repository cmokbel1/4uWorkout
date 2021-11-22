axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(res => {
          const exercise = res.data
          let dataLog = console.log(exercise)
          console.log(exercise[0]);

          
            document.getElementById('workoutHTML').innerHTML = `
            <h1>${exercise[0].bodyPart}</h1>
            <img src="${exercise[0].gifUrl}" alt="">
            `
 

        })
        .catch(err => console.log(err))




const options = {
  method: 'GET',
  url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
  params: {country_code: 'US', genre_code: 'POP', limit: '50'},
  headers: {
    'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
    'x-rapidapi-key': '8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953'
  }
};

axios.request(options).then(function (music) {
	console.log(music.data[0]);

          
  document.getElementById('musicHTML').innerHTML = `
  <h1>${music.data[0].title}</h1>
  <img src="${music.data[0].images.background}" alt="">
  `


}).catch(function (error) {
	console.error(error);
});

//------------------------------------------------------------------------------------------------ ABOVE IS API FUNCTIONS, NO NEED TO EDIT ----



// document.getElementById("workoutHTML").innerHTML = `
// <h1>qwd</h1>
// `

$('#btn').click(function () {
  console.log('ping')
})