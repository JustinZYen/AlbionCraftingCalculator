"use strict";
import { ItemData } from "./item-data.js";
import { displayBoxes, displayPrices } from "./display.js";
import { itemNameTrie } from "./globals/preload.js";
import { DateEnum, Item } from "./classes/item.js";
import { reverseCity } from "./globals/constants.js";
import { ItemBox } from "./classes/display-boxes.js";

const itemData = new ItemData();
let itemBoxes: ItemBox[] = [];
document.getElementById("load-price-button")?.addEventListener("click", loadPriceProcedure);

$("#city-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#city-selector").val());
});

$("#date-selector").on("change", async () => {
    await loadPriceProcedure();
    console.log($("#date-selector").is(":checked"));
});

// Using jQuery because standard event listener may have issues due to element not existing when code is run    
$("#recipes-area").on("click", "div figure", function (event) {
    console.log("click");
    event.stopPropagation();
});

$("#recipes-area").on("click", "div", function () {
    //const currentClass = $(this).attr("id");
    $(this).find("figure").slideToggle("slow");
    $(this).find("svg").slideToggle("slow");
});



// Event listener for changes in the item name input field
document.getElementById("item-name")!.addEventListener("input", async () => {
    const enteredName = (<HTMLInputElement>document.getElementById("item-name"))?.value;
    document.getElementById("item-name-autocomplete")!.innerHTML = "";
    const matchingWords = itemNameTrie.wordsThatMatch(enteredName);
    for (const word of matchingWords) {
        const wordElement = document.createElement("li");
        wordElement.innerText = word;
        document.getElementById("item-name-autocomplete")?.appendChild(wordElement);
    }
});

// Event listener for clicks on the options in the autocomplete dropdown
document.getElementById("item-name-autocomplete")!.addEventListener("click", (e) => {
    (<HTMLInputElement>document.getElementById("item-name"))!.value = (<HTMLElement>e.target).innerText;
})

document.getElementById("sidebar-buttons")!.addEventListener("click", (e) => {
    if ((<HTMLElement>e.target).tagName == "BUTTON") {
        const [sidebarClass] = (<HTMLElement>e.target).classList;
        console.log(sidebarClass);
        const sidebarElement = (<HTMLElement>document.querySelector("#sidebars ." + sidebarClass));
        if (sidebarElement.classList.contains("display")) { // Turn off sidebar
            sidebarElement.classList.remove("display");
        } else { // Turn off current sidebar and add targeted sidebar
            for (const sidebar of document.querySelectorAll(".sidebar")) {
                {
                    (sidebar).classList.remove("display");
                }
            }
            sidebarElement.classList.add("display");
        }
    }
})

document.querySelector(".sidebar.crafting-fees")!.addEventListener("change",function(){
    Item.invalidatePrices();
    makePricesUpdate();
})

document.querySelector(".sidebar.crafting-bonuses")!.addEventListener("change",function(){
    Item.invalidatePrices();
    makePricesUpdate();
})

document.getElementById("recipes-area")!.addEventListener("change",function(){
    Item.invalidatePrices();
    makePricesUpdate();
})

async function loadPriceProcedure() {
    const loadingInterval = displayLoadIcon();
    try {
        const input: string = ($("#item-name").val()) as string;
        const itemIds = await ItemData.getItemIds(input);
        await itemData.getProfits(itemIds);

        itemBoxes = displayBoxes(itemData.items, itemIds);
        // Snapshot user inputs 
        makePricesUpdate();
    } catch (error) {
        console.error(error);
        console.trace()
    }
    hideLoadIcon(loadingInterval);
}

function makePricesUpdate() {
    const timespan = (<HTMLInputElement>document.getElementById("date-selector")).checked ?
        DateEnum.NEW
        :
        DateEnum.OLD;
    const city = reverseCity[(<HTMLInputElement>document.getElementById("city-selector"))!.value];
    const stationFees = getStationFees();
    const productionBonuses = getProductionBonuses();
    if (city != undefined) { // If city is undefined, we can't really display prices
        displayPrices(itemBoxes, timespan, city, stationFees, productionBonuses);
    }
}

/**
 * Returns a Map mapping crafting station names (binary file names) to their fee per 100 nutrition
 */
function getStationFees(): Map<string, number> {
    const stationFees = new Map<string, number>();
    const stationFeeDivs = document.querySelectorAll(".sidebar.crafting-fees > div")
    for (const stationFeeDiv of stationFeeDivs) {
        const currentId = stationFeeDiv.id;
        const currentInputBox = stationFeeDiv.querySelector("input")!;
        const currentFee = parseFloat(currentInputBox.value);
        stationFees.set(currentId, currentFee);
    }
    console.log(stationFees);
    return stationFees;
}

/**
 * Returns a Map mapping crafting categories to their production bonus value (as a percentage)
 */
function getProductionBonuses(): Map<string, number> {
    const productionBonuses = new Map<string, number>();
    const productionBonusDivs = document.querySelectorAll(".sidebar.crafting-bonuses > div");
    for (const productionBonusDiv of productionBonusDivs) {
        const selectedCraftingCategory = productionBonusDiv.querySelector("select")!.value;
        const currentProductionBonus = parseFloat(productionBonusDiv.querySelector("input")!.value);
        if (productionBonuses.has(selectedCraftingCategory)) {
            const prevProductionBonuses = productionBonuses.get(selectedCraftingCategory)!;
            productionBonuses.set(selectedCraftingCategory, prevProductionBonuses + currentProductionBonus)
        } else {
            productionBonuses.set(selectedCraftingCategory, currentProductionBonus)
        }
    }
    console.log(productionBonuses);
    return productionBonuses;
}

function displayLoadIcon() {
    const loadIcon = document.getElementById("load-icon")!;
    loadIcon.style.display = "block";
    let numPeriods = 1;
    return setInterval(() => {
        let loadMessage = "Loading";
        for (let i = 0; i < numPeriods; i++) {
            loadMessage += ".";
        }
        loadIcon.innerText = loadMessage;
        numPeriods = numPeriods % 3 + 1;
    }, 500);
}

function hideLoadIcon(loadingInterval: NodeJS.Timeout) {
    const loadIcon = document.getElementById("load-icon")!;
    loadIcon.style.display = "none";
    loadIcon.innerText = "Loading";
    clearInterval(loadingInterval);
}

