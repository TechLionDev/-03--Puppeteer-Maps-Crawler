const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const error = clc.red.bold;
const info = clc.cyan.bold;
const success = clc.green.bold;

// Specify the folder paths
const jsonFolderPath = './';
const excelFolderPath = './Excel';

// Get the current date for the subfolder
const dateFolderName = './';
const excelSubFolderPath = path.join(excelFolderPath, dateFolderName);

// Create the Excel subfolder if it doesn't exist
fs.mkdirSync(excelSubFolderPath, { recursive: true });

// Read JSON files in the subfolder corresponding to the current date
fs.readdir(jsonFolderPath, (err, files) => {
  if (err) {
    console.log(error('(⬣) Error reading folder:', err));
    return;
  }

  const workbook = XLSX.utils.book_new();
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
  const worksheet = XLSX.utils.json_to_sheet(combinedArray);

  // Add the worksheet to the existing workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Combined Data');

  // Save the XLSX file with all the data in a single sheet
  const xlsxFileName = 'combined_data.xlsx';
  const xlsxFilePath = path.join(excelSubFolderPath, xlsxFileName);
  XLSX.writeFile(workbook, xlsxFilePath);

  console.log(success(`(✓) Saved combined data to ${xlsxFileName}\n______________________________________________________\n`));
});
