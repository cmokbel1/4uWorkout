//Workout API
axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
  .then(res => {
    const exercise = res.data
    let dataLog = console.log(exercise)


    document.getElementById('cocktailHTML').innerHTML = `
            `


  })
  .catch(err => console.log(err))



  
//Music API//
const options = {
  method: 'GET',
  url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
  params: { country_code: 'US', genre_code: 'POP', limit: '10' },
  headers: {
    'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
    'x-rapidapi-key': '8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953'
  }
};

axios.request(options).then(function (response) {
  console.log(response.data);


}).catch(function (error) {
  console.error(error);
});