"use strict";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebaseScripts.js";
import { DateEnum, Item } from "./item.js";
import { idToName, names, nameToID } from "./external-data.js";
import { RecipeBox, ItemBox } from "./display-boxes.js";
import { ItemData } from "./item-data.js";
import { displayRecipes } from "./display.js";
class CraftTypeEnum {
    static REFINING = Symbol("Refining");
    static CRAFTING = Symbol("Crafting")
}


// HashMap of all the ItemBoxes that correspond to a certain item
// Uses priceIds as keys and an ItemBox array as value
const itemBoxes = new Map();

// Hardcoding city crafting bonuses
/*
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
*/

/*
function calculateProfit(itemID:string,tax:number) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}
*/

const itemData = new ItemData();

document.getElementById("load-price-button")?.addEventListener("click", loadPriceProcedure);

(<any>$("#item-name")).autocomplete({
    source: names
});

$("#city-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#city-selector").val());
});

$("#date-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#date-selector").is(":checked"));
});

$("#recipes-area").on("click", "div figure", function (event) {
    console.log("click");
    event.stopPropagation();
});

$("#recipes-area").on("click", "div", function () {
    //const currentClass = $(this).attr("id");
    $(this).find("figure").slideToggle("slow");
    $(this).find("svg").slideToggle("slow");
});

async function loadPriceProcedure() {
    document.getElementById("recipes-area")!.innerHTML = "";
    const input: string = ($("#item-name").val()) as string;
    const itemIds = ItemData.getItemIds(input);
    await itemData.getProfits(itemIds);
    displayRecipes(itemData.checkedItems, itemIds);
}