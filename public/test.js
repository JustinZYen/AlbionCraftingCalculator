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
        if (recipes.hasOwnProperty(id)) {
            console.log(recipes[id]);
        }
    }

}



function calculateProfit(itemID,tax) {
    const sellPrice = getAveragePrice(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}

function getCraftingPrice(itemID) {
    try {
        const sellPrice = getAveragePrice(itemID);
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

function getRecipes(itemID) {
    //fill in
}
function getAveragePrice(itemID) {
    //idk
}

// Get document of names to ids
// Get document of recipe paths
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const names = Object.keys(nameToIDDoc.data());
console.log(recipes);
$("#my-button").on("click", getIDFromName);
$( "#item-name" ).autocomplete({
    source: names
 });
