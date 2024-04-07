var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Item_instances, _Item_getTier, _Item_getEnchantment;
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebaseScripts.js";
class Item {
    constructor(id) {
        _Item_instances.add(this);
        this.id = id;
        this.tier = __classPrivateFieldGet(this, _Item_instances, "m", _Item_getTier).call(this);
        this.enchantment = __classPrivateFieldGet(this, _Item_instances, "m", _Item_getEnchantment).call(this);
    }
    toString() {
        return `id: ${id}, tier: ${tier}, enchantment: ${enchantment}, price: ${price}`;
    }
}
_Item_instances = new WeakSet(), _Item_getTier = function _Item_getTier() {
    const secondValue = parseInt(this.id.charAt(1));
    if (this.id.charAt(0) === "T" && secondValue != NaN) {
        this.tier = secondValue;
    }
}, _Item_getEnchantment = function _Item_getEnchantment() {
    const lastVal = parseInt(this.id.charAt(this.id.length - 1));
    if (lastVal != NaN) {
        this.enchantment = lastVal;
    }
    else {
        this.enchantment = 0;
    }
};
function getIDFromName() {
    const input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        let ids = structuredClone(nameToID[input]);
        console.log(ids);
        ids.forEach((element, index, array) => {
            // Add in a number before the @ so that it functions correctly for albion online data api
            const secondValue = parseInt(element.charAt(1));
            if (element.charAt(0) === "T" && secondValue != NaN) {
                // Current item has different tiers since it is T-some number
                const stringRemainder = element.slice(2);
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
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1 - tax) * sellPrice - craftPrice;
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
