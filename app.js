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
    {
        name: 'Lozzi',
        id: 207272
    },
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

app.get("/", async (req, res) => {
        try {
            await getFoodMenu(restaurantObjectArray)
            res.render('home', { restaurantMenusArray, restaurantObjectArray })
        } 
        catch (e) {
            res.render('error')
            console.log(e);
        }
    }
)

// Gets the menu from Semma API
async function getFoodMenu (restaurantObjectArray) {
    // Empties the menu array
    restaurantMenusArray = []

    for (const restaurant of restaurantObjectArray) {
        let restaurantToGet = await axios.get(`https://www.semma.fi/api/restaurant/menu/week?language=fi&restaurantPageId=${restaurant.id}&weekDate=${year}-${month}-${date}`)
        restaurantMenusArray.push(restaurantToGet.data.LunchMenus[day].SetMenus)
    }
    return
}

function proteinNumberF(food) {
    const proteinCommaArray = /....(?=...Prote)/.exec(food.ingredients.toString())
    const proteinNumber = Number(proteinCommaArray[0].replace(/,/g, '.')) 
    return proteinNumber
  }
  
  function kcalNumberF(food) {
    const kcalCommaArray = /...(?=.kcal)/.exec(food.ingredients.toString())
    const kcalNumber = Number(kcalCommaArray[0])
    return kcalNumber
  
  }
  
  function calcProtKcal(kcalNumber, proteinNumber) {
  const kcalPerProteinG =  kcalNumber / proteinNumber
  return kcalPerProteinG
  }
  

app.listen(3000, () => {
    console.log("server on 3000");
})