"use strict";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 
import {db} from "./firebaseScripts.js";
import { DateEnum,Item } from "./item.js";
import { idToName, names, nameToID } from "./external-data.js";
import { RecipeBox, ItemBox } from "./display-boxes.js";
class CraftTypeEnum {
    static REFINING = Symbol("Refining");
    static CRAFTING = Symbol("Crafting")
}

// HashMap of all Items so far (for saving prices)
// Uses priceIds as keys
const checkedItems = new Map(); 
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



async function getProfits() {
    document.getElementById("recipes-area")!.innerHTML = "";
    const input:string = ($("#item-name").val()) as string;
    console.log("Input value: "+input);
    // If input value is contained in nameToID
    if (nameToID.hasOwnProperty(input)) {
        let ids = getItemIds(input);
        ids.sort();
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map<string,Item>();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack:Item[] = [];
        // Set up stack with all items in ids array
        for (const priceId of ids) {
            itemStack.push(new Item(priceId));
        }
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop()!;
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem.priceId) && !checkedItems.has(currentItem.priceId)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                for (const recipe of currentItem.recipes) {
                    for (const resource of recipe.resources) {
                        itemStack.push(new Item(resource.priceId));
                    }
                }
                uncheckedItems.set(currentItem.priceId,currentItem);
                checkedItems.set(currentItem.priceId,currentItem);
            }
        }
        //console.log(uncheckedItems)
        console.log("setting prices");
        await setPrices(uncheckedItems);
        displayRecipes(ids)
       //getAveragePrices();
    } else {
        console.log(`input string ${input} not found`);
    }
}

async function previousDateString() {
    const patchDateDoc = await getDoc(doc(db,"General/Patch Data"));
    const patchDates = await patchDateDoc.data();
    const previousPatchDateDate = new Date(patchDates["Previous Date"]);
    const previousPatchDateString = previousPatchDateDate.getUTCFullYear()+"-"+
        (previousPatchDateDate.getUTCMonth()+1)+"-"+
        (previousPatchDateDate.getUTCDate());
    const patchDateDate = new Date(patchDates.Date);
    const patchDateString = patchDateDate.getUTCFullYear()+"-"+
        (patchDateDate.getUTCMonth()+1)+"-"+
        (patchDateDate.getUTCDate());
    return dateString(previousPatchDateString,patchDateString);
}

async function currentDateString() {
    const patchDateDoc = await getDoc(doc(db,"General/Patch Data"));
    const patchDates = await patchDateDoc.data();
    const previousPatchDateDate = new Date(patchDates.Date);
    const previousPatchDateString = previousPatchDateDate.getUTCFullYear()+"-"+
        (previousPatchDateDate.getUTCMonth()+1)+"-"+
        (previousPatchDateDate.getUTCDate());
    const currentDateDate = new Date();
    const currentDateString = currentDateDate.getUTCFullYear()+"-"+
        (currentDateDate.getUTCMonth()+1)+"-"+
        (currentDateDate.getUTCDate());
    return dateString(previousPatchDateString,currentDateString);

}
function dateString(startDate:string,endDate:string) {
    return "?date="+startDate+"&end_date="+endDate;
}

/**
 * 
 * @param {String} itemId 
 * @returns An array containing item ids of all weapons that share the name in the tree
 */
function getItemIds(itemId:string) {
    const MIN_TIER = 4;
    const MAX_TIER = 8;
    let ids:string[] = structuredClone(nameToID[itemId]);
    ids.forEach((element,_,array) => {
        const secondValue = parseInt(element.charAt(1));
        if (element.charAt(0) === "T" && !Number.isNaN(secondValue)) {
            // Current item has different tiers since it is T-some number
            const stringRemainder = element.slice(2);
            for (let i = MIN_TIER; i <= MAX_TIER; i++) {
                if (i != secondValue) {
                    array.push("T"+i+stringRemainder);
                }
            }
        }
    });
    return ids;
}

/**
 * 
 * @param {Set} uncheckedItems A set containing Items representing all items for which prices have not yet been calculated
 */
async function setPrices(uncheckedItems: Map<string,Item>) {
    const PRICE_URL_START = "https://west.albion-online-data.com/api/v2/stats/history/";
    const PRICE_URL_END_OLD = await previousDateString()+"&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
    const PRICE_URL_END_NEW = await currentDateString()+"&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
    const startStringLength = PRICE_URL_START.length;
    const endStringLength = Math.max(PRICE_URL_END_OLD.length,PRICE_URL_END_NEW.length);
    const MAX_URL_LENGTH = 4096;
    // Note: Missing time scale so that I can test out all 3 possible timescales
    let currentItemString = "";
    uncheckedItems.forEach(async currentItem => {
        // Check if more prices can fit into current URL
        let currentPriceId = currentItem.priceId;
        if (currentItemString.length + currentPriceId.length < MAX_URL_LENGTH) {
            if (currentItemString.length == 0) {
                currentItemString = currentPriceId;
            } else {
                currentItemString += (","+currentPriceId);
            }
        } else {
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
            await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_NEW,DateEnum.NEW);
            currentItemString = currentItem.id;
        }
    });
    if (currentItemString === "") {
        console.log("No more new prices to collect.");
        return;
    }
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_OLD,DateEnum.OLD);
    await getPrices(PRICE_URL_START+currentItemString+PRICE_URL_END_NEW,DateEnum.NEW);
    uncheckedItems.clear();
}

/**
 * 
 * @param {string} priceURL URL needed for api, not including timescale
 * @param {DateEnum} timeSpan OLD or NEW, representing previous patch or current patch, respectively
 */
async function getPrices(priceURL:string,timeSpan: DateEnum) {
    function fixLocation(initialLocation:string) {
        if (initialLocation == "5003") {
            return "Brecilien";
        } else {
            return initialLocation;
        }
    }
    console.log("Price url: "+priceURL);
    const timescales = [1,6,24]
    for (const timescale of timescales) {
        let priceContents = await fetch(priceURL+timescale);
        let priceContentsJSON = await priceContents.json();
        // Check timescale and update prices if timescale is higher
        for (const currentItem of priceContentsJSON) {
            const currentPriceId = currentItem.item_id;
            let targetItem; 
            if (!checkedItems.has(currentPriceId)) {
                console.log("priceId "+currentPriceId+" was not added to checkedItems");
                targetItem = new Item(currentPriceId);
                checkedItems.set(currentPriceId,targetItem);
            } else {
                targetItem = checkedItems.get(currentPriceId);
            }
            // Get prices; set to appropriate location
            const location = fixLocation(currentItem["location"]);
            const quality = currentItem["quality"];
            //console.log("target item: "+targetItem);
            const priceInfo = targetItem.priceInfos.get(timeSpan);
            if (quality <= 2) {
                if (!priceInfo.priceQualities.has(location) || quality >= priceInfo.priceQualities.get(location)) {
                    // add price if timescale is better
                    const data = currentItem["data"];
                    // Find timescale difference
                    const startDate = data[0]["timestamp"];
                    const endDate = data[data.length-1]["timestamp"];
                    const timescale = (Date.parse(endDate)-Date.parse(startDate));
                    // console.log(`start date: ${startDate}, end date: ${endDate}`);
                    if (!priceInfo.priceTimescale.has(location) || timescale > priceInfo.priceTimescale.get(location)) {
                        let total = 0;
                        for (const timestampData of data) {
                            total += timestampData["avg_price"];
                        }
                        const average = total/data.length;
                        //console.log("average: "+average);
                        priceInfo.price.set(location,average);
                        //console.log("Updating with new prices")
                    }
                    
                    // Find timescale
                }
            }
            
        }
        console.log("Done with timescale "+ timescale);
    }
}

function displayRecipes(ids:string[]) {
    for (const currentPriceId of ids) {
        const currentItem = checkedItems.get(currentPriceId);

        // Set up div to contain the current recipe box
        const currentBox = document.createElement('div'); // creates the element
        currentBox.id = currentPriceId;
        document.getElementById("recipes-area")!.appendChild(currentBox);

        // Item description bar (shows up before slide toggling)
        const itemDescriptor = document.createElement("div");
        itemDescriptor.innerText = idToName[currentPriceId];
        itemDescriptor.innerText += ` (${currentItem.tier}.${currentItem.enchantment})`;
        currentBox.appendChild(itemDescriptor);

        // Display area for items
        const displayBox = document.createElement("figure");
        // Svg to display associated lines
        const boxLines = document.createElementNS("http://www.w3.org/2000/svg",'svg');
        boxLines.setAttribute("height",(2000).toString());
        boxLines.setAttribute("width",(4000).toString());
        const defs = document.createElementNS("http://www.w3.org/2000/svg","defs");
        const arrowhead = document.createElementNS("http://www.w3.org/2000/svg","marker");
        const path = document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d","M 0 0 L 5 2.5 L 0 5 Z");
        //path.setAttribute("fill","black");
        arrowhead.appendChild(path);
        arrowhead.setAttribute("id","arrow"); 
        arrowhead.setAttribute("markerWidth","5");
        arrowhead.setAttribute("markerHeight","5");
        
        arrowhead.setAttribute("refX","2.5");
        arrowhead.setAttribute("refY","2.5");
        
        arrowhead.setAttribute("orient","auto");
        defs.appendChild(arrowhead);
        boxLines.appendChild(defs);
        displayBox.appendChild(boxLines);
        currentBox.appendChild(displayBox);

        // START CREATING BOXES TO DISPLAY INSIDE DISPLAY BOX
        // Set up nodes and links to connect using d3
        type D3Node = {
            box:RecipeBox,
            x:number,
            y:number
        }
        const nodes:D3Node[] = []; // Recipe boxes
        const links:{
            "source":number|D3Node,
            "target":number|D3Node,
            "itemBox":ItemBox,
            "line":SVGElement|undefined
        }[] = []; // Links between recipe boxes that also contain information for which item is actually linked


        // Set of item IDs that have been visited already mapped to an array of recipe link indexes (do not need to create associated recipes again)
        const visitedItems = new Map<string,number[]>();

        // Stack of ItemBoxes whose recipes still need processing
        const itemBoxStack:ItemBox[] = [];

        // Create the head box
        const headBox = new RecipeBox(null);
        headBox.index = 0;
        const itemBox = new ItemBox(headBox,currentItem,0,1);
        headBox.setWidth(ItemBox.BOX_WIDTH+4.8); //4.8 to account for border width
        itemBox.currentBox.style.backgroundColor = "gold";
        headBox.currentBox.appendChild(itemBox.currentBox);
        nodes.push({"box":headBox,x:0,y:0});
        itemBoxStack.push(itemBox);
        displayBox.appendChild(headBox.currentBox);

        // Iterate through all recipes, adding to nodes and links
        while (itemBoxStack.length > 0) {
            const activeItemBox = itemBoxStack.pop()!;
            const activeItem = activeItemBox.item;
            // Check if active item has already been visited somewhere else
            if (visitedItems.has(activeItem.priceId)) {
                // If so, just create connections to pre-existing recipe boxes
                for (const sourceIndex of visitedItems.get(activeItem.priceId)!) {
                    // Add current item box to the array of items that the current recipe is used to craft
                    nodes[sourceIndex]!.box.craftedItems.push(activeItemBox);
                    links.push({
                        "source":sourceIndex,
                        "target":activeItemBox.boundingRecipe.index,
                        "itemBox":activeItemBox,
                        "line":undefined
                    });
                    activeItemBox.links.set(nodes[sourceIndex]!.box,links[links.length-1]);
                }
            } else {
                // Otherwise, create new recipe boxes and add links to them
                const sourceIndexes = [];
                for (const recipe of activeItem.recipes) {
                    const resourceCount = recipe.resources.length;
                    // Create recipe box for item
                    //console.log("recipe: "+recipe.resources[0]);
                    const recipeBox = new RecipeBox(activeItemBox);
                    displayBox.appendChild(recipeBox.currentBox);
                    recipeBox.setWidth(resourceCount*ItemBox.BOX_WIDTH+4.8); // 4.8 to account for border width
                    recipeBox.index = nodes.length;
                    // add recipe box to nodes
                    nodes.push({"box":recipeBox,x:0,y:0});
                    // Create a link from recipe box to the bounding box, with the active item box as additional information
                    links.push({
                        "source":recipeBox.index,
                        "target":activeItemBox.boundingRecipe.index,
                        "itemBox":activeItemBox,
                        "line":undefined
                    });
                    activeItemBox.links.set(recipeBox,links[links.length-1]);
                    sourceIndexes.push(recipeBox.index);
                    for (let i = 0; i < resourceCount; i++) {
                        const offset = ItemBox.BOX_WIDTH*i;
                        const newItemId = recipe.resources[i]!.priceId;
                        const newItemCount = recipe.resources[i]!.count;
                        const currentItemBox = new ItemBox(recipeBox,checkedItems.get(newItemId),offset,newItemCount);
                        recipeBox.currentBox.appendChild(currentItemBox.currentBox);
                        itemBoxStack.push(currentItemBox);
                    }
                }
                visitedItems.set(activeItem.priceId,sourceIndexes);
            }
        }
        calculateCosts(itemBox);
        // Create svg elements to correspond with lines
        for (const link of links) {
            const line = document.createElementNS('http://www.w3.org/2000/svg','line');
            line.setAttribute("marker-end","url(#arrow)");
            link.line = line;
            boxLines.appendChild(line);
        }
        var simulation = d3
            .forceSimulation(nodes)
            //.force('charge', d3.forceManyBody().strength(-600))
            .force('link',d3.forceLink(links))
            .force("collide",d3.forceCollide().radius((node:any) => node.box.width/2).strength(0.5))
            .force('x', d3.forceX(0).strength(0.5))
            .force('y', d3.forceY(0).strength(0.5))
            //.force('center', d3.forceCenter(0,0));
        
        console.log(nodes);
        console.log(links);
        simulation.on('tick', () => {
            // Find the minimum node x and y values in order to shift all nodes by that amount
            let minX = Number.MAX_SAFE_INTEGER;
            let minY = Number.MAX_SAFE_INTEGER;
            let maxX = 0;
            let maxY = 0;
            for (const node of nodes) {
                minX = Math.min(minX,node.x-node.box.width/2);
                minY = Math.min(minY,node.y-node.box.height/2);
                maxX = Math.max(maxX,node.x+node.box.width/2);
                maxY = Math.max(maxY,node.y+node.box.height/2);
            }
            boxLines.setAttribute("height",(maxY-minY).toString());
            boxLines.setAttribute("width",(maxX-minX).toString());
            for (const node of nodes) {
                node.box.setX(node.x-minX-node.box.width/2);
                node.box.setY(node.y-minY-node.box.height/2);
            }
            for (const link of links) {
                if (link.line != undefined && typeof link.source == "object" && typeof link.target == "object") { // d3 automatically messes with object types
                    const line = link.line;
                    // Source of line position (the items being used to craft)
                    line.setAttribute("x1", (link.source.x-minX).toString());
                    line.setAttribute("y1", (link.source.y-minY).toString());

                    // Destination of line position (the item being crafted)
                    line.setAttribute("x2", (link.target.x-minX-link.target.box.width/2+link.itemBox.offset+ItemBox.BOX_WIDTH/2).toString());
                    if (link.target.y > link.source.y) {
                        line.setAttribute("y2", (link.target.y-minY-link.target.box.height/2).toString());
                    } else {
                        line.setAttribute("y2", (link.target.y-minY+link.target.box.height/2).toString());
                    }
                }
                
            }
        });
    }
}

/**
 * 
 * @param {ItemBox} currentItemBox 
 * @return {Number}
 */
function calculateCosts(currentItemBox: ItemBox) {
    // Figure out minimum crafting cost among links of the current item

    // Determine minimum cost (compare to buying the item itself)
    
    // Display minimum crafting cost using craftingCost field 
    console.log(currentItemBox.item.priceId);
}

/**
 * 
 * @param {RecipeBox} currentRecipeBox
 * @return {Number} total crafting cost of current recipe box
 */
function calculateCraftingCost(currentRecipeBox:RecipeBox) {

}
/*
function calculateProfit(itemID:string,tax:number) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}
*/

document.getElementById("load-price-button")?.addEventListener("click",getProfits);

(<any>$( "#item-name" )).autocomplete({
    source: names
});

$("#city-selector").on("change",()=>{
    getProfits();
    console.log($("#city-selector").val());
});

$("#date-selector").on("change",()=>{
    getProfits();
    console.log($("#date-selector").is(":checked"));
});

$("#recipes-area").on("click","div figure", function(event){
    console.log("click");
    event.stopPropagation();
});

$("#recipes-area").on("click","div",function(){
    //const currentClass = $(this).attr("id");
    $(this).find("figure").slideToggle("slow");
    $(this).find("svg").slideToggle("slow");
});