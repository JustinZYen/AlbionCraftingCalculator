"use strict";
import { idToName, names } from "./external-data.js";
import { RecipeBox, ItemBox } from "./display-boxes.js";
import { ItemData } from "./item-data.js";
class CraftTypeEnum {
    static REFINING = Symbol("Refining");
    static CRAFTING = Symbol("Crafting");
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
function displayRecipes(checkedItems, ids) {
    for (const currentPriceId of ids) {
        const currentItem = checkedItems.get(currentPriceId);
        // Set up div to contain the current recipe box
        const currentBox = document.createElement('div'); // creates the element
        currentBox.id = currentPriceId;
        document.getElementById("recipes-area").appendChild(currentBox);
        // Item description bar (shows up before slide toggling)
        const itemDescriptor = document.createElement("div");
        itemDescriptor.innerText = idToName[currentPriceId];
        itemDescriptor.innerText += ` (${currentItem.tier}.${currentItem.enchantment})`;
        currentBox.appendChild(itemDescriptor);
        // Display area for items
        const displayBox = document.createElement("figure");
        // Svg to display associated lines
        const boxLines = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        boxLines.setAttribute("height", (2000).toString());
        boxLines.setAttribute("width", (4000).toString());
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M 0 0 L 5 2.5 L 0 5 Z");
        //path.setAttribute("fill","black");
        arrowhead.appendChild(path);
        arrowhead.setAttribute("id", "arrow");
        arrowhead.setAttribute("markerWidth", "5");
        arrowhead.setAttribute("markerHeight", "5");
        arrowhead.setAttribute("refX", "2.5");
        arrowhead.setAttribute("refY", "2.5");
        arrowhead.setAttribute("orient", "auto");
        defs.appendChild(arrowhead);
        boxLines.appendChild(defs);
        displayBox.appendChild(boxLines);
        currentBox.appendChild(displayBox);
        const nodes = []; // Recipe boxes
        const links = []; // Links between recipe boxes that also contain information for which item is actually linked
        // Set of item IDs that have been visited already mapped to an array of recipe link indexes (do not need to create associated recipes again)
        const visitedItems = new Map();
        // Stack of ItemBoxes whose recipes still need processing
        const itemBoxStack = [];
        // Create the head box
        const headBox = new RecipeBox(null);
        headBox.index = 0;
        const itemBox = new ItemBox(headBox, currentItem, 0, 1);
        headBox.setWidth(ItemBox.BOX_WIDTH + 4.8); //4.8 to account for border width
        itemBox.currentBox.style.backgroundColor = "gold";
        headBox.currentBox.appendChild(itemBox.currentBox);
        nodes.push({ "box": headBox, x: 0, y: 0 });
        itemBoxStack.push(itemBox);
        displayBox.appendChild(headBox.currentBox);
        // Iterate through all recipes, adding to nodes and links
        while (itemBoxStack.length > 0) {
            const activeItemBox = itemBoxStack.pop();
            const activeItem = activeItemBox.item;
            // Check if active item has already been visited somewhere else
            if (visitedItems.has(activeItem.priceId)) {
                // If so, just create connections to pre-existing recipe boxes
                for (const sourceIndex of visitedItems.get(activeItem.priceId)) {
                    // Add current item box to the array of items that the current recipe is used to craft
                    nodes[sourceIndex].box.craftedItems.push(activeItemBox);
                    links.push({
                        "source": sourceIndex,
                        "target": activeItemBox.boundingRecipe.index,
                        "itemBox": activeItemBox,
                        "line": undefined
                    });
                    activeItemBox.links.set(nodes[sourceIndex].box, links[links.length - 1]);
                }
            }
            else {
                // Otherwise, create new recipe boxes and add links to them
                const sourceIndexes = [];
                for (const recipe of activeItem.recipes) {
                    const resourceCount = recipe.resources.length;
                    // Create recipe box for item
                    //console.log("recipe: "+recipe.resources[0]);
                    const recipeBox = new RecipeBox(activeItemBox);
                    displayBox.appendChild(recipeBox.currentBox);
                    recipeBox.setWidth(resourceCount * ItemBox.BOX_WIDTH + 4.8); // 4.8 to account for border width
                    recipeBox.index = nodes.length;
                    // add recipe box to nodes
                    nodes.push({ "box": recipeBox, x: 0, y: 0 });
                    // Create a link from recipe box to the bounding box, with the active item box as additional information
                    links.push({
                        "source": recipeBox.index,
                        "target": activeItemBox.boundingRecipe.index,
                        "itemBox": activeItemBox,
                        "line": undefined
                    });
                    activeItemBox.links.set(recipeBox, links[links.length - 1]);
                    sourceIndexes.push(recipeBox.index);
                    for (let i = 0; i < resourceCount; i++) {
                        const offset = ItemBox.BOX_WIDTH * i;
                        const newItemId = recipe.resources[i].priceId;
                        const newItemCount = recipe.resources[i].count;
                        const currentItemBox = new ItemBox(recipeBox, checkedItems.get(newItemId), offset, newItemCount);
                        recipeBox.currentBox.appendChild(currentItemBox.currentBox);
                        itemBoxStack.push(currentItemBox);
                    }
                }
                visitedItems.set(activeItem.priceId, sourceIndexes);
            }
        }
        calculateCosts(itemBox);
        // Create svg elements to correspond with lines
        for (const link of links) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute("marker-end", "url(#arrow)");
            link.line = line;
            boxLines.appendChild(line);
        }
        var simulation = d3
            .forceSimulation(nodes)
            //.force('charge', d3.forceManyBody().strength(-600))
            .force('link', d3.forceLink(links))
            .force("collide", d3.forceCollide().radius((node) => node.box.width / 2).strength(0.5))
            .force('x', d3.forceX(0).strength(0.5))
            .force('y', d3.forceY(0).strength(0.5));
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
                minX = Math.min(minX, node.x - node.box.width / 2);
                minY = Math.min(minY, node.y - node.box.height / 2);
                maxX = Math.max(maxX, node.x + node.box.width / 2);
                maxY = Math.max(maxY, node.y + node.box.height / 2);
            }
            boxLines.setAttribute("height", (maxY - minY).toString());
            boxLines.setAttribute("width", (maxX - minX).toString());
            for (const node of nodes) {
                node.box.setX(node.x - minX - node.box.width / 2);
                node.box.setY(node.y - minY - node.box.height / 2);
            }
            for (const link of links) {
                if (link.line != undefined && typeof link.source == "object" && typeof link.target == "object") { // d3 automatically messes with object types
                    const line = link.line;
                    // Source of line position (the items being used to craft)
                    line.setAttribute("x1", (link.source.x - minX).toString());
                    line.setAttribute("y1", (link.source.y - minY).toString());
                    // Destination of line position (the item being crafted)
                    line.setAttribute("x2", (link.target.x - minX - link.target.box.width / 2 + link.itemBox.offset + ItemBox.BOX_WIDTH / 2).toString());
                    if (link.target.y > link.source.y) {
                        line.setAttribute("y2", (link.target.y - minY - link.target.box.height / 2).toString());
                    }
                    else {
                        line.setAttribute("y2", (link.target.y - minY + link.target.box.height / 2).toString());
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
function calculateCosts(currentItemBox) {
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
function calculateCraftingCost(currentRecipeBox) {
}
/*
function calculateProfit(itemID:string,tax:number) {
    const sellPrice = getAveragePrices(itemID);
    const craftPrice = getCraftingPrice(itemID);
    return (1-tax)*sellPrice-craftPrice;
}
*/
const itemData = new ItemData();
document.getElementById("load-price-button")?.addEventListener("click", async () => {
    await itemData.getProfits();
    displayRecipes(itemData.checkedItems, itemData.ids);
});
$("#item-name").autocomplete({
    source: names
});
$("#city-selector").on("change", () => {
    itemData.getProfits();
    console.log($("#city-selector").val());
});
$("#date-selector").on("change", () => {
    itemData.getProfits();
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
