# Albion Online Crafting Calculator (STILL IN PROGRESS)
A crafting calculator for the video game Albion Online, available at https://albion-project-9585a.web.app/ and https://albion-project-9585a.firebaseapp.com/
## Description
To use, enter your target item name and select the associated menu options.
### Code Overview
1. The program loads data from Firebase, which includes crafting recipes and conversions between the official names ingame and the internal names used for items.
2. Listeners are set up for the city selector, the new/old price selector, and the "load prices" button in order to display the prices of the item specified.
3. Once an event occurs that causes the loading of prices:
4. Determines all items that share the same name (Tiers 4-8, all enchantment levels), then adds those items, along with all items potentially used to craft them, to a Map
5. Fetches JSON of prices from Albion Online Data
6. Displays all the items and their relations to each other using a force-directed graph from d3.js  
## Features in use
* Firebase (hosts the webpage)
* Firebase Storage
* jQuery
* [d3.js](https://d3js.org/) for displaying items in a graphically organized way
* [Albion Online Data Project](https://www.albion-online-data.com/) for accessing item price data.
* [ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps) repository  for collecting item crafting requirements.
