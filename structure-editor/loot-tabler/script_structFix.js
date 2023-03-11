// Use var sf_importedData;

// Uploaded structures
// Element:
//   - fileName
//   - structure
var sf_inStructs = [];
var sf_lootTablePath = 'loot_tables';

// Fixed structure and loot-tables.
// Element:
//   - fileName: string
//   - structure: object
//   - lootTables: [] of lootTable
var sf_fixed = [];

function sf_parseImportedData(file){
  if(file.name.endsWith('.json')){
    throw '.json not supported';
  } else {
    nbt.parse(Buffer.from(sf_importedData)).then(function(data){
      var oStruct = data.parsed;
      if(oStruct.value.entities){
        alert("Unfortunately, this app currently doesn't support Java edition structure files."); return;
      }

      sf_inStructs.push({
        fileName: file.name,
        structure: oStruct
      });

      console.log('sf_parseImportedData: File imported: ' + file.name);
    });
  }
}

function sf_canFix(oStruct, fileName)
{
  var cTiles = sf_getContainerTiles(oStruct);

  if(cTiles.length == 0) {
    console.warn('Structure has no container. File: ' + fileName);
    return false;
  }

  var missingLootTable = false;
  cTiles.forEach((cTile, i) => {
    if(!sf_hasLootTable(cTile)) {
      missingLootTable = true;
    }
  });

  if(!missingLootTable) {
    console.warn('All containers have loot table. File: ' + fileName);
    return false;
  }

  return true;
}

function sf_fixStruct(struct, fileName) {
  console.log('sf_fixStruct: File: ' + fileName);

  // Make copy of input struct.
  var oStruct = JSON.parse(JSON.stringify(struct));

  // Find container tiles.
  var cTiles = sf_getContainerTiles(oStruct);

  // Generate unique container names.
  // cNames is array of names for each element in cTiles.
  var cNames = sf_nameContainers(cTiles);

  // Set loot-table for tiles.
  cTiles.forEach((cTile, i) => {
    var cName = cNames[i];
    console.log('sf_fixStruct: container:' + cName);

    if(sf_hasLootTable(cTile)) {
      console.warn('sf_fixStruct: Loot table exists for container. Skip. container:' + cName);
    }
    else {
      sf_setLootTable(cTile, fileName, cName);
      sf_emptyContainer(cTile, cName);
    }
  });

  return oStruct;
}

function sf_makeLootTables(struct, fileName) {
  console.log('sf_makeLootTables: File: ' + fileName);

  // Use input struct without cloning. We don't modify it.
  var oStruct = struct;

  // Find container tiles.
  var cTiles = sf_getContainerTiles(oStruct);

  // Generate unique container names.
  // cNames is array of names for each element in cTiles.
  var cNames = sf_nameContainers(cTiles);

  // Set loot-table for tiles.
  var outLootTables = [];
  cTiles.forEach((cTile, i) => {
    var cName = cNames[i];
    console.log('sf_makeLootTables: container:' + cName);

    if(sf_hasLootTable(cTile)) {
      console.warn('sf_fixStruct: Loot table exists for container. Skip. container:' + cName);
    }
    else {
      outLootTables.push({
        fileName: sf_makeLootTableFileName(fileName, cName),
        lootTable: sf_makeLootTable(cTile, cName)
      });
    }
  });

  return outLootTables;
}

function sf_getContainerTiles(oStruct) {
  // Get reference to tiles.
  var oTileEntities;
  if(oStruct.value.structure.value.palette.value.default){
    oTileEntities = Object.values(oStruct.value.structure.value.palette.value.default.value.block_position_data.value);
  } else {
    throw "There are no tile entities in the structure.";
  }

  var cTiles = [];
  for(var i = 0; i < oTileEntities.length; i++){
    if(oTileEntities[i].value.block_entity_data){
      var name = oTileEntities[i].value.block_entity_data.value.id.value;
      if(Object.keys(allTEntities).includes(name)
        && allTEntities[name].type == "container"
        && !allTEntities[name].behavior){
        cTiles.push(oTileEntities[i]);
      }
    }
  }

  return cTiles;
}

function sf_traceContainer(cTile) {
  console.log('Container type: ' + cTile.value.block_entity_data.value.id.value);

  var oCurrentTileMeta = allTEntities[cTile.value.block_entity_data.value.id.value];

  var totalItems = 0;
  for(var i = 0; i < cTile.value.block_entity_data.value.Items.value.value.length; i++){
    totalItems += cTile.value.block_entity_data.value.Items.value.value[i].Count.value;
  }

  // PON: Checking container's LootTable attribute.
  if(cTile.value.block_entity_data.value.LootTable){
    //document.getElementById("table-path").value = currentTile.value.block_entity_data.value.LootTable.value;
  } else {
    //document.getElementById("table-path").value = "";
  }

  // PON: Checking container's LootTableSeed attribute.
  if(cTile.value.block_entity_data.value.LootTableSeed){
    //document.getElementById("table-seed").value = currentTile.value.block_entity_data.value.LootTableSeed.value;
  } else {
    //document.getElementById("table-seed").value = "";
  }

  if(oCurrentTileMeta.type == "container"){
    var storageLocation = cTile.value.block_entity_data.value.Items.value.value;

    for(var i = 0; i < storageLocation.length; i++){
      console.log('Item[' + i + '] Name: ' + storageLocation[i].Name.value
        + ' Count: ' + storageLocation[i].Count.value
        + ' Slot: ' + storageLocation[i].Slot.value);
    }
    //mcitems.init();
    oCurrentTileMeta.storageLocation = storageLocation;
  }
}

function sf_getTilePosition(oStruct, oTile) {
  var cPosition = [
    oTile.value.block_entity_data.value.x.value - oStruct.value.structure_world_origin.value.value[0],
    oTile.value.block_entity_data.value.y.value - oStruct.value.structure_world_origin.value.value[1],
    oTile.value.block_entity_data.value.z.value - oStruct.value.structure_world_origin.value.value[2],
  ];
  return cPosition;
}

function sf_makeLootTable(cTile, cName) {
  //var containerType = cTile.value.block_entity_data.value.id.value;
  var oCurrentTileMeta = allTEntities[cTile.value.block_entity_data.value.id.value];
  var nSlots = oCurrentTileMeta.slots;

  var oLootTable = {
    pools: Array.apply(null, Array(nSlots)).map(function () {})
  };

  var totalItems = 0;
  for(var i = 0; i < cTile.value.block_entity_data.value.Items.value.value.length; i++){
    totalItems += cTile.value.block_entity_data.value.Items.value.value[i].Count.value;
  }

  var ltPools = oLootTable.pools;
  var storageLocation = cTile.value.block_entity_data.value.Items.value.value;
  for(var i = 0; i < storageLocation.length; i++){
    var item = storageLocation[i];
    var itemName = item.Name.value;
    var itemCount = item.Count.value;
    var itemSlot = item.Slot.value;

    // Create pool.
    ltPool = { rolls: 1, entries: [
      { type: 'item', name: itemName, functions: [
          { function: 'set_count', count: itemCount }
        ]
      }
    ]};

    sf_genItemAttrsInLootTablePool(item, ltPool);

    ltPools[itemSlot] = ltPool;
  }

  // Create pools for empty slots.
  for(var i = 0; i < ltPools.length; i++) {
    if(ltPools[i]) {
      continue;
    }
    ltPools[i] = { rolls: 1, entries: [{ type: 'empty' }] };
  }

  return oLootTable;
}

function sf_genItemAttrsInLootTablePool(nbtItem, ltPool) {
  var itemName = nbtItem.Name.value;
  var ltFunctions = ltPool.entries[0].functions; 

  // Handle item.Damage.

  if(nbtItem.Damage && nbtItem.Damage.value != 0) {
    var damage = nbtItem.Damage.value;
    if(('minecraft:potion'
      + ' minecraft:lingering_potion'
      + ' minecraft:splash_potion'
      + ' minecraft:arrow'
      + ' minecraft:banner'
      + ' minecraft:empty_map'
      + ' minecraft:goat_horn'
      + ' minecraft:skull').indexOf(itemName) != -1) {
      // These items have been verified.
      ltFunctions.push({
        function: 'set_data',
        data: damage       
      });
      console.log('item.Damage handled by set_dat: value=' + damage + ' ' + itemName);  
    }   
    else if(('minecraft:firework_star').indexOf(itemName) != -1) {
      // These items do not seem to react to set_data.
      ltFunctions.push({
        function: 'set_data',
        data: damage       
      });
      console.log('item.Damage handled by set_dat: value=' + damage + ' ' + itemName);  
    }       
    else {
      // These items have not been verified.
      ltFunctions.push({
        function: 'set_data',
        data: damage       
      });
      console.warn('item.Damage handled by set_dat: value=' + damage + ' ' + itemName);  
    } 
  }
  
  // Handle tag.

  if(typeof(nbtItem.tag) === 'undefined') {
    // No attributes to handle.
    return;
  }

  if(nbtItem.tag.type !== 'compound'
    || typeof(nbtItem.tag.value) === 'undefined') {
    console.warn('handleTag: Invalid tag format. Item:' + itemName);
    return;
  }
  
  var nbtTag = nbtItem.tag.value;
  
  for(const nbtAttrName in nbtTag) {
    const nbtAttr = nbtTag[nbtAttrName];
    if(nbtAttrName === 'ench') {
      try {
        ltFunctions.push({
          function: 'specific_enchants',
          enchants: nbtAttr.value.value.map(x => ({
            id: sf_getEnchantmentName(x.id.value),
            level: x.lvl.value
          }))
        });
        console.log('Enchanted: ' + itemName);
        if(nbtAttr.value.value.length > 1) {
          console.log('Multi-Enchanted: ' + itemName);
        }
      }
      catch (err) {
        throw 'Errored on tag attr: ' + nbtAttrName + err;
      }
    }
    else if(nbtAttrName === 'Damage') {
      try {
        if(nbtAttr.value > 0.0 && nbtAttr.value < 1.0) {
          // Only set if Damage value makes sense.
          ltFunctions.push({
            function: 'set_damage',
            damage: nbtAttr.value
          });
          console.warn('tag.Damage added: value=' + nbtAttr.value + ' ' + itemName);
        }
        else if (nbtAttr.value != 0) {
          console.warn('tag.Damage value out of range. value=' + nbtAttr.value + ' ' + itemName);
        }
        else {
          console.log('tag.Damage = 0. ' + itemName);
        }
      }
      catch (err) {
        throw 'Errored on tag attr: ' + nbtAttrName + err;
      }
    }
    else if(nbtAttrName === 'customColor') {
      try {
        if(('minecraft:leather_helmet'
          + ' minecraft:leather_chestplate'
          + ' minecraft:leather_leggings'
          + ' minecraft:leather_boots').indexOf(itemName) != -1) {
          if(nbtAttr.value) {
            ltFunctions.push({
              function: 'random_dye'
            });
            console.log('customColor-random_dye added:' + itemName);
          }
        }
        else if(('minecraft:firework_star').indexOf(itemName) != -1) {
          if(nbtAttr.value) {
            ltFunctions.push({
              function: 'random_dye'
            });
            console.warn('customColor-random_dye added to fireworks:' + itemName);
          }
        }
        else {
          console.warn('customColor: cannot handle item:' + itemName);
        }
      }
      catch (err) {
        throw 'Errored on tag attr: ' + nbtAttrName + err;
      }
    }
    else if ('Fireworks FireworksItem'.indexOf(nbtAttrName) != -1) {
      console.warn('handleTag: Cannot handle tag attr: ' + nbtAttrName + ' item:' + itemName, nbtTag);      
    }
    else {
      console.warn('handleTag: Unexpected tag attr: ' + nbtAttrName + ' item:' + itemName, nbtTag);
      debugger
    }
  }
}

function sf_getEnchantmentName(id) {
  const enchants = {
    protection: 0,
    fire_protection: 1,
    feather_falling: 2,
    blast_protection: 3,
    projectile_protection: 4,
    thorns: 5,
    respiration: 6,
    depth_strider: 7,
    aqua_affinity: 8,
    sharpness: 9,
    smite: 10,
    bane_of_arthropods: 11,
    knockback: 12,
    fire_aspect: 13,
    looting: 14,
    efficiency: 15,
    silk_touch: 16,
    unbreaking: 17,
    fortune: 18,
    power: 19,
    punch: 20,
    flame: 21,
    infinity: 22,
    luck_of_the_sea: 23,
    lure: 24,
    frost_walker: 25,
    mending: 26,
    binding: 27,
    vanishing: 28,
    impaling: 29,
    loyalty: 31,
    channeling: 32,
    multishot: 33,
    piercing: 34,
    quick_charge: 35,
    soul_speed: 36
  };  
  for(var name in enchants) {
    if(enchants[name] == id) {
      return name;
    }
  }
  throw 'Unknown enchantment ID: ' + id;
}

function sf_nameContainers(cTiles) {
  // Dictionary with key = container-type, value = nextId.
  var cTypeNextId = {};
  var cNames = [];
  for(var i = 0; i < cTiles.length; i++) {
    var cTile = cTiles[i];
    var cType = cTile.value.block_entity_data.value.id.value;

    // Increment nextId.
    if(typeof(cTypeNextId[cType]) === 'undefined') {
      cTypeNextId[cType] = 0;
    }
    cTypeNextId[cType]++;

    // Generate name.
    cNames.push(cType + cTypeNextId[cType]);
  }
  return cNames;
}

function sf_hasLootTable(cTile) {
  return cTile.value.block_entity_data.value.LootTable
    && cTile.value.block_entity_data.value.LootTable.value;
}

function sf_setLootTable(cTile, fileName, cName) {
  if(!cTile.value.block_entity_data.value.LootTable){
    cTile.value.block_entity_data.value.LootTable = {
      "type": "string",
      "value": ""
    }
  }

  if(!cTile.value.block_entity_data.value.LootTableSeed){
    cTile.value.block_entity_data.value.LootTableSeed = {
      "type": "int",
      "value": 0
    }
  }

  var ltPath = sf_lootTablePath + '/' + sf_makeLootTableFileName(fileName, cName);
  console.log('sf_setLootTable: container:' + cName + ' ltPath:' + ltPath);

  cTile.value.block_entity_data.value.LootTable.value = ltPath;
  cTile.value.block_entity_data.value.LootTableSeed.value = 0;
}

function sf_makeLootTableFileName(fileName, cName) {
  var newName = fileName.substring(0, fileName.lastIndexOf('.')) + '_' + cName + '.json';
  return newName;
}

function sf_emptyContainer(cTile, cName) {
  console.log('sf_emptyContainer: container:' + cName);
  cTile.value.block_entity_data.value.Items.value.value = [];
}

function sf_addContainerName(cTile, cName) {
  const CNAME_ATTR = '_cn';

  console.log('sf_addContainerName: container:' + cName);

  if(!cTile.value.block_entity_data.value[CNAME_ATTR]){
    cTile.value.block_entity_data.value[CNAME_ATTR] = {
      "type": "string",
      "value": ""
    }
  }

  cTile.value.block_entity_data.value[CNAME_ATTR].value = cName;
}
