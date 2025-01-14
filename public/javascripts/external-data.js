import { ItemNameTrie } from "./classes/Trie.js";
const processedItemsJSON = {};
fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json")
    .then((response) => {
    return response.json();
})
    .then((itemsJSON) => {
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
});
const nameToId = Object.create(null); // Null-prototype to minimize possible issues
const idToName = Object.create(null);
const itemNameTrie = new ItemNameTrie();
fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json")
    .then((response) => {
    return response.json();
})
    .then((localizationJSON) => {
    for (const localizationInfo of localizationJSON) {
        if (localizationInfo.LocalizedNames == null) {
            // Items like @ITEMS_QUESTITEM_TUTORIAL_HERETIC_PLANS have their LocalizedNames property set to null
            continue;
        }
        const itemId = localizationInfo.UniqueName;
        const itemName = localizationInfo.LocalizedNames["EN-US"];
        idToName[itemId] = itemName;
        if (Object.hasOwn(nameToId, itemName)) {
            nameToId[itemName].push(itemId);
        }
        else {
            nameToId[itemName] = [itemId];
        }
        itemNameTrie.insert(itemName);
    }
});
const dummyCurrentPatch = new Date();
dummyCurrentPatch.setHours(0, 0, 0, 0);
dummyCurrentPatch.setDate(dummyCurrentPatch.getDate() - 1);
const dummyPrevPatch = new Date(dummyCurrentPatch);
dummyPrevPatch.setDate(dummyPrevPatch.getDate() - 1);
const patchData = {
    currentPatchDate: dummyCurrentPatch.toISOString(),
    previousPatchDate: dummyPrevPatch.toISOString()
};
fetch("data/patch-data")
    .then(response => {
    return response.json();
})
    .then((json) => {
    patchData.currentPatchDate = json.currentPatchDate;
    patchData.previousPatchDate = json.previousPatchDate;
    console.log(`Previous patch date: ${json.previousPatchDate}`);
    console.log(`Current patch date: ${json.currentPatchDate}`);
});
export { processedItemsJSON, nameToId, idToName, patchData, itemNameTrie };
