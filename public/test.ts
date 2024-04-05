import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";

class Item {
    // Price will be instantiated as a group to reduce api calls
    price;
    constructor(id) {
        this.id = id;
        this.tier = this.#getTier();
        this.enchantment = this.#getEnchantment();
    }

    #getTier() {
        const secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && secondValue != NaN) {
            this.tier = secondValue;
        }
    }

    #getEnchantment() {
        const lastVal = parseInt(this.id.charAt(this.id.length-1));
        if (lastVal != NaN) {
            this.enchantment = lastVal;
        } else {
            this.enchantment = 0;
        }
    }

    toString() {
        return `id: ${id}, tier: ${tier}, enchantment: ${enchantment}, price: ${price}`;
    }
}

function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        let ids = structuredClone(nameToID[input]);
        console.log(ids);
        ids.forEach((element,index,array) => {
            // Add in a number before the @ so that it functions correctly for albion online data api
            const secondValue = parseInt(element.charAt(1));
            if (element.charAt(0) === "T" && secondValue != NaN) {
                // Current item has different tiers since it is T-some number
                const stringRemainder = element.slice(2);
                for (let i = MIN_TIER; i < MAX_TIER; i++) {
                    if (i != secondValue) {
                        array.push("T"+i+stringRemainder);
                    }
                }
            }
        });
        console.log(ids);
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
let priceQueue = []; // Array of item ids that still need their prices calculated
const items = new Map(); // HashMap of all items so far (for saving prices);
$("#my-button").on("click", getIDFromName);
$( "#item-name" ).autocomplete({
    source: names
 });
