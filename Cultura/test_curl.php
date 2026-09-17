<?php
// Script temporal de diagnostico: prueba directo con cURL (sin Laravel) si
// el certificado SSL para hablar con Google esta funcionando.
ini_set('display_errors', 1);

$ch = curl_init('https://oauth2.googleapis.com/tokeninfo');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$r = curl_exec($ch);

if ($r === false) {
    echo "ERROR: " . curl_error($ch) . "\n";
} else {
    echo "OK, la conexion SSL funciono bien (Google respondio)\n";
}

echo "curl.cainfo (ini): " . ini_get('curl.cainfo') . "\n";
echo "el archivo existe: " . (file_exists(ini_get('curl.cainfo')) ? 'si' : 'no') . "\n";
echo "openssl.cafile (ini): " . ini_get('openssl.cafile') . "\n";

$v = curl_version();
echo "curl ssl_version: " . $v['ssl_version'] . "\n";
echo "curl version: " . $v['version'] . "\n";

