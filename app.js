const express = require("express")
const axios = require("axios")
const app = express()
const path = require('path')

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, '/views'))

const fullDate = new Date()
let day = fullDate.getDay() - 1
const date = fullDate.getDate()
const month = fullDate.getMonth() + 1
const year = fullDate.getFullYear()

const semma = 'semma'
const foodandco = 'foodandco'

// These are the restaurants where the data is going to be searched, based in the ID
const restaurantObjectArray = [
    {
        name: 'Rentukka',
        id: 206838,
        company: semma
    },
    {
        name: 'Taide',
        id: 321708,
        company: foodandco
    },
    {
        name: 'Lozzi',
        id: 207272,
        company: semma
    },
    {
        name: 'Piato',
        id: 207735,
        company: semma
    },
    {
        name: 'Maija',
        id: 207659,
        company: semma
    },
    {
        name: 'Ylistö',
        id: 207103,
        company: semma
    },
    {
        name: 'Fiilu',
        id: 231260,
        company: foodandco
    },
    {
        name: 'Syke',
        id: 207483,
        company: semma
    },
    {
        name: 'Uno',
        id: 207190,
        company: semma
    },
    {
        name: 'Kvarkki',
        id: 207038,
        company: semma
    },
    {
        name: 'Belvedere',
        id: 207354,
        company: semma
    }
]

// This is where the menus of the restarants is going to get stored
let restaurantMenusArray = []
let sortedMealArray = []

app.get("/", async (req, res) => {
        try {
            await getFoodMenu(restaurantObjectArray)
            sortedMealArray.sort((a, b) => {
                if (a.KcalPerProtein > b.KcalPerProtein) {
                    return 1
                } else {
                    return -1
                }
            })
            res.render('home', { restaurantMenusArray, restaurantObjectArray, sortedMealArray})
        } 
        catch (e) {
            res.render('error')
            console.log(e);
        }
    }
)

// Gets the menu from the Semma API
async function getFoodMenu (restaurantObjectArray) {
    // Empties the arrays
    restaurantMenusArray = []
    sortedMealArray = []

    for (const restaurant of restaurantObjectArray) {
        if (day === -1) {
            day = 6
        }
        let restaurantToGet = await axios.get(`https://www.${restaurant.company}.fi/api/restaurant/menu/week?language=fi&restaurantPageId=${restaurant.id}&weekDate=${year}-${month}-${date}`)
        let restaurantMenu = restaurantToGet.data.LunchMenus[day].SetMenus
    
        for (let meal of restaurantMenu) {
            for (let mealPart of meal.Meals) {
                let ingredientsData = await axios.get(`https://www.${restaurant.company}.fi/api/restaurant/menu/recipe?language=fi&recipeId=${mealPart.RecipeId}`)
                if (ingredientsData.data.Ingredients) {
                    let protein = proteinNumberF(ingredientsData.data.Ingredients)
                    let salt = saltNumberF(ingredientsData.data.Ingredients)
                    let kcal = kcalNumberF(ingredientsData.data.Ingredients)
                    mealPart.Protein = protein;
                    mealPart.Kcal = kcal
                    mealPart.KcalPerProtein = Math.round((kcal / protein) * 100) / 100
                    mealPart.Salt = salt
                    mealPart.Restaurant = restaurant.name
                    sortedMealArray.push(mealPart);
                } else {
                    mealPart.Protein = 10000;
                    mealPart.Kcal = 10000;
                    mealPart.Salt = 10000;
                    mealPart.KcalPerProtein = 10000;
                    mealPart.Restaurant = restaurant.name
                    sortedMealArray.push(mealPart)
                }
            }
        }
        restaurantMenusArray.push(restaurantMenu)
    }
    return
}

function proteinNumberF(food) {
    const proteinCommaArray = /....(?=...Prote)/.exec(food.toString())
    const proteinNumber = Number(proteinCommaArray[0].replace(/,/g, '.')) 
    return proteinNumber
  }
function saltNumberF(food) {
    const saltCommaArray = /....(?=...Suola)/.exec(food.toString())
    const saltNumber = Number(saltCommaArray[0].replace(/,/g, '.')) 
    return saltNumber
  }
  
  function kcalNumberF(food) {
    const kcalCommaArray = /...(?=.kcal)/.exec(food.toString())
    const kcalNumber = Number(kcalCommaArray[0])
    return kcalNumber
  }

  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }
  app.listen(port);