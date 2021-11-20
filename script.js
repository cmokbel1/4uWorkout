axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(res => {
          const beer = res.data
          let dataLog = console.log(beer)

 
            document.getElementById('cocktailHTML').innerHTML = `

            `
 

        })
        .catch(err => console.log(err))

        // axios.get(`https://theaudiodb.p.rapidapi.com/mostloved.php?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        // .then(mus => {
        //   const music = mus
        //   let dataLog = console.log(music)

 
        //     document.getElementById('cocktailHTML').innerHTML = `

        //     `
 

        // })
        // .catch(err => console.log(err))


        // const options = {
        //   method: 'GET',
        //   url: 'https://theaudiodb.p.rapidapi.com/mostloved.php',
        //   params: {format: 'track'},
        //   headers: {
        //     'x-rapidapi-host': 'theaudiodb.p.rapidapi.com',
        //     'x-rapidapi-key': '8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953'
        //   }
        // };
        
        // axios.request(options).then(function (response) {
        //     let randomVid = Math.floor(Math.random() * (50 - 1) + 1);
        //     console.log(randomVid);
        //     console.log(response.data.loved);
        //     console.log(response.data.loved[randomVid].strMusicVid);
        // }).catch(function (error) {
        //     console.error(error);
        // });



const options = {
  method: 'GET',
  url: 'https://shazam-core.p.rapidapi.com/v1/charts/genre-country',
  params: {country_code: 'US', genre_code: 'POP', limit: '10'},
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

