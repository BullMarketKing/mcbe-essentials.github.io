// Use var sf_inStructs = [];
// Use var sf_importedData;

if(document.getElementById("sf_dataFileInput_single")){
  const projectInputElement = document.getElementById("sf_dataFileInput_single");

  //Set the filereader type to "text" by default
  var readertype = "text";
  //Change the filereader type if the <input> element contains a "readertype" attribute
  if(projectInputElement.hasAttribute("readertype")){
      readertype = projectInputElement.getAttribute("readertype");
  }

  //Add the event listener to the input element
  projectInputElement.addEventListener("change", function(){
    // Reset uploaded structs
    sf_inStructs = [];

    // Import file.
    var file = this.files[0];
    sf_importFile(file, 'sf_importedData', readertype, sf_parseImportedData);
  });
}
