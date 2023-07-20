const fs = require('fs');
const ejs = require('ejs');
const pdf = require('html-pdf');

function generatePDF(data, templatePath, outputPath) {
    return new Promise((resolve, reject) => {
  // Generate the PDF content using EJS template
  const template = fs.readFileSync(templatePath, 'utf-8');
  const compiledTemplate = ejs.compile(template);
  const html = compiledTemplate({ data });
  // Convert HTML to PDF and write it to a file
  pdf.create(html).toFile(outputPath, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`PDF generated successfully at ${outputPath}`);
    resolve();
  });
 
});
}
module.exports = generatePDF;
