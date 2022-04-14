const express = require("express")
const axios = require("axios")
const app = express()
const path = require('path')

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public.css'))

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
const restaurants = [
    {
        name: 'Rentukka',
        id: 206838,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/muut/ravintola-rentukka/'
    },
    {
        name: 'Taide',
        id: 321708,
        company: foodandco,
        website: 'https://www.foodandco.fi/ravintolat/Ravintolat-kaupungeittain/jyvaskyla/taide/'
    },
    {
        name: 'Lozzi',
        id: 207272,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/seminaarimaki/lozzi/'
    },
    {
        name: 'Piato',
        id: 207735,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/mattilanniemi/piato/'
    },
    {
        name: 'Maija',
        id: 207659,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/mattilanniemi/maija/'
    },
    {
        name: 'Ylistö',
        id: 207103,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/ylistonrinne/ravintola-ylisto/'
    },
    {
        name: 'Fiilu',
        id: 231260,
        company: foodandco,
        website: 'https://www.foodandco.fi/ravintolat/Ravintolat-kaupungeittain/jyvaskyla/fiilu/'
    },
    {
        name: 'Syke',
        id: 207483,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/seminaarimaki/kahvila-syke/'
    },
    {
        name: 'Uno',
        id: 207190,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/ruusupuisto/ravintola-uno/'
    },
    {
        name: 'Kvarkki',
        id: 207038,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/ylistonrinne/kahvila-kvarkki/'
    },
    {
        name: 'Belvedere',
        id: 207354,
        company: semma,
        website: 'https://www.semma.fi/ravintolat2/seminaarimaki/belvedere/'
    }
]

// This is where the menus of the restarants is going to get stored
let restaurantMenusArray = []
let sortedMealArray = []

app.get("/", async (req, res) => {
        try {
            await getFoodMenu(restaurants)
            sortedMealArray.sort((a, b) => {
                if (a.KcalPerProtein > b.KcalPerProtein) {
                    return 1
                } else {
                    return -1
                }
            })
            res.render('home', { sortedMealArray})
        } 
        catch (e) {
            res.render('error')
            console.log(e);
        }
    }
)

// Gets the menu from the Semma API
async function getFoodMenu (restaurants) {
    // Empties the arrays
    restaurantMenusArray = []
    sortedMealArray = []

    for (const restaurant of restaurants) {
        if (day === -1) {
            day = 6
        }
        try {
            console.log(restaurant.name);
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
                    mealPart.Website = restaurant.website
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
    catch (e) {
        console.log(e);
    }
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