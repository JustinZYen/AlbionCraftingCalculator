"use strict";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";
class DateEnum {
    static OLD = Symbol("Old Prices");
    static NEW = Symbol("New Prices");
}

class CraftTypeEnum {
    static REFINING = Symbol("Refining");
    static CRAFTING = Symbol("Crafting")
}
const nameToIDDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const idToNameDoc = await getDoc(doc(db,"General/Item Data/Name Conversions/ID To Name"));
const idToName = idToNameDoc.data();
const recipeDoc = await getDoc(doc(db,"General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const itemsList = await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json");
const itemsJSON = await itemsList.json();
const names = Object.keys(nameToIDDoc.data());
// HashMap of all Items so far (for saving prices)
// Uses priceIds as keys
const checkedItems = new Map(); 

// Hardcoding city crafting bonuses
const cityBonuses = new Map([
    ["Caerleon",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
    ["Bridgewatch",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
    ["Fort Sterling",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])],
    ["Lymhurst",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
    ["Martlock",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
    ["Thetford",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
    ["Brecilien",new Map([
        [CraftTypeEnum.REFINING,],
        [CraftTypeEnum.CRAFTING,]
    ])], 
]);
class Item {
    priceInfos = new Map([
        [DateEnum.OLD,new PriceInfo()],
        [DateEnum.NEW,new PriceInfo()]
    ]);
    tier = NaN;
    enchantment = 0;
    id;
    priceId;
    // Recipes will be array of Recipe objects
    recipes = [];
    category;
    subcategory
    constructor(priceId) {
        this.priceId = priceId;
        this.id = Item.getBaseId(priceId);
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipesAndCategories();
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

    #setRecipesAndCategories() {
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
            //let upgradeRequirements = itemInfo.upgraderequirements;
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
        this.category = itemInfo["@shopcategory"];
        console.log(this.id + " data "+ JSON.stringify(itemInfo));

        this.subcategory = itemInfo["@shopsubcategory1"];
    }

    toString() {
        function mapStringify(map) {
            let returnString = "";
            map.forEach((value,key)=>{
                console.log(key);
                returnString+=`City: ${key}, Average price: ${value}`;
            })
            return returnString;
        }
        //let oldPriceData = mapStringify(this.priceInfos.get(DateEnum.OLD).price);
        //let newPriceData = mapStringify(this.priceInfos.get(DateEnum.NEW).price);
        let oldPriceData = Array.from(this.priceInfos.get(DateEnum.OLD).price);
        let newPriceData = Array.from(this.priceInfos.get(DateEnum.NEW).price);
        return `name: ${idToName[Item.getPriceId(this.id)]}, id: ${this.id}, category: ${this.category}, subcategory: ${this.subcategory} tier: ${this.tier}, enchantment: ${this.enchantment}, old price: ${oldPriceData}, new price: ${newPriceData}`;
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

class PriceInfo {
    // Prices are stored as [city,price]
    price = new Map();
    priceTimescale = new Map();
    // Price qualities so that items with variable quality are saved as quality 2 if possible
    priceQualities = new Map();
    constructor() {

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
            this.resources.push([Item.getPriceId(resource["@uniquename"]),parseFloat(resource["@count"])]);
        }
    }
}


async function getProfits() {
    const input = $("#item-name").val();
    console.log("Input value: "+input);
    // If input value is contained in nameToID
    if (nameToID.hasOwnProperty(input)) {
        let ids = getItemIds(input);
        console.log(ids);
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        for (const priceId of ids) {
            itemStack.push(new Item(priceId));
        }
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop();
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem.priceId) && !checkedItems.has(currentItem.priceId)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                for (const recipe of currentItem.recipes) {
                    for (const resource of recipe.resources) {
                        itemStack.push(new Item(resource[0]));
                    }
                }
                uncheckedItems.set(currentItem.priceId,currentItem);
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
        let currentPriceId = currentItem.priceId;
        if (currentItemString.length + currentPriceId.length < MAX_URL_LENGTH) {
            if (currentItemString.length == 0) {
                currentItemString = currentPriceId;
            } else {
                currentItemString += (","+currentPriceId);
            }
        } else {
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_NEW,DateEnum.NEW);
            currentItemString = currentItem.id;
        }
    });
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_NEW,DateEnum.NEW);
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
            const currentPriceId = currentItem.item_id;
            let targetItem; 
            if (!checkedItems.has(currentPriceId)) {
                targetItem = new Item(currentPriceId);
                checkedItems.set(currentPriceId,targetItem);
            } else {
                targetItem = checkedItems.get(currentPriceId);
            }
            // Get prices; set to appropriate location
            const location = fixLocation(currentItem["location"]);
            const quality = currentItem["quality"];
            console.log("target item: "+targetItem);
            const priceInfo = targetItem.priceInfos.get(timeSpan);
            if (quality <= 2) {
                if (!priceInfo.priceQualities.has(location) || quality >= priceInfo.priceQualities.get(location)) {
                    // add price if timescale is better
                    const data = currentItem["data"];
                    // Find timescale difference
                    const startDate = data[0]["timestamp"];
                    const endDate = data[data.length-1]["timestamp"];
                    const timescale = (Date.parse(endDate)-Date.parse(startDate));
                    // console.log(`start date: ${startDate}, end date: ${endDate}`);
                    if (!priceInfo.priceTimescale.has(location) || timescale > priceInfo.priceTimescale.get(location)) {
                        let total = 0;
                        for (const timestampData of data) {
                            total += timestampData["avg_price"];
                        }
                        const average = total/data.length;
                        console.log("average: "+average);
                        priceInfo.price.set(location,average);
                        //console.log("Updating with new prices")
                    }
                    
                    // Find timescale
                }
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

function fixLocation(initialLocation) {
    if (initialLocation == "5003") {
        return "Brecilien";
    } else {
        return initialLocation;
    }
}

$("#my-button").on("click", getProfits);

$( "#item-name" ).autocomplete({
    source: names
});
$("#title").on("change",()=>{
    console.log($("#title").val());
});
