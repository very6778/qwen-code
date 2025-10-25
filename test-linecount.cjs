const fs = require('fs');
const path = require('path');
const fileUtils = require('./packages/core/dist/utils/fileUtils.cjs');
const filePath = path.join(__dirname, 'testfile.txt');
fs.writeFileSync(filePath, 'line1\nline2');
(async () => {
  const result = await fileUtils.processSingleFileContent(
    filePath,
    __dirname,
    {
      async readTextFile(p) {
        return fs.promises.readFile(p, 'utf8');
      },
    },
  );
  console.log(result.returnDisplay);
  console.log(result.originalLineCount, result.linesShown);
  fs.unlinkSync(filePath);
})();
