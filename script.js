const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');

menuToggle.addEventListener('click', () => {
    sideMenu.style.left = sideMenu.style.left === '0px' ? '-220px' : '0px';
});

// Klik di luar menu untuk menutup
document.addEventListener('click', (e) => {
    if(!sideMenu.contains(e.target) && e.target !== menuToggle){
        sideMenu.style.left = '-220px';
    }
});

let code = "";

document.getElementById('fileInput').addEventListener('change', function(e){
    const reader = new FileReader();
    reader.onload = function(evt){
        code = evt.target.result;
    }
    reader.readAsText(e.target.files[0]);
});

function encode(str){
    let result = "";
    for(let i=0;i<str.length;i++){
        result += "\\" + str.charCodeAt(i);
    }
    return result;
}

// Obfuscate
document.getElementById('obfuscate').addEventListener('click', () => {
    if(!code){
        alert("Pilih file dulu!");
        return;
    }
    const encoded = encode(code);
    const result = `--[[\n\nTatang Obfuscator\nProtected Script\n\n]]\nload("${encoded}")()`;
    document.getElementById('output').value = result;
});

// Reset
document.getElementById('reset').addEventListener('click', () => {
    code = "";
    document.getElementById('output').value = "";
    document.getElementById('fileInput').value = "";
});

// Copy
document.getElementById('copy').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('output').value);
    alert("Disalin ke clipboard!");
});

// Download
document.getElementById('download').addEventListener('click', () => {
    const blob = new Blob([document.getElementById('output').value], {type: 'text/plain'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "tatang_obf.lua";
    link.click();
});
