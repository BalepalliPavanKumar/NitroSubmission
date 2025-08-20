const csvParser = require("csv-parser");
const fs = require("fs");
const xlsx = require("xlsx");
const pdfParse = require("pdf-parse");

async function parseFile(filePath, fileType) {
  return new Promise((resolve, reject) => {
    if (fileType === "csv") {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);

    } else if (fileType === "xlsx") {
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        resolve(data);
      } catch (err) {
        reject(err);
      }

    } else if (fileType === "pdf") {
      fs.readFile(filePath, (err, buffer) => {
        if (err) return reject(err);
        pdfParse(buffer)
          .then((data) => resolve({ text: data.text }))
          .catch(reject);
      });

    } else {
      reject(new Error("Unsupported file type"));
    }
  });
}

module.exports = { parseFile };
