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

function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        let id = structuredClone(nameToID[input]);
        console.log(id);
        id.forEach((element,index,array) => {
            // Add in a number before the @ so that it functions correctly for albion online data api
            const secondValue = parseInt(element.charAt(1));
            if (element.charAt(0) == "T" && secondValue != NaN) {
                // Current item has different tiers since it is T-some number
                const stringRemainder = element.slice(2);
                for (let i = MIN_TIER; i < MAX_TIER; i++) {
                    if (i != secondValue) {
                        array.push("T"+i+stringRemainder);
                    }
                }
            }
        });
        console.log(id);
       //getAveragePrices();
    }

}

function getRecipeIDs() {

}

function calculateProfit(itemID,tax) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}

// Get document of names to ids
// Get document of recipe paths
const MIN_TIER = 4;
const MAX_TIER = 8;
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const names = Object.keys(nameToIDDoc.data());
$("#my-button").on("click", getIDFromName);
$( "#item-name" ).autocomplete({
    source: names
 });
