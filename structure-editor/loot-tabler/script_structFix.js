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

function fixStruct(oStruct, structFilename) {
  // Get reference to tiles.
  var oEntities = oStruct.value.structure.value.entities.value.value;
  var oTileEntities;
  if(oStruct.value.structure.value.palette.value.default){
    oTileEntities = Object.values(oStruct.value.structure.value.palette.value.default.value.block_position_data.value);
  } else {
    throw "There are no tile entities in the structure.";
  }

  // Find container tiles.
  var cTileIndecies = [];
  for(var i = 0; i < oTileEntities.length; i++){
    if(oTileEntities[i].value.block_entity_data){
      var name = oTileEntities[i].value.block_entity_data.value.id.value;
      if(Object.keys(allTEntities).includes(name)
        && allTEntities[name].type == "container"
        && !allTEntities[name].behavior){
        // PON: oTileEntities[i] is container.
        cTileIndecies.push(i);
      }
    }
  }

  // Generate unique container names.
  // cNames is array of names indexed by tile index.
  var cNames = sf_nameContainers(oTileEntities, cTileIndecies);

  var lootTables = [];
  for(var i = 0; i < cTileIndecies.length; i++) {
    // Get container tile.
    var cTileIdx = cTileIndecies[i];
    var cTile = oTileEntities[cTileIdx];
    var cName = cNames[cTileIdx];

    // Log container tile position.
    var cPosition = sf_getTilePosition(oStruct, cTile);
    console.log('Container position: ' + JSON.stringify(cPosition));

    // Log container detail.
    sf_traceContainer(cTile);

    // Make loot table.
    var lootTable = sf_makeLootTable(cTile);
    lootTables.push(lootTable);

    // Make changes to container.
    sf_setLookTable(cTile, structFilename, cName);
    //sf_clearContainer(cTile);
  }

  return lootTables;
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
    var itemName = storageLocation[i].Name.value;
    var itemCount = storageLocation[i].Count.value;
    var itemSlot = storageLocation[i].Slot.value;

    // Create pool.
    ltPools[itemSlot] = {
      rolls: 1,
      entries: [
        {
          type: "item",
          name: itemName,
          functions: [
            {
              function: "set_count",
              count: itemCount
            }
          ]
        }
      ]
    };
  }

  // Create pools for empty slots.
  for(var i = 0; i < ltPools.length; i++) {
    if(ltPools[i]) {
      continue;
    }
    ltPools[i] = {
      rolls: 1,
      entries: [
        {
          type: "empty"
        }
      ]
    };
  }

  return oLootTable;
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
