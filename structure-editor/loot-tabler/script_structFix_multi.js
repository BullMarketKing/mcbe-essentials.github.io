// Use var sf_inStructs;

function sf_fixStructure() {
  sf_validateInput();

  var zip = new JSZip();
  var nProcessed = 0;

  sf_inStructs.forEach((inStruct, i) => {
    if(sf_canFix(inStruct.structure, inStruct.fileName)) {
      var outStruct = {
        fileName: inStruct.fileName,
        structure: sf_fixStruct(inStruct.structure, inStruct.fileName)
      };

      zip.file(outStruct.fileName, nbt.writeUncompressed(outStruct.structure, 'little'));

      nProcessed++;
    }
  });

  zip.generateAsync({type:"blob"})
    .then(function (blob) {
      saveAs(blob, "structures.zip");
  });

  console.log('sf_fixStructure: Complete. Total:' + sf_inStructs.length
    + ' Processed:' + nProcessed
    + ' Skipped:' + (sf_inStructs.length - nProcessed));
}

function sf_generateLootTables() {
  sf_validateInput_single();

  var zip = new JSZip();
  var nProcessed = 0;

  sf_inStructs.forEach((inStruct, i) => {
    if(sf_canFix(inStruct.structure, inStruct.fileName)) {
      var outLootTables = sf_makeLootTables(inStruct.structure, inStruct.fileName);

      outLootTables.forEach((outLootTable, i) => {
        var lootTableAsJson = JSON.stringify(outLootTable.lootTable, null, 3);
        zip.file(outLootTable.fileName, lootTableAsJson);
      });

      nProcessed++;
    }
  });

  zip.generateAsync({type:"blob"})
    .then(function (blob) {
      saveAs(blob, "loot_tables.zip");
  });

  console.log('sf_generateLootTables: Complete. Total:' + sf_inStructs.length
    + ' Processed:' + nProcessed
    + ' Skipped:' + (sf_inStructs.length - nProcessed));
}

function sf_validateInput() {
  if(sf_inStructs.length == 0) {
    throw 'No structs loaded.'
  }
}


