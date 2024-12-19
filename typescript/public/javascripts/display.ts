import { ItemBox, RecipeBox } from "./classes/display-boxes.js";
import { idToName } from "./external-data.js";
import { DateEnum, Item } from "./classes/item.js";
import { City } from "./globals/constants.js";

/**
 * Displays item boxes
 * @param items 
 * @param string 
 * @param param2 
 * @returns Array of all ItemBoxes currently being displayed
 */
function displayBoxes(items:Map<string,Item>, ids:string[]):ItemBox[] {
    document.getElementById("recipes-area")!.innerHTML = "";
    const itemBoxes:ItemBox[] = [];
    for (const currentPriceId of ids) {
        const currentItem = items.get(currentPriceId);
        if (!currentItem) {
            console.log("current item with id "+currentPriceId+" was not found");
            break;
        }
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
        const boxLines = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        boxLines.setAttribute("height", (2000).toString());
        boxLines.setAttribute("width", (4000).toString());
        displayBox.appendChild(boxLines);
        currentBox.appendChild(displayBox);
        const currentItemBoxes = createAndLinkBoxes(currentItem,displayBox,boxLines);
        itemBoxes.push(...currentItemBoxes);
    }
    return itemBoxes;
}

/**
 * Update item boxes so that they display prices that match user inputted values
 * @param itemBoxes 
 * @param stationFees 
 * @param productionBonuses 
 */
function displayPrices(itemBoxes:ItemBox[], timespan:DateEnum,city:City,stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
    for (const itemBox of itemBoxes) {
        itemBox.loadItemData(timespan,city,stationFees,productionBonuses);
    }
}

function createAndLinkBoxes(baseItem:Item,displayBox:HTMLElement,boxLines:SVGSVGElement):ItemBox[] {
    const itemBoxes:ItemBox[] = [];
    // START CREATING BOXES TO DISPLAY INSIDE DISPLAY BOX
    // Set up nodes and links to connect using d3
    type D3Node = {
        box: RecipeBox,
        x: number,
        y: number
    }
    const nodes: D3Node[] = []; // Recipe boxes
    const links: {
        "source": number | D3Node,
        "target": number | D3Node,
        "itemBox": ItemBox,
        "line": SVGElement | undefined
    }[] = []; // Links between recipe boxes that also contain information for which item is actually linked


    // Set of item IDs that have been visited already mapped to an array of recipe link indexes (do not need to create associated recipes again)
    const visitedItems = new Map<string, number[]>();

    // Stack of ItemBoxes whose recipes still need processing
    const itemBoxStack: ItemBox[] = [];

    // Create the head box
    const headBox = new RecipeBox(null);
    headBox.index = 0;
    const itemBox = new ItemBox(headBox, baseItem, 0, 1);
    itemBoxes.push(itemBox);
    headBox.setWidth(ItemBox.BOX_WIDTH + 4.8); //4.8 to account for border width
    itemBox.currentBox.style.backgroundColor = "gold";
    headBox.currentBox.appendChild(itemBox.currentBox);
    nodes.push({ "box": headBox, x: 0, y: 0 });
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
                    "source": sourceIndex,
                    "target": activeItemBox.boundingRecipe.index,
                    "itemBox": activeItemBox,
                    "line": undefined
                });
                activeItemBox.links.set(nodes[sourceIndex]!.box, links[links.length - 1]);
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
                    const newItem = recipe.resources[i]!.item;
                    const newItemCount = recipe.resources[i]!.count;
                    const currentItemBox = new ItemBox(recipeBox, newItem, offset, newItemCount);
                    itemBoxes.push(currentItemBox);
                    recipeBox.currentBox.appendChild(currentItemBox.currentBox);
                    itemBoxStack.push(currentItemBox);
                }
            }
            visitedItems.set(activeItem.priceId, sourceIndexes);
        }
    }
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
        .force("collide", d3.forceCollide().radius((node: any) => node.box.width / 2).strength(0.5))
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
                } else {
                    line.setAttribute("y2", (link.target.y - minY + link.target.box.height / 2).toString());
                }
            }

        }
    });
    return itemBoxes;
}


export {displayBoxes,displayPrices};