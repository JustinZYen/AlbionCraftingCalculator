"use strict";
import { ItemData } from "./item-data.js";
import { displayRecipes } from "./display.js";
import { itemNameTrie } from "./preload.js";
const itemData = new ItemData();
document.getElementById("load-price-button")?.addEventListener("click", loadPriceProcedure);
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
// Event listener for changes in the item name input field
document.getElementById("item-name").addEventListener("input", async () => {
    const enteredName = document.getElementById("item-name")?.value;
    document.getElementById("item-name-autocomplete").innerHTML = "";
    const matchingWords = itemNameTrie.wordsThatMatch(enteredName);
    for (const word of matchingWords) {
        const wordElement = document.createElement("li");
        wordElement.innerText = word;
        document.getElementById("item-name-autocomplete")?.appendChild(wordElement);
    }
});
// Event listener for clicks on the options in the autocomplete dropdown
document.getElementById("item-name-autocomplete").addEventListener("click", (e) => {
    document.getElementById("item-name").value = e.target.innerText;
});
document.getElementById("sidebar-buttons").addEventListener("click", (e) => {
    if (e.target.tagName == "BUTTON") {
        const [sidebarClass] = e.target.classList;
        console.log(sidebarClass);
        const sidebarElement = document.querySelector("#sidebars ." + sidebarClass);
        if (sidebarElement.classList.contains("display")) { // Turn off sidebar
            sidebarElement.classList.remove("display");
        }
        else { // Turn off current sidebar and add targeted sidebar
            for (const sidebar of document.querySelectorAll(".sidebar")) {
                {
                    (sidebar).classList.remove("display");
                }
            }
            sidebarElement.classList.add("display");
        }
    }
});
async function loadPriceProcedure() {
    const loadingInterval = displayLoadIcon();
    const input = ($("#item-name").val());
    const itemIds = await ItemData.getItemIds(input);
    await itemData.getProfits(itemIds);
    displayRecipes(itemData.checkedItems, itemIds);
    hideLoadIcon(loadingInterval);
}
function displayLoadIcon() {
    const loadIcon = document.getElementById("load-icon");
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
function hideLoadIcon(loadingInterval) {
    const loadIcon = document.getElementById("load-icon");
    loadIcon.style.display = "none";
    loadIcon.innerText = "Loading";
    clearInterval(loadingInterval);
}
