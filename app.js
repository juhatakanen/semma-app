const express = require("express")
const app = express()
const axios = require("axios")
const path = require('path')
const fs = require('fs')
const puppeteer = require("puppeteer")
const { Cluster } = require('puppeteer-cluster');

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public.css'))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, '/views'))
  
const semma = 'semma'
const foodandco = 'foodandco'
  
  // These are the restaurants where the data is going to be searched, based in the ID
  const restaurants = [
        // {
        //   name: 'Rentukka',
        //   id: 206838,
        //   company: semma,
        //   website: 'https://www.semma.fi/ravintolat2/muut/ravintola-rentukka/'
        // }
        // {
        //     name: 'Taide',
        //     id: 321708,
        //     company: foodandco,
        //     website: 'https://www.foodandco.fi/ravintolat/Ravintolat-kaupungeittain/jyvaskyla/taide/'
        // },
        // {
        //     name: 'Lozzi',
        //     id: 207272,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/seminaarimaki/lozzi/'
        // },
        // {
        //     name: 'Piato',
        //     id: 207735,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/mattilanniemi/piato/'
        // },
        // {
        //     name: 'Maija',
        //     id: 207659,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/mattilanniemi/maija/'
        // },
        // {
        //     name: 'Ylistö',
        //     id: 207103,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/ylistonrinne/ravintola-ylisto/'
        // },
        // {
        //     name: 'Fiilu',
        //     id: 231260,
        //     company: foodandco,
        //     website: 'https://www.foodandco.fi/ravintolat/Ravintolat-kaupungeittain/jyvaskyla/fiilu/'
        // },
        // {
        //     name: 'Syke',
        //     id: 207483,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/seminaarimaki/kahvila-syke/'
        // },
        // {
        //     name: 'Uno',
        //     id: 207190,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/ruusupuisto/ravintola-uno/'
        // },
        // {
        //     name: 'Kvarkki',
        //     id: 207038,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/ylistonrinne/kahvila-kvarkki/'
        // },
        // {
        //     name: 'Belvedere',
        //     id: 207354,
        //     company: semma,
        //     website: 'https://www.semma.fi/ravintolat2/seminaarimaki/belvedere/'
        // }
    ]
  const puppeteerRestaurants = [
        {
          name: 'Ilokivi',
          id: 97032,
          website: 'https://fi.jamix.cloud/apps/menu/?anro=97032&k=1&mt=1'
        }
    ]
    
    // This is where the menus of the restarants is going to get stored

    let sortedMealArray = []
    
    app.get("/", (req, res) => {
        let data = require('./data.json')
        let time = (fs.readFileSync('lastUpdateTime.txt')).toString();
        res.render('home', { data , time })
        }
    )

    app.get("/update", async (req, res) => {
            try {
                sortedMealArrayInGet = await getFoodMenu(restaurants)
                await getPuppeteerFood(sortedMealArrayInGet)
                sortedMealArrayInGet.sort((a, b) => {
                    if (a.KcalPerProtein > b.KcalPerProtein) {
                        return 1
                    } else {
                        return -1
                    }
                })
                let dataToWrite = JSON.stringify(sortedMealArrayInGet);
                fs.writeFileSync('data.json', dataToWrite);
        
            

                
                let data = require('./data.json')
                let time = (fs.readFileSync('lastUpdateTime.txt')).toString();
                res.render('home', { data , time })
            } 
            catch (e) {
                res.render('error')
                console.log(e);
            }
        }
    )

    // Gets the menu from the Semma API
    async function getFoodMenu (restaurants) {
        let fullDate = new Date()
        let day = fullDate.getDay() - 1
        let date = fullDate.getDate()
        let month = fullDate.getMonth() + 1
        let year = fullDate.getFullYear()

        // Empties the array
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
            }
            catch (e) {
                console.log(e);
            }
        }
 
        let lastUpdateTime = `${date}.${month}.${year} at ${fullDate.toLocaleTimeString("en-GB")}`
        fs.writeFileSync('lastUpdateTime.txt', lastUpdateTime);
        
        return sortedMealArray
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

    async function getPuppeteerFood(sortedMealArrayInGet)  {
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            puppeteerOptions: {
                headless: false,
                slowMo: 150
            }
          })
          await cluster.queue(`https://fi.jamix.cloud/apps/menu/?anro=97032&k=1&mt=1`)
          await cluster.task(async ({ page, data: url }) => {
            await page.goto(url, {'waitUntil' : 'networkidle2'})
            const amount = await page.evaluate(() => {
                let amountToReturn = document.querySelectorAll('.v-button.v-widget.multiline.v-button-multiline.icon-align-right.v-button-icon-align-right.v-has-width')
                return amountToReturn.length
            })
            const ravintoarvotButton = "#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(3) > div"
            const edellinenButton = "#main-view > div > div > div:nth-child(1) > div > div > div > div.button-navigation.button-navigation--previous > div"
            const firstMealPartButton = "#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(5) > div > div:nth-child(3) > div"
            const secondMealPartButton = "#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(5) > div > div:nth-child(5) > div"
            console.log(amount);
            await page.click("#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(1) > div")
            await page.click(`${ravintoarvotButton}`)
            await page.click(`${firstMealPartButton}`)
            async function getInfo() {
                
                const evaluate = await page.evaluate(() => {
                    const values = []
                    let nameFromPuppeteer = document.querySelector("#main-view > div > div > div:nth-child(1) > div > div > div > div.caption-container > div.sub-caption-container > div.label-sub-caption > div")
                    const valuesFromPuppeteer = document.querySelectorAll("li span")
                    valuesFromPuppeteer.forEach((value) => {
                        values.push( value.innerHTML.toString() )
                    })
                    let arrayToReturn = [nameFromPuppeteer.innerHTML, values.join()]
                    return arrayToReturn
                })
                let protein = proteinNumberFPuppeteer(evaluate[1])
                let kcal = kcalNumberFPuppeteer(evaluate[1])
                let mealPart = {
                    Name: evaluate[0],
                    Protein : protein,
                    Kcal : kcal,
                    KcalPerProtein : Math.round((kcal / protein) * 100) / 100,
                    Salt : saltNumberFPuppeteer(evaluate[1]),
                    Restaurant : puppeteerRestaurants[0].name,
                    Website : puppeteerRestaurants[0].website
                }
                
                sortedMealArrayInGet.push(mealPart)
            }
            getInfo()
            await page.click(`${edellinenButton}`)
            await page.click(`${secondMealPartButton}`)
            getInfo()
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click("#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(3) > div")
            await page.click(`${ravintoarvotButton}`)
            await page.click(`${firstMealPartButton}`)
            getInfo()
            await page.click(`${edellinenButton}`)
            await page.click(`${secondMealPartButton}`)
            getInfo()
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click("#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(5) > div")
            await page.click(`${ravintoarvotButton}`)
            await page.click(`${firstMealPartButton}`)
            getInfo()
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click(`${edellinenButton}`)
            await page.click("#main-view > div > div > div.v-slot.v-slot-main-view__content.v-slot-borderless.v-align-center.v-align-middle > div > div.v-panel-content.v-panel-content-main-view__content.v-panel-content-borderless.v-scrollable > div > div:nth-child(7) > div")
            await page.click(`${ravintoarvotButton}`)
            await page.click(`${firstMealPartButton}`)
            getInfo()
            console.log(protein, kcal);
            return sortedMealArrayInGet
        }
          )
          await cluster.idle();
          await cluster.close();
        }

        function proteinNumberFPuppeteer(food) {
            const proteinCommaArray = /(?<=Proteiini,)...../.exec(food)
            const proteinNumber = Number(proteinCommaArray[0].replace(/,/g, '.')) 
            return proteinNumber
        }
        function kcalNumberFPuppeteer(food) {
            const kcalCommaArray = /(?<=Energia,).../.exec(food)
            const kcalNumber = Number(kcalCommaArray[0])
            return kcalNumber
        }
        function saltNumberFPuppeteer(food) {
            const saltCommaArray = /(?<=Suola,)..../.exec(food)
            const saltNumber = Number(saltCommaArray[0].replace(/,/g, '.')) 
            return saltNumber
        }
        
        // {"Name":"Karamellisoitua kassleria ja kasvispaistosta","RecipeId":19960,"Diets":["A","G","L","M","VS"],"Nutrients":null,"IconUrl":"","Protein":18.1,"Kcal":224,"KcalPerProtein":12.38,"Salt":1.7,"Restaurant":"Rentukka","Website":"https://www.semma.fi/ravintolat2/muut/ravintola-rentukka/"}
    

  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }
  app.listen(port);