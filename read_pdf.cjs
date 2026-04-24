const fs = require('fs');
async function run() {
  const mod = await import('pdf-parse');
  const pdf = mod.default || mod;
  let dataBuffer = fs.readFileSync('../sesion 20-04.pdf');
  pdf(dataBuffer).then(function(data) {
      console.log(data.text);
  }).catch(console.error);
}
run();
