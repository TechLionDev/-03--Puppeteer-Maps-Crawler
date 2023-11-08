const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const error = clc.red.bold;
const info = clc.cyan.bold;
const success = clc.green.bold;

const jsonFolderPath = './json/';
const excelFolderPath = './Excel';

const currentDate = new Date();
const dateFolderName = currentDate.toISOString().split('T')[0];
const excelSubFolderPath = path.join(excelFolderPath, dateFolderName);
fs.mkdirSync(excelSubFolderPath, { recursive: true });

const combinedData = {};

function processJSONFile(file) {
  if (file.includes('package') || !file.endsWith('.json')) {
    return;
  }

  console.log(info(`(i) Reading ${file}...`));

  const jsonFilePath = path.join(jsonFolderPath, file);
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const jsonData = JSON.parse(jsonContent);

  const zipCode = file;
  const zipCodeFolderPath = path.join(excelSubFolderPath, zipCode);
  fs.mkdirSync(zipCodeFolderPath, { recursive: true });

  jsonData.forEach((entry) => {
    const jsonWorkbook = XLSX.utils.book_new();
    const jsonWorksheet = XLSX.utils.json_to_sheet([entry]);
    XLSX.utils.book_append_sheet(jsonWorkbook, jsonWorksheet, 'Sheet1');

    const jsonFileName = `${path.parse(file).name}.xlsx`;
    const excelFilePath = path.join(zipCodeFolderPath, jsonFileName);
    XLSX.writeFile(jsonWorkbook, excelFilePath);

    if (!combinedData[zipCode]) {
      combinedData[zipCode] = [];
    }
    combinedData[zipCode].push(entry);
  });

  console.log(success(`(✓) Processed ${file}`));
}

fs.readdir(jsonFolderPath, (err, files) => {
  if (err) {
    console.log(error('(⬣) Error reading folder:', err));
    return;
  }

  files.forEach(processJSONFile);
  
  const masterCombinedData = Object.values(combinedData).flat();

  for (const zipCode in combinedData) {
    const combinedWorkbook = XLSX.utils.book_new();
    const combinedWorksheet = XLSX.utils.json_to_sheet(combinedData[zipCode]);
    XLSX.utils.book_append_sheet(combinedWorkbook, combinedWorksheet, 'Combined Data');

    const combinedFileName = `combined_data_${zipCode}.xlsx`;
    const combinedFilePath = path.join(excelSubFolderPath, zipCode, combinedFileName);
    XLSX.writeFile(combinedWorkbook, combinedFilePath);

    console.log(success(`(✓) Saved combined data for ${zipCode} to ${combinedFileName}`));
  }

  const masterCombinedWorkbook = XLSX.utils.book_new();
  const masterCombinedWorksheet = XLSX.utils.json_to_sheet(masterCombinedData);
  XLSX.utils.book_append_sheet(masterCombinedWorkbook, masterCombinedWorksheet, 'Master Combined Data');

  const masterCombinedFileName = `master_combined_data.xlsx`;
  const masterCombinedFilePath = path.join(excelSubFolderPath, masterCombinedFileName);
  XLSX.writeFile(masterCombinedWorkbook, masterCombinedFilePath);

  console.log(success(`(✓) Saved master combined data to ${masterCombinedFileName}`));
});