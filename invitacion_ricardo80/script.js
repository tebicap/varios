window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const nbr = urlParams.get('nbr');
    if (nbr) {
        document.getElementById('name').textContent = `Hola, ${nbr}`;
    }

    const option = localStorage.getItem('invitacion_ric_80_chosenOption');
    if (option) {
        document.getElementById('option').textContent = getOptionText(option);
        document.getElementById('chosen').style.display = 'block';
        changeImage(option);
    } else {
        document.getElementById('chosen').style.display = 'none';
    }
};

function getOptionText(opt) {
    if (opt === '1') return 'Confirmado';
    if (opt === '2') return 'Más Adelante';
    if (opt === '3') return 'Rechazado';
    return '';
}

function changeImage(opt) {
    const img = document.getElementById('overlay');
    img.style.opacity = 0;
    setTimeout(() => {
        img.src = `imagen_default.webp`; //`imagen_boton${opt}.png`
        img.style.opacity = 1;
    }, 500);
}

function handleButton(opt) {
    let option_text = getOptionText(opt);
    localStorage.setItem('invitacion_ric_80_chosenOption', opt);
    document.getElementById('option').textContent = getOptionText(opt);
    // document.getElementById('chosen').innerText = `Elegiste: ${option_text}`;
    document.getElementById('chosen').style.display = 'block';
    changeImage(opt);
    const thanks = document.getElementById('thanks');
    thanks.style.display = 'block';
    thanks.classList.add('visible');
    sendToTelegram(opt);
}

function sendToTelegram(opt) {
    let option_text = getOptionText(opt);
    const urlParams = new URLSearchParams(window.location.search);
    const nbr = urlParams.get('nbr') || 'Desconocido';
    const message = `Usuario ${nbr} ha elegido: ${option_text}`;
    const botToken = '8405616800:AAFoVD3Xrgt7NKN1hTlVzQXOkug60bAGsQo'; // Reemplaza con tu token de bot de Telegram
    const chatId = '-1003096284511'; // Reemplaza con tu chat ID de Telegram 3096284511
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`)
        .then(response => response.json())
        .then(data => console.log('Mensaje enviado a Telegram:', data))
        .catch(error => console.error('Error al enviar a Telegram:', error));
}
