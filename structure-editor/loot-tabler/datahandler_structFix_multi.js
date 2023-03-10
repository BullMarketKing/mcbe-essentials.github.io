// Use var sf_inStructs = [];
// Use var sf_importedData;

if(document.getElementById("sf_dataFileInput")){
  const projectInputElement = document.getElementById("sf_dataFileInput");

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

    // Import files.
    for(var i = 0; i < this.files.length; i++) {
      var file = this.files[i];
      sf_importFile(file, 'sf_importedData', readertype, sf_parseImportedData);
    }
  });
}
