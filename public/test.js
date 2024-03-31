import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";

class Recipe {
    constructor(ids, totalCost) {
        this.ids = ids;
        this.totalCost = totalCost;
    }
    getIDs() {
        return this.ids;
    }
    getCost() {
        return this.totalCost;
    }
}

async function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        const id = nameToID[input];
        console.log(id);
        for (let i = 0; i < id.length; i++) {
            console.log(fixID(id[i]));
            /*
            if (recipes.hasOwnProperty(id[i])) {
                console.log(recipes[id[i]]);
            }
            */
        }
       getAveragePrices();
    }

}

function fixID(id) {
    return id.replace(/(@)(.)/,(match,p1,p2,offset,string)=>{
        return p2+"@"+p2;
    });
}

function calculateProfit(itemID,tax) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}

/*
function getCraftingPrice(itemID) {
    try {
        const sellPrice = getAveragePrices(itemID);
    } catch {
        throw new Error(`No sell price found for ${itemID}`);
    }
    const recipes = getRecipes(itemID);
    let lowestPrice;
    for (let i = 0; i < recipes.length; i++) {
        for (let j = 0; j < recipes[i].length; j++) {

        }
    }
    // Return an array containing all ingredients
}
*/

function getRecipes(itemID) {
    //fill in
}

/**
 * 
 * @param {Array} itemIDs An array of the item IDs of the items you want to find prices of
 */
async function getAveragePrices(itemIDs) {
    let targetURL = "https://west.albion-online-data.com/api/v2/stats/history/T4_BAG?date=3-20-2024&end_date=3-30-2024&locations=Caerleon,Bridgewatch&time-scale=1"
    const response = await fetch(targetURL);
    const priceData = await response.json();
    console.log(priceData);
}

// Get document of names to ids
// Get document of recipe paths
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const names = Object.keys(nameToIDDoc.data());
$("#my-button").on("click", getIDFromName);
$( "#item-name" ).autocomplete({
    source: names
 });
