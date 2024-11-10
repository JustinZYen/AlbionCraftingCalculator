import { stationNames } from "./globals/constants.js";
import { cityBonuses } from "./globals/constants.js";
const craftingFeesSidebar = document.querySelector("#sidebars .crafting-fees");
for (const [binDumpName, ingameName] of Object.entries(stationNames)) {
    const newInputBox = document.createElement("div");
    newInputBox.id = binDumpName;
    craftingFeesSidebar.appendChild(newInputBox);
    const title = document.createElement("div");
    title.innerText = ingameName;
    newInputBox.appendChild(title);
    const costInput = document.createElement("input");
    costInput.type = "number";
    costInput.value = "400";
    newInputBox.appendChild(costInput);
}
const productionBonusSidebar = document.querySelector("#sidebars .crafting-bonuses");
for (let i = 1; i <= 5; i++) {
    const newBonusBox = document.createElement("div");
    productionBonusSidebar.appendChild(newBonusBox);
    const itemNameSelector = document.createElement("select");
    newBonusBox.appendChild(itemNameSelector);
    const defaultOption = document.createElement("option");
    defaultOption.innerText = "Select an item category";
    defaultOption.value = "";
    itemNameSelector.appendChild(defaultOption);
    for (const cityBonusItem of Object.values(cityBonuses)) {
        for (const itemCategory of Object.keys(cityBonusItem)) {
            const newOption = document.createElement("option");
            newOption.innerText = itemCategory;
            newOption.value = itemCategory;
            itemNameSelector.appendChild(newOption);
        }
    }
    const costInput = document.createElement("input");
    newBonusBox.appendChild(costInput);
    costInput.type = "number";
    costInput.value = "0";
    const percentageSign = document.createElement("span");
    newBonusBox.appendChild(percentageSign);
    percentageSign.innerText = "%";
}
