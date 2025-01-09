const itemsJSON = await (await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json")).json();
const processedItemsJSON = {};
(function extractItems(currentValue) {
    if (typeof currentValue != "object") {
        return;
    }
    if ("@uniquename" in currentValue) {
        processedItemsJSON[currentValue["@uniquename"]] = currentValue;
        return;
    }
    for (const value of Object.values(currentValue)) {
        extractItems(value);
    }
})(itemsJSON.items);
const nameToId = Object.create(null); // Null-prototype to minimize possible issues
const idToName = Object.create(null);
const localizationJSON = await (await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json")).json();
for (const localizationInfo of localizationJSON) {
    if (localizationInfo.LocalizedNames == null) {
        // Items like @ITEMS_QUESTITEM_TUTORIAL_HERETIC_PLANS have their LocalizedNames property set to null
        continue;
    }
    const itemId = localizationInfo.LocalizationNameVariable;
    const itemName = localizationInfo.LocalizedNames["EN-US"];
    idToName[itemId] = itemName;
    if (Object.hasOwn(nameToId, itemName)) {
        nameToId[itemName].push(itemId);
    }
    else {
        nameToId[itemName] = [itemId];
    }
}
console.log(nameToId);
console.log(idToName);
export { processedItemsJSON, nameToId, idToName };
