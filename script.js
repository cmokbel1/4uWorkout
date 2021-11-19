axios.get(`https://exercisedb.p.rapidapi.com/exercises?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(res => {
          const beer = res.data
          let dataLog = console.log(beer)

 
            document.getElementById('cocktailHTML').innerHTML = `

            `
 

        })
        .catch(err => console.log(err))

        axios.get(`https://deezerdevs-deezer.p.rapidapi.com/genre/%7Bid%7D?rapidapi-key=8d36f60e47msha974aed1faa2b08p16ca05jsna91e6d65d953`)
        .then(mus => {
          const music = mus.data
          let dataLog = console.log(music)

 
            document.getElementById('cocktailHTML').innerHTML = `

            `
 

        })
        .catch(err => console.log(err))

