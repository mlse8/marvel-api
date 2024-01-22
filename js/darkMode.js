// Enviar modo al localStorage
const saveDarkMode = (darkModeOn) => localStorage.setItem('darkMode', JSON.stringify(darkModeOn))

// Obtener modo del localStorage
const getDarkMode = () => {
    const storedDarkMode = localStorage.getItem('darkMode')
    return storedDarkMode ? JSON.parse(storedDarkMode) : false
}

// Cambio de clases para lograr el modo oscuro
const toggleDarkMode = (darkModeOn) => {
    const toggleClass = (element, classNames, condition) => {
        classNames.split(' ').forEach(className => element.classList.toggle(className, condition))
    }

    const elementsToToggle = [
        ['#light-on', 'hidden', darkModeOn],
        ['#light-off', 'hidden', !darkModeOn],
        ['body', 'bg-gray-900 text-white', darkModeOn],
        ['#search-term', 'bg-gray-900 border-white', darkModeOn],
        ['#loader', 'bg-[#11182790]', darkModeOn],
        ['.select', 'bg-gray-900', darkModeOn],
        ['.btn', 'bg-white text-neutral-900 hover:text-white disabled:hover:text-neutral-900', darkModeOn]
    ]

    elementsToToggle.forEach(([selector, classNames, condition]) => {
        const elements = selector.startsWith('.') ? $$(selector) : [$(selector)]
        elements.forEach(element => toggleClass(element, classNames, condition))
    })

    saveDarkMode(darkModeOn)
}

// Obtener estado actual del modo oscuro del localStorage, para cambiar al modo opuesto y guardar el nuevo estado
const toggleTheme = () => {
    const isDarkMode = getDarkMode()
    toggleDarkMode(!isDarkMode)
}

const initializeTheme = () => {
    const storedDarkMode = getDarkMode()
    toggleDarkMode(storedDarkMode)

    $('#btn-theme').addEventListener('click', toggleTheme)
}