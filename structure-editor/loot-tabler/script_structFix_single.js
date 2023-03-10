// Use var sf_inStructs;

function sf_fixStructure_single() {
  sf_validateInput_single();

  var inStruct = sf_inStructs[0];

  if(!sf_canFix(inStruct.structure, inStruct.fileName)) {
    return;
  }

  var outStruct = {
    fileName: inStruct.fileName,
    structure: sf_fixStruct(inStruct.structure, inStruct.fileName)
  };

  exportFile(new File([nbt.writeUncompressed(outStruct.structure, 'little')], "hello.mcstructure"), outStruct.fileName);
}

function sf_generateLootTables_single() {
  sf_validateInput_single();

  var inStruct = sf_inStructs[0];

  if(!sf_canFix(inStruct.structure, inStruct.fileName)) {
    return;
  }

  var outLootTables = sf_makeLootTables(inStruct.structure, inStruct.fileName);

  var zip = new JSZip();
  outLootTables.forEach((outLootTable, i) => {
    var lootTableAsJson = JSON.stringify(outLootTable.lootTable, null, 3);
    zip.file(outLootTable.fileName, lootTableAsJson);
  });

  zip.generateAsync({type:"blob"})
    .then(function (blob) {
      saveAs(blob, "loot_tables.zip");
  });
}

function sf_validateInput_single() {
  if(sf_inStructs.length == 0) {
    throw 'No structs loaded.'
  }
}


