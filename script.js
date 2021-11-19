document.getElementById('search')addEventListener('click', event => {
  event.preventDefault()
    const cocktail = document.getElementById('randomCocktail')

  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/random.php/`)
    .then(res => {
      const beer = res.data
      let dataLog = console.log(beer)
      let cocktailName = (beer.drinks[0].strDrink);
      let cocktailPic = beer.drinks[0].strDrinkThumb
      let cocktailIng1 = beer.drinks[0].strIngredient1
      let cocktailIng2 = beer.drinks[0].strIngredient2
      console.log(cocktailName);

      document.getElementById('cocktailHTML').innerHTML = `
            <h1 class = "drinkName">${cocktailName}</h1>
            <img src='${cocktailPic}' alt = "Picture of Cocktail">
            <h2 class = "ingredient">Main Ingredient: ${cocktailIng1}</h2>
            <h2 class = "ingredient">Secondary Ingredient: ${cocktailIng2}</h2>
            `
    })
    .catch(err => console.log(err))

  })


