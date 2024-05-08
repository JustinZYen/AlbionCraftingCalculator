"use strict";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const idToNameDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/ID To Name"));
const idToName = idToNameDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const itemsList = await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json");
const itemsJSON = await itemsList.json();
const names = Object.keys(nameToIDDoc.data());
const checkedItems = new Map(); // HashMap of all items so far (for saving prices);
// checkedItems keys are priceId, not id (uses num@num)

class Item {
    // Prices are stored as [city,price]
    oldPrice = new Map();
    oldPriceTimescale = 0;
    newPrice = new Map();
    newPriceTimescale = 0;
    tier = NaN;
    enchantment = 0;
    id;
    priceId;
    // Recipes will be array of Recipe objects
    recipes = [];
    constructor(id) {
        this.id = id;
        this.#setPriceId();
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipes();
    }

    #setPriceId() {
        this.priceId = this.id;
        let lastChar = parseInt(this.id.charAt(this.id.length-1));
        // Checking if second to last letter is L for LEVEL
        if (!isNaN(lastChar) && this.id.charAt(this.id.length-2)==="L") {
            this.priceId = this.priceId+"@"+lastChar;
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
        if (!isNaN(lastVal) && this.id.charAt(this.id.length-2) != "_") {
            this.enchantment = lastVal;
        }
    }

    #setRecipes() {
        let baseId = this.id;
        if (this.id.charAt(this.id.length-2) == "@") {
            baseId = baseId.slice(0,-2);
        }
        const path = recipes[baseId];
        if (path == null) {
            console.log(`No path found for id ${baseId}`);
            return;
        }
        let itemInfo = itemsJSON;
        path.forEach(element=>{
            itemInfo = itemInfo[element];
        })
        //console.log(itemInfo);
        if (itemInfo.hasOwnProperty("enchantments") && this.enchantment > 0) {
            itemInfo = itemInfo.enchantments.enchantment[this.enchantment-1];
        }
        let craftingRequirements = itemInfo.craftingrequirements;
        // Add a recipe based on the contents of craftingrequirements
        const addRecipe= element => {
            //console.log(`id: ${this.id}, addRecipe element: ${JSON.stringify(element)}`);
            if (element.hasOwnProperty("craftresource")) {
                let craftResource = element.craftresource;
                if (!Array.isArray(craftResource)) {
                    craftResource = [craftResource];
                }
                //console.log(`craftresource used to add to recipe: ${craftResource}`);
                let currentRecipe = new Recipe(element["@craftingfocus"],element["@silver"],element["@time"],craftResource);
                if (element.hasOwnProperty("@amountcrafted")) {
                    currentRecipe.amount = element["@amountcrafted"];
                }
                this.recipes.push(currentRecipe);
            }
        }
        if (Array.isArray(craftingRequirements)) {
            craftingRequirements.forEach(addRecipe);
        } else {
            addRecipe(craftingRequirements);
        }
        
        // Item id must end with @number
        if (itemInfo.hasOwnProperty("upgraderequirements")) {
            let upgradeRequirements = itemInfo.upgraderequirements;
            let previousId;
            if (this.enchantment === 1) {
                previousId = baseId;
            } else {
                previousId = this.id.slice(0,-1)+(this.enchantment-1);
            }
            let initialRecipe = new Recipe(0,0,0,[itemInfo.upgraderequirements.upgraderesource]);
            initialRecipe.resources.push([previousId,1]);
            this.recipes.push(initialRecipe);
        }
    }

    toString() {
        return `id: ${this.id}, price id: ${this.priceId}, tier: ${this.tier}, enchantment: ${this.enchantment}, price: ${this.price}`;
    }
}

class Recipe {
    // Might be issue with results being strings
    focus;
    silver;
    time;
    // formatted as item id followed by amount of resources
    resources = [];
    // amount is amount crafted
    amount = 1;
    // Whether or not the recipe can return resources
    canReturn = true;
    /**
     * 
     * @param {number} focus 
     * @param {number} silver 
     * @param {number} time 
     * @param {array} resources 
     */
    constructor (focus,silver,time,resources) {
        this.focus = parseFloat(focus);
        this.silver = parseFloat(silver);
        this.time = parseFloat(time);
        resources.forEach(element => {
            this.resources.push([element["@uniquename"],parseFloat(element["@count"])]);
        })
    }
}

class DateEnum {
    OLD = new Symbol(0);
    NEW = new Symbol(1);
}
async function getProfits() {
    const input = $("#item-name").val();
    console.log(input);
    // If input value is contained in nameToID
    if (nameToID.hasOwnProperty(input)) {
        let ids = getItemIds(input);
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        ids.forEach(element=>{
            console.log(`element: ${element}`);
            itemStack.push(new Item(element));
        });

        console.log(itemStack);
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop();
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem.id) && !checkedItems.has(currentItem.id)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                currentItem.recipes.forEach((element) => {
                    element.resources.forEach((element)=> {
                        itemStack.push(new Item(element[0]));
                    });
                });
                uncheckedItems.set(currentItem.id,currentItem);
            }
        }
        //console.log(uncheckedItems);
        await setPrices(uncheckedItems);
       //getAveragePrices();
    } else {
        console.log(`input string ${input} not found`);
    }

}

async function previousDateString() {
    const patchDateDoc = await getDoc(doc(db,"General/Patch Data"));
    const patchDates = await patchDateDoc.data();
    const previousPatchDateDate = new Date(patchDates["Previous Date"]);
    const previousPatchDateString = previousPatchDateDate.getUTCFullYear()+"-"+
        (previousPatchDateDate.getUTCMonth()+1)+"-"+
        (previousPatchDateDate.getUTCDate());
    const patchDateDate = new Date(patchDates.Date);
    const patchDateString = await patchDateDate.getUTCFullYear()+"-"+
        (patchDateDate.getUTCMonth()+1)+"-"+
        (patchDateDate.getUTCDate());
    return dateString(previousPatchDateString,patchDateString);
}

async function currentDateString() {
    const patchDateDoc = await getDoc(doc(db,"General/Patch Data"));
    const patchDates = await patchDateDoc.data();
    const previousPatchDateDate = new Date(patchDates.Date);
    const previousPatchDateString = previousPatchDateDate.getUTCFullYear()+"-"+
        (previousPatchDateDate.getUTCMonth()+1)+"-"+
        (previousPatchDateDate.getUTCDate());
    const currentDateDate = new Date();
    const currentDateString = currentDateDate.getUTCFullYear()+"-"+
        (currentDateDate.getUTCMonth()+1)+"-"+
        (currentDateDate.getUTCDate());
    return dateString(previousPatchDateString,currentDateString);

}
function dateString(startDate,endDate) {
    return "?date="+startDate+"&end_date="+endDate;
}

function getItemIds(itemId) {
    const MIN_TIER = 4;
    const MAX_TIER = 8;
    let ids = structuredClone(nameToID[itemId]);
    console.log(ids);
    ids.forEach((element,index,array) => {
        const secondValue = parseInt(element.charAt(1));
        if (element.charAt(0) === "T" && secondValue != NaN) {
            // Current item has different tiers since it is T-some number
            const stringRemainder = element.slice(2);
            for (let i = MIN_TIER; i <= MAX_TIER; i++) {
                if (i != secondValue) {
                    array.push("T"+i+stringRemainder);
                }
            }
        }
    });
    return ids;
}

/**
 * 
 * @param {Set} uncheckedItems A set containing Items representing all items for which prices have not yet been calculated
 */
async function setPrices(uncheckedItems) {
    const PRICE_URL_START = "https://west.albion-online-data.com/api/v2/stats/history/";
    const PRICE_URL_END_OLD = await previousDateString()+"&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
    const PRICE_URL_END_NEW = await currentDateString()+"&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
    const startStringLength = PRICE_URL_START.length;
    const endStringLength = Math.max(PRICE_URL_END_OLD.length,PRICE_URL_END_NEW.length);
    const MAX_URL_LENGTH = 4096;
    // Note: Missing time scale so that I can test out all 3 possible timescales
    let currentItemString = "";
    uncheckedItems.forEach(async currentItem => {
        // Check if more prices can fit into current URL
        if (currentItemString.length + currentItem.priceId.length < MAX_URL_LENGTH) {
            if (currentItemString.length == 0) {
                currentItemString = currentItem.priceId;
            } else {
                currentItemString += (","+currentItem.priceId);
            }
        } else {
            getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
            getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.NEW);
            currentItemString = currentItem.Id;
        }
    });
    getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
    getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.NEW);
    uncheckedItems.clear();
}

/**
 * 
 * @param {String} priceURL URL needed for api, not including timescale
 * @param {DateEnum} timeSpan OLD or NEW, representing previous patch or current patch, respectively
 */
async function getPrices(priceURL,timeSpan) {
    console.log("checked items: "+checkedItems);
    const timescales = [1,6,24]
    timescales.forEach(async timescale => {
        const priceContents = await fetch(priceURL+timescale);
        const priceContentsJSON = await priceContents.json();
        // Check timescale and update prices if timescale is higher
        priceContentsJSON.forEach(element => {
            console.log(element);
            console.log(element.item_id);
            console.log(checkedItems.has(element.item_id));
        });
    });
}

function calculateProfit(itemID,tax) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}

$("#my-button").on("click", getProfits);

$( "#item-name" ).autocomplete({
    source: names
});
$("#title").on("change",()=>{
    console.log($("#title").val());
});
//price link https://west.albion-online-data.com/api/v2/stats/history/T4_BAG?date=4-4-2024&end_date=4-7-2024&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=6