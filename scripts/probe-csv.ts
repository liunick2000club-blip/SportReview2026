import fs from "fs";
import path from "path";
import csv from "csv-parser";
import iconv from "iconv-lite";

const csvFilePath = path.resolve("C:/Users/LiuNick/Desktop/SportReview/SportReview2026.csv");

async function probeCsv() {
  const results: any[] = [];
  fs.createReadStream(csvFilePath)
    .pipe(iconv.decodeStream("gbk")) // 针对 GBK 编码进行解码
    .pipe(csv({ headers: false })) // 先不设表头，看原始数组
    .on("data", (data) => results.push(data))
    .on("end", () => {
      console.log("CSV 结构确认 (前 20 条记录):");
      results.slice(0, 50).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
      });
    });
}

probeCsv();
