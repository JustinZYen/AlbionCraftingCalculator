// @ts-ignore
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../public/firebaseScripts.js";
class Item {
    constructor(id) {
        // Price will be instantiated as a group to reduce api calls
        this.price = NaN;
        this.tier = NaN;
        this.enchantment = 0;
        this.id = id;
        this.setTier();
        this.setEnchantment;
    }
    setTier() {
        const secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && !Number.isNaN(secondValue)) {
            this.tier = secondValue;
        }
        else {
            throw new Error("Tier missing");
        }
    }
    setEnchantment() {
        const lastVal = parseInt(this.id.charAt(this.id.length - 1));
        if (!Number.isNaN(lastVal)) {
            this.enchantment = lastVal;
        }
    }
    toString() {
        return `id: ${this.id}, tier: ${this.tier}, enchantment: ${this.enchantment}, price: ${this.price}`;
    }
}
function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        let ids = structuredClone(nameToID[input]);
        console.log(ids);
        ids.forEach((currentID, index, array) => {
            // Add in a number before the @ so that it functions correctly for albion online data api
            const secondValue = parseInt(currentID.charAt(1));
            if (currentID.charAt(0) === "T" && !Number.isNaN(secondValue)) {
                // Current item has different tiers since it is T-some number
                const stringRemainder = currentID.slice(2);
                for (let i = MIN_TIER; i < MAX_TIER; i++) {
                    if (i != secondValue) {
                        array.push("T" + i + stringRemainder);
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
function calculateProfit(itemID, tax) {
    //const sellPrice = getAveragePrices(itemID);
    //const craftPrice = getCraftingPrice(itemID);
    //return (1-tax)*sellPrice-craftPrice;
}
// Get document of names to ids
// Get document of recipe paths
const MIN_TIER = 4;
const MAX_TIER = 8;
const nameToIDDoc = await getDoc(doc(db, "General/Item Data/Name Conversions/Name To ID"));
const nameToID = nameToIDDoc.data();
const recipeDoc = await getDoc(doc(db, "General/Item Data/Recipes/Recipes"));
const recipes = recipeDoc.data();
const names = Object.keys(nameToIDDoc.data());
let priceQueue = []; // Array of item ids that still need their prices calculated
const items = new Map(); // HashMap of all items so far (for saving prices);
$("#my-button").on("click", getIDFromName);
$("#item-name").autocomplete({
    source: names
});
