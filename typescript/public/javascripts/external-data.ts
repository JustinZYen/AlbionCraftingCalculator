import {doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./globals/firebaseScripts.js";
import { ItemData } from "./classes/item.js";

const nameToIDPromise:Promise<any> = getDoc(doc(db,"General/Item Data/Name Conversions/Name To ID")).then((content: { data: () => any; })=>{
    return content.data();
})
const idToName = (await getDoc(doc(db,"General/Item Data/Name Conversions/ID To Name"))).data();
const itemsJSON = await (await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json")).json();
const namesPromise = nameToIDPromise.then((namesToID)=>{
    return Object.keys(namesToID)
});

export {nameToIDPromise,idToName,namesPromise};

const processedItemsJSON:{[key:string]:ItemData} = {};
(function extractItems(currentValue:{}|[]|string) {
    if (typeof currentValue != "object") {
        return;
    }
    if ("@uniquename" in currentValue) {
        processedItemsJSON[currentValue["@uniquename"] as string] = currentValue as ItemData;
        return;
    }
    for (const value of Object.values(currentValue)) {
        extractItems(value);
    }
})(itemsJSON.items);
export {processedItemsJSON};
