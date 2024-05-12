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
    // Recipes will be array of Recipe objects
    recipes = [];
    constructor(id) {
        this.id = id;
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipes();
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
        for (const pathElement of path) {
            itemInfo = itemInfo[pathElement];
        }
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
            for (const craftingRequirement of craftingRequirements) {
                addRecipe(craftingRequirement);
            }
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
        return `id: ${this.id}, tier: ${this.tier}, enchantment: ${this.enchantment}, old price: ${this.oldPrice}, new price: ${this.newPrice}`;
    }

    static getPriceId(s) {
        if (s.endsWith("LEVEL",s.length-1)) {
            // Convert resources ending with LEVEL# (T4_PLANKS_LEVEL1) to LEVEL#@# (T4_PLANKS_LEVEL1@1)
            // Add exceptions for FISHSAUCE and ALCHEMY_EXTRACT
            if (!s.startsWith("FISHSAUCE",3) && !s.startsWith("ALCHEMY_EXTRACT",3)) {
                return s+"@"+s.charAt(s.length-1);
            }
        } 
        else if (s.startsWith("RANDOM_DUNGEON",3)) {
            const lastValue = parseInt(s.charAt(s.length-1));
            if (lastValue > 1) {
                return s+"@"+(lastValue-1);
            }
        }
        else if (s.startsWith("UNIQUE_LOOTCHEST_COMMUNITY") && s.endsWith("PREMIUM")) {
            return s+"@1";
        }
        // Cover edge cases
        const enchantedMounts = [
            "T8_MOUNT_MAMMOTH_BATTLE",
            "T8_MOUNT_HORSE_UNDEAD",
            "T5_MOUNT_COUGAR_KEEPER",
            "T8_MOUNT_COUGAR_KEEPER",
            "T8_MOUNT_ARMORED_HORSE_MORGANA",
            "T8_MOUNT_RABBIT_EASTER_DARK"
        ];
        if(enchantedMounts.includes(s)) {
            return s+"@1";
        }
        const enchantedDeco1 = [
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_A",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_B",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_C",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_COMPANION",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_BARREL",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_MERLINCUBE",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_BARREL_B",
            "UNIQUE_FURNITUREITEM_MORGANA_TORCH_C",
            "UNIQUE_FURNITUREITEM_MORGANA_FIREBOWL_C"
        ];
        if (enchantedDeco1.includes(s)) {
            return s+"@1";
        }
        const enchantedDeco2 = [
            "UNIQUE_FURNITUREITEM_MORGANA_CAMPFIRE_D",
            "UNIQUE_FURNITUREITEM_MORGANA_SIEGE_BALLISTA_A",
            "UNIQUE_FURNITUREITEM_MORGANA_WEAPONCRATE_A"
        ];
        if (enchantedDeco2.includes(s)) {
            return s+"@2";
        }
        const enchantedDeco3 = [
            "UNIQUE_FURNITUREITEM_MORGANA_PENTAGRAM",
            "UNIQUE_FURNITUREITEM_MORGANA_PRISON_CELL_C",
            "UNIQUE_FURNITUREITEM_MORGANA_TENT_A"
        ];
        if (enchantedDeco3.includes(s)) {
            return s+"@3";
        }
        if (s.startsWith("JOURNAL",3)) {
            return s+"_EMPTY";
        }
        return s;
    }
    
    static getBaseId(s) {
        if (s.charAt(s.length-2)==="@") {
            return s.slice(0,s.length-2)
        }
        else if (s.startsWith("JOURNAL",3) && (s.endsWith("EMPTY") || s.endsWith("FULL"))) {
            console.log(s);
            console.log(s.slice(0,s.lastIndexOf("_")));
            return s.slice(0,s.lastIndexOf("_"));
        }
        return s;
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
        for (const resource of resources) {
            this.resources.push([resource["@uniquename"],parseFloat(resource["@count"])]);
        }
    }
}

class DateEnum {
    static OLD = Symbol("Old Prices");
    static NEW = Symbol("New Prices");
}
async function getProfits() {
    const input = $("#item-name").val();
    console.log("Input value: "+input);
    // If input value is contained in nameToID
    if (nameToID.hasOwnProperty(input)) {
        let ids = getItemIds(input);
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        for (const id of ids) {
            itemStack.push(new Item(id));
        }
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop();
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem.id) && !checkedItems.has(currentItem.id)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                for (const recipe of currentItem.recipes) {
                    for (const resource of recipe.resources) {
                        itemStack.push(new Item(resource[0]));
                    }
                }
                uncheckedItems.set(currentItem.id,currentItem);
            }
        }
        //console.log(uncheckedItems)
        console.log("setting prices");
        await setPrices(uncheckedItems);
        
        checkedItems.forEach((value,key)=> {
            console.log(`key: ${key}, value: ${value}`);
        });
        
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
        let currentPriceId = Item.getPriceId(currentItem.id)
        if (currentItemString.length + currentPriceId.length < MAX_URL_LENGTH) {
            if (currentItemString.length == 0) {
                currentItemString = currentPriceId;
            } else {
                currentItemString += (","+currentPriceId);
            }
        } else {
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.NEW);
            currentItemString = currentItem.Id;
        }
    });
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.NEW);
    uncheckedItems.clear();
}

/**
 * 
 * @param {String} priceURL URL needed for api, not including timescale
 * @param {DateEnum} timeSpan OLD or NEW, representing previous patch or current patch, respectively
 */
async function getPrices(priceURL,timeSpan) {
    const timescales = [1,6,24]
    for (const timescale of timescales) {
        let priceContents = await fetch(priceURL+timescale);
        let priceContentsJSON = await priceContents.json();
        // Check timescale and update prices if timescale is higher
        for (const currentItem of priceContentsJSON) {
            let currentId = Item.getBaseId(currentItem.item_id);
            if (!checkedItems.has(currentId)) {
                checkedItems.set(currentId,new Item(currentId))
            }
        }
        console.log("Done with timescale "+ timescale);
    }
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