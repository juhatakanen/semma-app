const express = require("express")
const axios = require("axios")
const app = express()
const path = require('path')

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, '/views'))

const fullDate = new Date()
const day = fullDate.getDay() - 1
const date = fullDate.getDate()
const month = fullDate.getMonth() + 1
const year = fullDate.getFullYear()

// These are the restaurants where the data is going to be searched, based in the ID
const restaurantObjectArray = [
    {
        name: 'Rentukka',
        id: 206838
    },
    // {
    //     name: 'Lozzi',
    //     id: 207272
    // }
    {
        name: 'Piato',
        id: 207735
    },
    {
        name: 'Maija',
        id: 207659
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
            console.log(sortedMealArray);
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
        let restaurantToGet = await axios.get(`https://www.semma.fi/api/restaurant/menu/week?language=fi&restaurantPageId=${restaurant.id}&weekDate=${year}-${month}-${date}`)
        let restaurantMenu = restaurantToGet.data.LunchMenus[day].SetMenus
    
        for (let meal of restaurantMenu) {
            for (let mealPart of meal.Meals) {
               let ingredientsData = await axios.get(`https://www.semma.fi/api/restaurant/menu/recipe?language=fi&recipeId=${mealPart.RecipeId}`)
               let protein = proteinNumberF(ingredientsData.data.Ingredients)
               let kcal = kcalNumberF(ingredientsData.data.Ingredients)
               mealPart.Protein = protein;
               mealPart.Kcal = kcal
               mealPart.KcalPerProtein = kcal / protein
               mealPart.Restaurant = restaurant.name
               sortedMealArray.push(mealPart);
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
  
  function kcalNumberF(food) {
    const kcalCommaArray = /...(?=.kcal)/.exec(food.toString())
    const kcalNumber = Number(kcalCommaArray[0])
    return kcalNumber
  
  }

app.listen(3000, () => {
    console.log("server on 3000");
})