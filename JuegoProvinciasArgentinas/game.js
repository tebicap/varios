document.addEventListener("DOMContentLoaded", () => {

  // Clases CSS para los diferentes estados
  const CSS_CLASSES = {
    SELECCIONADA: "provincia-seleccionada",
    CORRECTA: "provincia-correcta",
    COMPLETA: "provincia-completa",
    INCORRECTA: "provincia-incorrecta",
  }

  // Colores predefinidos (en hexadecimal)
  const COLORS = {
    VERDE_OSCURO: "#006400",
    VERDE_CLARO: "#90EE90",
    ROJO: "#FF0000",
    GRIS: "#808080",
    AMARILLO: "#FFFF00",
    ORIGINAL: "#D4D4D4", // Color por defecto si no se puede determinar
  }

  // Almacenar las provincias y sus capitales
  const provincias = []
  let provinciasAleatorias = [] // Array para el orden aleatorio de provincias
  let currentProvinceIndex = 0
  let gameMode = false
  let score = 0
  let currentPhase = "province" // 'province' o 'capital'
  let lastSelectedIndex = -1 // Para recordar la última provincia seleccionada

  //capturo leyenda texto
  // const leyendaOpciones = document.querySelector("#texto_pregunta");

  // Función para aplicar una clase CSS a un elemento
  function aplicarClase(elemento, clase) {
    // Primero, asegurarse de que el elemento tenga un estilo inline con !important
    const estiloActual = elemento.getAttribute("style") || ""

    // Si no contiene fill, añadirlo
    if (!estiloActual.includes("fill:")) {
      elemento.setAttribute("style", estiloActual + ` fill: inherit !important;`)
    }

    // Eliminar todas las clases de estado
    elemento.classList.remove(
      CSS_CLASSES.SELECCIONADA,
      CSS_CLASSES.CORRECTA,
      CSS_CLASSES.COMPLETA,
      CSS_CLASSES.INCORRECTA,
    )

    // Añadir la nueva clase
    if (clase) {
      elemento.classList.add(clase)
      console.log(`Aplicada clase ${clase} al elemento`, elemento)
    }
  }

  // Inicializar el juego
  function initGame() {
    // Ocultar opciones_conjunto
    const opcionesConjunto = document.querySelector("#opciones_conjunto")
    if (opcionesConjunto) {
      opcionesConjunto.style.display = "none"
    }

    // Recopilar información de las provincias
    for (let i = 1; i <= 23; i++) {
      const provinciaElement = document.querySelector(`#PROV-${i}`)
      if (provinciaElement) {
        // Obtener el nombre de la provincia del atributo inkscape:label
        let provinceName = `Provincia ${i}`
        try {
          // Intentar obtener el atributo
            provinceName = provinciaElement.getAttribute("inkscape:label");
        } catch (e) {
          // Si hay error, alerta
            alert("ocurrió un error al recuperar nombre de provincia");
        }

        const titleElement = provinciaElement.querySelector("title")
        const capital = titleElement ? titleElement.textContent : `Capital ${i}`

        // Guardar el color original
        let originalFill = provinciaElement.getAttribute("fill")
        if (!originalFill || originalFill === "") {
          // Si no tiene atributo fill, intentamos obtenerlo del estilo
          const style = provinciaElement.getAttribute("style")
          if (style && style.includes("fill:")) {
            const fillMatch = style.match(/fill:\s*([^;]+)/)
            if (fillMatch && fillMatch[1]) {
              originalFill = fillMatch[1]
            }
          }
        }
        // Si aún no tenemos color, usamos el predeterminado
        if (!originalFill || originalFill === "") {
          originalFill = "#D4D4D4" // Color por defecto
        }

        // Asegurarse de que el elemento tenga un estilo con el color original
        const estiloActual = provinciaElement.getAttribute("style") || ""
        if (!estiloActual.includes("fill:")) {
          provinciaElement.setAttribute("style", estiloActual + ` fill: ${originalFill};`)
        }

        provincias.push({
          id: `PROV-${i}`,
          element: provinciaElement,
          name: provinceName,
          capital: capital,
          originalFill: originalFill,
          correctProvince: false,
          correctCapital: false,
          used: false, // Para controlar si ya se usó en el juego
        })

        // Añadir evento de clic
        provinciaElement.addEventListener("click", () => {
          handleProvinceClick(i - 1)
        })
      }
    }

    // Imprimir nombres de provincias para depuración
    console.log(
      "Nombres de provincias cargados:",
      provincias.map((p) => p.name),
    )
console.log(provincias)

    // Configurar el botón de jugar - buscar por ID en lugar de por atributo inkscape:label
    // Intentar varias opciones para encontrar el botón
    let botonJugar = document.querySelector("#boton-jugar")

    // Si no lo encontramos por ID, intentamos buscar todos los elementos y filtrar
    if (!botonJugar) {
      // Buscar entre todos los elementos que podrían tener el atributo inkscape:label
      const allElements = document.querySelectorAll("*")
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i]
        // Intentar con getAttributeNS primero
        let label = null
        try {
          if (el.getAttributeNS) {
            label = el.getAttributeNS("http://www.inkscape.org/namespaces/inkscape", "label")
          }
        } catch (e) {
          // Ignorar errores
        }

        // Si no funciona, intentar con getAttribute
        if (!label) {
          label = el.getAttribute("inkscape:label")
        }

        // Si encontramos el elemento con label="boton-jugar"
        if (label === "boton-jugar") {
          botonJugar = el
          break
        }
      }
    }

    // Si aún no lo encontramos, intentar con el texto "JUGAR"
    if (!botonJugar) {
      const textElements = document.querySelectorAll("text")
      for (let i = 0; i < textElements.length; i++) {
        if (textElements[i].textContent.trim() === "JUGAR") {
          // Buscar el elemento padre que podría ser el botón
          botonJugar = textElements[i].parentElement
          break
        }
      }
    }

    // Si encontramos el botón, añadir el evento
    if (botonJugar) {
      botonJugar.addEventListener("click", toggleGameMode)
      console.log("Botón de jugar encontrado y configurado")
    } else {
      console.error("No se pudo encontrar el botón de jugar")
      // Intentar buscar por ID específico mencionado en el código original
      const textoBoton = document.querySelector("#text5420")
      if (textoBoton && textoBoton.parentElement) {
        botonJugar = textoBoton.parentElement
        botonJugar.addEventListener("click", toggleGameMode)
        console.log("Botón de jugar encontrado por ID de texto")
      }
    }
  }

  // Función para barajar un array (algoritmo Fisher-Yates)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  // Función para obtener opciones aleatorias (incluyendo la correcta)
  function getRandomOptions(correctIndex, property, maxOptions = 14) {
    // Crear un array con todos los índices excepto el correcto
    const incorrectIndices = provincias.map((_, index) => index).filter((index) => index !== correctIndex)

    // Barajar los índices incorrectos
    shuffleArray(incorrectIndices)

    // Tomar solo los primeros (maxOptions - 1) índices
    const selectedIndices = incorrectIndices.slice(0, maxOptions - 1)

    // Añadir el índice correcto
    selectedIndices.push(correctIndex)

    // Barajar de nuevo para que el correcto no esté siempre al final
    shuffleArray(selectedIndices)

    // Crear el array de opciones
    return selectedIndices.map((index) => {
      return {
        text: provincias[index][property],
        isCorrect: index === correctIndex,
      }
    })
  }

  // Manejar el clic en una provincia
  function handleProvinceClick(index) {
    if (!gameMode) {
      // Modo informativo
      showProvinceInfo(index)
    } else {
      // Modo juego
      checkAnswer(index)
    }
  }

  // Verificar respuesta en modo juego
  function checkAnswer(index) {
    const currentProvince = provinciasAleatorias[currentProvinceIndex]

    if (index === currentProvince) {
      alert("hola");
      if (currentPhase === "province") {
        // Acertó la provincia
        provincias[currentProvince].correctProvince = true;
        aplicarClase(provincias[currentProvince].element, CSS_CLASSES.CORRECTA);
        score += 3;
        updateScore();

        // Mostrar opciones de capitales
        currentPhase = "capital";
        showCapitalOptions();
      } else {
        // Acertó la capital
        provincias[currentProvince].correctCapital = true;
        aplicarClase(provincias[currentProvince].element, CSS_CLASSES.COMPLETA);
        score += 3;
        updateScore();

        // Marcar como usada y pasar a la siguiente provincia
        provincias[currentProvince].used = true;
        moveToNextProvince();
      }
    } else if (currentPhase === "province") {
      // Error al seleccionar provincia
      // Pintar de gris la provincia actual y pasar a la siguiente
      aplicarClase(provincias[currentProvince].element, CSS_CLASSES.INCORRECTA);
      provincias[currentProvince].used = true;
      moveToNextProvince();
    } else {
      // Error al seleccionar capital
      // Mantener el color verde oscuro, marcar como usada y pasar a la siguiente
      provincias[currentProvince].used = true;
      moveToNextProvince();
    }
  }

  // Mostrar información de la provincia en modo informativo
  function showProvinceInfo(index) {
    // Si hay una provincia seleccionada anteriormente, restaurar su estilo
    if (lastSelectedIndex >= 0 && lastSelectedIndex < provincias.length) {
      aplicarClase(provincias[lastSelectedIndex].element, null)
    }

    // Guardar el índice actual como último seleccionado
    lastSelectedIndex = index

    // Colorear la provincia seleccionada de rojo usando la clase CSS
    console.log(`Pintando provincia ${index} de rojo`)
    aplicarClase(provincias[index].element, CSS_CLASSES.SELECCIONADA)

    // Mostrar opciones_conjunto
    const opcionesConjunto = document.querySelector("#opciones_conjunto")
    if (opcionesConjunto) {
      opcionesConjunto.style.display = "block"
    }

    // Actualizar texto de opciones con formato abreviado
    const opcionesElement = document.querySelector("#opciones")
    if (opcionesElement) {
      updateOptionsText([`Prov: ${provincias[index].name}`, `Cap: ${provincias[index].capital}`])
    }
  }

  // Actualizar el texto de opciones
  function updateOptionsText(options) {
    const opcionesElement = document.querySelector("#opciones")
    if (!opcionesElement) return

    // Limpiar opciones existentes
    while (opcionesElement.firstChild) {
      opcionesElement.removeChild(opcionesElement.firstChild)
    }

    // Añadir nuevas opciones
    options.forEach((option, index) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan")
      tspan.setAttribute("x", "363.5")
      tspan.setAttribute("y", 514 + index * 27)
      tspan.setAttribute("id", `opcion-${index + 1}`)

      // Si la opción es un objeto con text e isCorrect, usar solo el texto
      if (typeof option === "object" && option.text) {
        tspan.textContent = option.text
        // Guardar si es correcta como atributo de datos
        tspan.dataset.correct = option.isCorrect
      } else {
        tspan.textContent = option
      }

      // En modo juego, añadir evento de clic a las opciones
      if (gameMode) {
        tspan.addEventListener("click", () => {
          // Si la opción tiene un atributo de datos correct, usar eso
          if (tspan.dataset.correct === "true") {
            // Acertó
            playSound("acierta");
            if (currentPhase === "province") {
              const currentProvince = provinciasAleatorias[currentProvinceIndex]
              provincias[currentProvince].correctProvince = true
              aplicarClase(provincias[currentProvince].element, CSS_CLASSES.CORRECTA)
              score += 3
              updateScore()

              //elige capital, cambio leyenda
              document.querySelector('#texto_pregunta').querySelector('tspan').innerHTML = "CAPITAL?";

              // Mostrar opciones de capitales
              currentPhase = "capital"
              showCapitalOptions()
            } else {
              // Acertó la capital
              playSound("acierta");
              const currentProvince = provinciasAleatorias[currentProvinceIndex]
              provincias[currentProvince].correctCapital = true
              aplicarClase(provincias[currentProvince].element, CSS_CLASSES.COMPLETA)
              score += 3
              updateScore()

              //elige provincia, cambio leyenda
              document.querySelector('#texto_pregunta').querySelector('tspan').innerHTML = "PROVINCIA?";

              // Marcar como usada y pasar a la siguiente provincia
              provincias[currentProvince].used = true
              moveToNextProvince()
            }
          } else {
            // No acertó
            playSound("yerra");
            if (currentPhase === "province") {
              // Error al seleccionar provincia
              const currentProvince = provinciasAleatorias[currentProvinceIndex]
              aplicarClase(provincias[currentProvince].element, CSS_CLASSES.INCORRECTA)
              provincias[currentProvince].used = true

              //elige provincia, cambio leyenda
              document.querySelector('#texto_pregunta').querySelector('tspan').innerHTML = "PROVINCIA?";
              moveToNextProvince()
            } else {
              // Error al seleccionar capital
              playSound("yerra");
              const currentProvince = provinciasAleatorias[currentProvinceIndex]
              provincias[currentProvince].used = true
              moveToNextProvince()
            }
          }
        })
      }

      opcionesElement.appendChild(tspan)
    })
  }

  // Mostrar opciones de provincias
  function showProvinceOptions() {
    // Obtener la provincia actual
    const currentProvince = provinciasAleatorias[currentProvinceIndex]

    // Obtener opciones aleatorias (máximo 14, incluyendo la correcta)
    const options = getRandomOptions(currentProvince, "name", 14)

    // Actualizar texto de opciones
    updateOptionsText(options)

    // Resaltar la provincia actual
    resetProvinceColors()
    aplicarClase(provincias[currentProvince].element, CSS_CLASSES.SELECCIONADA)
  }

  // Mostrar opciones de capitales
  function showCapitalOptions() {
    // Obtener la provincia actual
    const currentProvince = provinciasAleatorias[currentProvinceIndex]

    // Obtener opciones aleatorias (máximo 14, incluyendo la correcta)
    const options = getRandomOptions(currentProvince, "capital", 14)

    // Actualizar texto de opciones
    updateOptionsText(options)
  }

  // Pasar a la siguiente provincia
  function moveToNextProvince() {
    currentProvinceIndex++
    currentPhase = "province"

    if (currentProvinceIndex >= provinciasAleatorias.length) {
      // Fin del juego
      endGame()
    } else {
      // Mostrar siguiente provincia
      showProvinceOptions()
    }
  }

  // Finalizar el juego
  function endGame() {
    gameMode = false

    // Contar aciertos
    const correctProvinces = provincias.filter((p) => p.correctProvince).length
    const correctCapitals = provincias.filter((p) => p.correctCapital).length
    const totalCorrect = correctProvinces + correctCapitals

    // Mostrar mensaje final
    let message
    if (totalCorrect === 46) {
      message = "¡Felicidades! ¡Eres un experto en geografía argentina!"
    } else if (totalCorrect >= 35) {
      message = "¡Muy bien! Conoces bastante sobre Argentina."
    } else if (totalCorrect >= 23) {
      message = "Buen trabajo. Conoces las provincias pero puedes mejorar con las capitales."
    } else {
      message = "Sigue practicando para conocer mejor la geografía argentina."
    }

    updateOptionsText([
      message,
      `Provincias correctas: ${correctProvinces}/23`,
      `Capitales correctas: ${correctCapitals}/23`,
      `Puntaje final: ${score}`,
    ])

    // Resetear botón de juego
    resetGameButton()
  }

  // Alternar modo de juego
  function toggleGameMode() {
    if (!gameMode) {
      // Iniciar modo juego
      gameMode = true
      score = 0
      updateScore()

      // Resetear estado de las provincias
      provincias.forEach((p) => {
        p.correctProvince = false
        p.correctCapital = false
        p.used = false
        aplicarClase(p.element, null) // Quitar todas las clases
      })

      // Crear array de índices aleatorios para las provincias
      provinciasAleatorias = []
      for (let i = 0; i < provincias.length; i++) {
        provinciasAleatorias.push(i)
      }
      // Barajar el array para obtener un orden aleatorio
      shuffleArray(provinciasAleatorias)

      currentProvinceIndex = 0
      currentPhase = "province"

      // Cambiar apariencia del botón
      const jugarFondo = document.querySelector("#jugar_fondo")
      if (jugarFondo) {
        jugarFondo.setAttribute("style", "fill: #FF0000 !important;")
      }

      const textoBoton = document.querySelector("#text5420")
      if (textoBoton) {
        textoBoton.textContent = "PARAR"
      }

      // Mostrar opciones_conjunto
      const opcionesConjunto = document.querySelector("#opciones_conjunto")
      if (opcionesConjunto) {
        opcionesConjunto.style.display = "block"
      }

      // Mostrar primera provincia
      showProvinceOptions()
    } else {
      // Detener juego (recargar página)
      window.location.reload()
    }
  }

  // Actualizar puntuación
  function updateScore() {
    const scoreElement = document.querySelector("#score_numero")
    if (scoreElement) {
      scoreElement.textContent = score.toString()
    }
  }

  //actualizar leyenda para las opciones
  // function updateLeyenda(leyenda){
  //   alert("hola");
  // }


  // Resetear colores de las provincias
  function resetProvinceColors() {
    provincias.forEach((p) => {
      if (gameMode) {
        // En modo juego, mantener los colores según el estado
        if (p.correctCapital) {
          aplicarClase(p.element, CSS_CLASSES.COMPLETA)
        } else if (p.correctProvince) {
          aplicarClase(p.element, CSS_CLASSES.CORRECTA)
        } else if (p.used) {
          aplicarClase(p.element, CSS_CLASSES.INCORRECTA)
        } else {
          aplicarClase(p.element, null) // Quitar todas las clases
        }
      } else {
        // En modo informativo, restaurar color original
        aplicarClase(p.element, null) // Quitar todas las clases
      }
    })
  }

  // Resetear botón de juego
  function resetGameButton() {
    const jugarFondo = document.querySelector("#jugar_fondo")
    if (jugarFondo) {
      jugarFondo.setAttribute("style", "") // Quitar estilo inline
    }

    const textoBoton = document.querySelector("#text5420")
    if (textoBoton) {
      textoBoton.textContent = "JUGAR"
    }
  }

  function playSound(cual) {
        const soundAcierta = document.getElementById('soundAcierta');
        const soundYerra = document.getElementById('soundYerra');
        soundAcierta.currentTime = 0; // rewind to start
        soundYerra.currentTime = 0; // rewind to start
        if (cual == "acierta"){soundAcierta.play();} else {soundYerra.play()}
        
  }

  // Iniciar el juego
  initGame()
})
