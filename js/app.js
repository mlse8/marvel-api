const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)

const urlBase = 'https://gateway.marvel.com/v1/public/'
let ts = 'ts=1'
const publicKey = '&apikey=dbd3f5275340a963c52ebcb09990e187'
const hash = '&hash=4ff1b9f179fe4dfe2d2b36e2a5fe487c'

let offset = 0
let storedOffset = 0
let totalResults = 0
let totalPages = 0

const container = $('#results') 
const type = $('#type')
const sort = $('#sort')

const cleanContainer = (selector) => selector.innerHTML = ''

const resetOffset = () => offset = 0

const hideElement = (selector) => $(selector).classList.add("hidden")

const showElement = (selector) => $(selector).classList.remove("hidden")

const renderTitle = (total, resource) => resource || (total >= 0 && resource) 
    ? $('#results-title').innerText = `${resource}`
    : (container.innerHTML = `<h2 class="mb-5 col-span-3 text-2xl font-bold">No se encontraron resultados</h2>`, $('#results-title').innerText = 'Resultados')

const updateTotalResults = (total) => $('#total-results').innerText = totalResults = total

const updateTotalPages = (total) => {
    totalPages = Math.ceil(total / 20)
    const currentPage = Math.floor(offset / 20) + 1
    $('#page').innerText = currentPage
    $('#total-pages').innerText = totalPages
}

const fetchData = async (url) => {
    try {
        const response = await fetch(url)
        const data = await response.json()
        return data.data
    } catch (error) {
        console.error('Ocurrió un error:', error.message)
    }
}

// Parámetros de búsqueda
const getSearchParams = (isSearch) => {
    const searchTerm = $('#search-term').value.trim()
    let searchParams = `?${ts}${publicKey}${hash}&offset=${offset}`

    if (!isSearch) {
        return searchParams
    }

    searchParams += `&orderBy=${sort.value}`

    if (!searchTerm.length) {
        return searchParams
    }

    if (type.value === 'comics') {
        searchParams += `&titleStartsWith=${searchTerm}`
    }

    if (type.value === 'characters') {
        searchParams += `&nameStartsWith=${searchTerm}`
    }

    return searchParams
}

// Construcción de url
const getURL = (resource, resourceId, subResource) => {
    const isSearch = !resourceId && !subResource
    let url = `${urlBase}${resource}`

    if (resourceId) {
        url += `/${resourceId}`
    }

    if (subResource) {
        url += `/${subResource}`
    }

    url += getSearchParams(isSearch)
    
    return url
}

// Obtener id del comic o personaje
const getIdResource = (selectors, callback, updateDataCallback) => {
    selectors.forEach(button => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id")
            resetOffset()
            callback(id)
            updateDataCallback(id)
            updatePagination(() => updateDataCallback(id))
        })
    })
}

// Habilitar y deshabilitar botones de paginación
const handlePagination = () => {
    if (offset === 0) {
        $('#first-page').disabled = true
        $('#prev-page').disabled = true
    } else {
        $('#first-page').disabled = false
        $('#prev-page').disabled = false
    }
    
    if (offset + 20 >= totalResults || totalPages === 1) {
        $('#last-page').disabled = true
        $('#next-page').disabled = true
    } else {
        $('#last-page').disabled = false
        $('#next-page').disabled = false
    }
}

// Resetear y actualizar offset para volver atrás
const resetAndUpdateOffset = async (offsetValue, callback) => {
    offset = offsetValue
    if (callback === updateResults) {
        storedOffset = offset
    }
    await callback()
}

// Actualizar paginación
const updatePagination = async (callback) => {
    $('#first-page').onclick = async () => {
        await resetAndUpdateOffset(0, callback)
    }
    $('#prev-page').onclick = async () => {
        await resetAndUpdateOffset(offset - 20, callback)
    }
    $('#next-page').onclick = async () => {
        await resetAndUpdateOffset(offset + 20, callback)
    }
    $('#last-page').onclick = async () => {
        await resetAndUpdateOffset((totalPages - 1) * 20, callback)
    }
}

const renderComicCard = (comic) => {
    return `
        <div tabindex="0" class="show-comic-details cursor-pointer [&_figure]:hover:translate-y-[-3%] [&_h3]:hover:text-red-600 [&_figure]:focus:translate-y-[-3%] [&_h3]:focus:text-red-600 focus:outline-none" data-id="${comic.id}">
            <figure class="shadow-lg shadow-gray-400 transition duration-300">
                <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="marvel-comic" class="h-full mb-4">
            </figure>
            <h3 class="text-sm font-bold transition duration-300">${comic.title}</h3>
        </div>
    `
}

const renderCharacterCard = (character) => {
    return `<div tabindex="0" class="show-character-details cursor-pointer [&_img]:hover:scale-110 [&_div]:hover:bg-red-600 [&_img]:focus:scale-110 [&_div]:focus:bg-red-600 focus:outline-none" data-id="${character.id}"> 
        <figure class="border-b-4 border-red-600 overflow-hidden">
            <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="marvel-character" class="transition duration-300">
        </figure>
        <div class="bg-gray-950 transition duration-300">
            <h3 class="h-24 py-4 px-6 text-sm font-bold text-white">${character.name}</h3>
        </div>
    </div>`
}

const renderResource = (data, renderCard, detailsSelector, updateDataCallback) => {
    let acc = ''
    data.forEach(item => {
        acc += renderCard(item)
    })

    if (acc) {
        container.innerHTML = acc

        if (detailsSelector === '.show-comic-details') {
            container.classList.remove("grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6")
            container.classList.add("grid-cols-3", "md:grid-cols-5")
        } else {
            container.classList.remove("grid-cols-3", "md:grid-cols-5")
            container.classList.add("grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6")
        }

    } else {
        renderTitle()
    }

    getIdResource($$(detailsSelector), (id) => detailsSelector === '.show-comic-details' ? showComicDetails(id) : showCharacterDetails(id), (id) => updateDataCallback && updateDataCallback(id))
}

const renderComics = (data) => {
    renderResource(data, renderComicCard, '.show-comic-details', (id) => updateResourceData('comics', id, 'characters'))
}

const renderCharacters = (data) => {
    renderResource(data, renderCharacterCard, '.show-character-details', (id) => updateResourceData('characters', id, 'comics'))
}

const renderOptions = () => {
    cleanContainer(sort)
    type.value === "characters" 
        ? sort.innerHTML += 
            `<option value="name">A/Z</option>
            <option value="-name">Z/A</option>`
        : sort.innerHTML += 
            `<option value="title">A/Z</option>
            <option value="-title">Z/A</option>
            <option value="-focDate">Más nuevos</option>
            <option value="focDate">Más viejos</option>`
}

// Dar formato a la fecha de publicación
const formatReleaseDate = (comic) => {
    const onSaleDate = comic.dates.find((date) => date.type === 'onsaleDate')
    const releaseDate = onSaleDate && onSaleDate.date
        ? new Intl.DateTimeFormat('es-AR').format(new Date(onSaleDate.date))
        : 'Fecha no disponible'

    return releaseDate
}

// Obtener los guionistas
const getWriters = (creators) => {
    const writers = creators.items
        .filter(creator => creator.role === 'writer')
        .map(writer => writer.name)
        .join(', ')

    return writers || 'No hay información sobre los guionistas'
}

const showComicDetails = async (comicId) => {
    showElement('#resource-details')
    const { results: [comic] } = await fetchData(getURL('comics', comicId))

    $('#resource-details').innerHTML =
        `<figure class="max-w-96 flex-none">
            <img class="w-full h-full" src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="comic">
        </figure>
        <div>
            <h2 class="mb-5 text-2xl font-bold">${comic.title}</h2>
            <h3 class="mb-5 text-lg font-bold">Publicado:</h3>
            <p class="mb-5">${formatReleaseDate(comic)}</p>
            <h3 class="mb-5 text-lg font-bold">Guionistas:</h3>
            <p class="mb-5">${getWriters(comic.creators)}</p>
            <h3 class="mb-5 text-lg font-bold">Descripción:</h3>
            <p class="mb-5">${comic.description || 'No hay información disponible'}</p>
        </div>`

    showElement('#back-to-search')
}

const showCharacterDetails = async (characterId) => {
    showElement('#resource-details')
    const { results: [character] } = await fetchData(getURL('characters', characterId))

    $('#resource-details').innerHTML =
        `<figure class="w-full max-w-96">
            <img class="w-full" src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="character">
        </figure>
        <div>
            <h2 class="mb-5 text-2xl font-bold">${character.name}</h2>
            <p class="mb-5">${character.description || 'No hay información disponible'}</p>
        </div>`
    
    showElement('#back-to-search')
}

// Actualizar resultados (todos los comics o personajes)
const updateResults = async () => {
    showElement('#loader')
    const resource = type.value
    const { results, total } = await fetchData(getURL(resource))

    updateTotalResults(total)
    updateTotalPages(total)
    renderTitle(total)

    resource === 'characters' ? renderCharacters(results) : renderComics(results)

    handlePagination()
    hideElement('#loader')
}

// Actualizar cada comic o personaje
const updateResourceData = async (resource, id, subResource) => {
    showElement('#loader')
    const { results, total } = await fetchData(getURL(resource, id, subResource))

    updateTotalResults(total)
    updateTotalPages(total)
    subResource === 'characters' 
        ? (renderCharacters (results), renderTitle(total, 'Personajes')) 
        : (renderComics(results), renderTitle(total, 'Comics'))
    handlePagination()
    hideElement('#loader')
}

const handleResults = () => {
    updatePagination(updateResults)
    updateResults()
    hideElement('#resource-details')
    hideElement('#back-to-search')
}

const initializeApp = () => {
    $('#search').addEventListener('click', () =>{
        resetOffset()
        storedOffset = offset
        handleResults()
    })
    
    $('#back-to-search').addEventListener('click', () => {
        offset = storedOffset
        handleResults()
    })

    type.addEventListener('change', renderOptions)
    
    renderOptions()
    updatePagination(updateResults)
    updateResults()

    initializeTheme()
}

window.addEventListener('load', initializeApp)