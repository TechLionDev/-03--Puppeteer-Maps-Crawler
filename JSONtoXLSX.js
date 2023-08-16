const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const error = clc.red.bold;
const info = clc.cyan.bold;
const success = clc.green.bold;

// Specify the folder paths
const jsonFolderPath = './json/';
const excelFolderPath = './Excel';

// Get the current date for the subfolder
const currentDate = new Date();
const dateFolderName = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
const excelSubFolderPath = path.join(excelFolderPath, dateFolderName);

// Create the Excel subfolder if it doesn't exist
fs.mkdirSync(excelSubFolderPath, { recursive: true });

// Read JSON files in the subfolder corresponding to the current date
fs.readdir(jsonFolderPath, (err, files) => {
  if (err) {
    console.log(error('(⬣) Error reading folder:', err));
    return;
  }

  const combinedWorkbook = XLSX.utils.book_new();
  const combinedData = {};

  files.forEach((file) => {
    if (file.includes('package')) {
      return;
    }
    if (file.endsWith('.json')) {
      console.log(info(`(i) Reading ${file}...\n`));
      const jsonFilePath = path.join(jsonFolderPath, file);
      const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
      const jsonData = JSON.parse(jsonContent);

      // Create a separate workbook for each JSON file
      const jsonWorkbook = XLSX.utils.book_new();
      const jsonWorksheet = XLSX.utils.json_to_sheet(jsonData);
      XLSX.utils.book_append_sheet(jsonWorkbook, jsonWorksheet, 'Sheet1');

      // Save the JSON data to an individual Excel file
      const jsonFileName = `${path.parse(file).name}.xlsx`;
      const excelFilePath = path.join(excelSubFolderPath, jsonFileName);
      XLSX.writeFile(jsonWorkbook, excelFilePath);

      jsonData.forEach((entry) => {
        const { name, address } = entry;
        const key = `${name}-${address}`;
        if (!combinedData[key]) {
          combinedData[key] = entry;
        }
      });

      console.log(success(`(✓) Processed ${file}\n______________________________________________________\n`));
    }
  });

  // Convert combined data to an array of objects
  const combinedArray = Object.values(combinedData);

  // Convert combined JSON data to a worksheet
  const combinedWorksheet = XLSX.utils.json_to_sheet(combinedArray);

  // Add the worksheet to the combined workbook
  XLSX.utils.book_append_sheet(combinedWorkbook, combinedWorksheet, 'Combined Data');

  // Save the combined XLSX file
  const combinedFileName = 'combined_data.xlsx';
  const combinedFilePath = path.join(excelSubFolderPath, combinedFileName);
  XLSX.writeFile(combinedWorkbook, combinedFilePath);

  console.log(success(`(✓) Saved combined data to ${combinedFileName}\n______________________________________________________\n`));
});
