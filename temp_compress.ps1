
$rootDir = "c:/Users/jhojan/Desktop/MISTER 11/mister11-web";
$zipPath = "c:/Users/jhojan/Desktop/MISTER 11/mister11-web/mister11_registro_digital/mister11_v1.1.15_source_code.zip";
$items = Get-ChildItem -Path $rootDir | Where-Object { 
  $_.Name -ne 'node_modules' -and 
  $_.Name -ne 'dist' -and 
  $_.Name -ne '.git' -and 
  $_.Name -ne '.vite' -and 
  $_.Name -ne 'build' -and
  $_.Name -ne 'mister11_registro_digital' -and
  $_.Name -ne '.tempmediaStorage'
};
Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force;
