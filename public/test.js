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
const checkedItems = new Map(); // HashMap of all items so far (for saving prices);

class Item {
    // Price will be instantiated as a group to reduce api calls
    price = NaN;
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
        return `id: ${id}, base id: ${baseId}, tier: ${tier}, enchantment: ${enchantment}, price: ${price}`;
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
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Set();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        ids.forEach(element=>{
            itemStack.push(new Item(element));
        });

        console.log(itemStack);
        while (itemStack.length > 0) {
            let currentItem = itemStack.pop();
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem) && !checkedItems.has(currentItem.id)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                currentItem.recipes.forEach((element) => {
                    console.log("test"+element.resources);
                    element.resources.forEach((element)=> {
                        console.log(`element:${element[0]}`);
                        itemStack.push(new Item(element[0]));
                    });
                });
                uncheckedItems.add(currentItem);
            }
        }
        console.log(uncheckedItems);
        
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
