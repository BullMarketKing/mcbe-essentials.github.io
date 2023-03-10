var sf_importedData;

function sf_importFile(file, projectVariable, readertype, callback){
  console.log('sf_importFile: ' + file.name);

  var reader = new FileReader();
  reader.onload = function(e){
    window[projectVariable] = e.target.result;
    callback(file);
  }

  switch(readertype){
    case 'arraybuffer':
      reader.readAsArrayBuffer(file);
      break;
    case 'dataurl':
      reader.readAsDataURL(file);
      break;
    case 'binarystring':
      reader.readAsBinaryString(file);
      break;
    case 'arraybuffer/text':
      //Unique to Structure Editor, this will read as text if a JSON file is imported, but read as ArrayBuffer if any other type is imported.
      if(window.location.pathname === "/structure-editor/old/"){
        //Show loading button in Legacy Structure Editor
        document.getElementById("loading2").style.display = "block";
        document.getElementById("upload2").style.display = "none";
      }
      //console.log(file);
      if(file.name.endsWith(".json")){
        reader.readAsText(file);
        console.log('text');
      } else {
        reader.readAsArrayBuffer(file);
        console.log('ab');
      }
      break;
    default:
      reader.readAsText(file);
  }
}
