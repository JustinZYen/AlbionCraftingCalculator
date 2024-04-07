"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var firebase_firestore_js_1 = require("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
var firebaseScripts_js_1 = require("../public/firebaseScripts.js");
var Item = /** @class */ (function () {
    function Item(id) {
        // Price will be instantiated as a group to reduce api calls
        this.price = NaN;
        this.tier = NaN;
        this.enchantment = 0;
        this.id = id;
        this.setTier();
        this.setEnchantment;
    }
    Item.prototype.setTier = function () {
        var secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && !Number.isNaN(secondValue)) {
            this.tier = secondValue;
        }
        else {
            throw new Error("Tier missing");
        }
    };
    Item.prototype.setEnchantment = function () {
        var lastVal = parseInt(this.id.charAt(this.id.length - 1));
        if (!Number.isNaN(lastVal)) {
            this.enchantment = lastVal;
        }
    };
    Item.prototype.toString = function () {
        return "id: ".concat(this.id, ", tier: ").concat(this.tier, ", enchantment: ").concat(this.enchantment, ", price: ").concat(this.price);
    };
    return Item;
}());
function getIDFromName() {
    var input = $("#item-name").val();
    console.log(input);
    if (nameToID.hasOwnProperty(input)) {
        var ids = structuredClone(nameToID[input]);
        console.log(ids);
        ids.forEach(function (currentID, index, array) {
            // Add in a number before the @ so that it functions correctly for albion online data api
            var secondValue = parseInt(currentID.charAt(1));
            if (currentID.charAt(0) === "T" && !Number.isNaN(secondValue)) {
                // Current item has different tiers since it is T-some number
                var stringRemainder = currentID.slice(2);
                for (var i = MIN_TIER; i < MAX_TIER; i++) {
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
var MIN_TIER = 4;
var MAX_TIER = 8;
var nameToIDDoc = await (0, firebase_firestore_js_1.getDoc)((0, firebase_firestore_js_1.doc)(firebaseScripts_js_1.db, "General/Item Data/Name Conversions/Name To ID"));
var nameToID = nameToIDDoc.data();
var recipeDoc = await (0, firebase_firestore_js_1.getDoc)((0, firebase_firestore_js_1.doc)(firebaseScripts_js_1.db, "General/Item Data/Recipes/Recipes"));
var recipes = recipeDoc.data();
var names = Object.keys(nameToIDDoc.data());
var priceQueue = []; // Array of item ids that still need their prices calculated
var items = new Map(); // HashMap of all items so far (for saving prices);
$("#my-button").on("click", getIDFromName);
$("#item-name").autocomplete({
    source: names
});
