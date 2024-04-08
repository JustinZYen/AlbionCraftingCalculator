import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";
const MIN_TIER = 4;
const MAX_TIER = 8;
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const idToNameDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/ID To Name"));
const idToName = idToNameDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const itemsList = await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json");
const itemsJSON = await itemsList.json();
const names = Object.keys(nameToIDDoc.data());
let priceQueue = []; // Array of item ids that still need their prices calculated
const items = new Map(); // HashMap of all items so far (for saving prices);

class Item {
    // Price will be instantiated as a group to reduce api calls
    price = NaN;
    tier = NaN;
    enchantment = 0;
    id;
    baseId;
    // Recipes will be array of recipes, which will each be arrays of "tuples"
    recipes = null;
    constructor(id) {
        this.id = id;
        this.#setbaseId();
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipes();
    }

    #setbaseId() {
        const convertedID = nameToID[idToName[this.id]];
        if (typeof convertedID == String) {
            this.baseId = convertedID;
        } else {
            this.baseId = convertedID[0];
        }
    }
    #setTier() {
        const secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && secondValue != NaN) {
            this.tier = secondValue;
        } else {
            console.log(`Id ${this.id} has no tier found`);
        }
    }

    #setEnchantment() {
        const lastVal = parseInt(this.id.charAt(this.id.length-1));
        console.log(`lastVal: ${lastVal}`);
        if (!isNaN(lastVal)) {
            this.enchantment = lastVal;
        }
    }

    #setRecipes() {
        console.log(`id: ${this.id}`);
        const path = recipes[this.id];
        if (path == null) {
            console.log(`No path found for id ${this.id}`);
            return;
        }
        let itemInfo = itemsJSON;
        path.forEach(element=>{
            itemInfo = itemInfo[element];
        })
        console.log(itemInfo);
    }

    toString() {
        return `id: ${id}, base id: ${baseId}, tier: ${tier}, enchantment: ${enchantment}, price: ${price}`;
    }
}

function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    // If input value is contained in nameToID
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
        //console.log(ids);
        let items = new Set();
        ids.forEach(element=>{
            items.add(new Item(element));
        });
        console.log(items);
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


$("#my-button").on("click", getIDFromName);
$( "#item-name" ).autocomplete({
    source: names
 });
