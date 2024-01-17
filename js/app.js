const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)

const urlBase = 'http://gateway.marvel.com/v1/public/'
let ts = 'ts=1'
const publicKey = '&apikey=dbd3f5275340a963c52ebcb09990e187'
const hash = '&hash=4ff1b9f179fe4dfe2d2b36e2a5fe487c'

let offset = 0
let totalResults = 0
let totalPages = 0
let isEventAtached = false

const container = $('#results') 
const type = $('#type')
const sort = $('#sort')

const cleanContainer = (selector) => selector.innerHTML = ''

const resetOffset = () => offset = 0

const hideDetails = () => $('#resource-details').classList.add('hidden')

const showDetails = () => $('#resource-details').classList.remove('hidden')

const hideLoader = () => $('#loader').classList.add('hidden')

const showLoader = () => $('#loader').classList.remove('hidden')

const renderTitle = (arr) => arr.length ? $('#results-title').innerText = 'Resultados' : $('#results-title').innerText = 'No se encontraron resultados' 

const updateTotalResults = (total) => $('#total-results').innerText = totalResults = total

const updateTotalPages = (total) => {
    totalPages = Math.ceil(total / 20)
    const currentPage = Math.floor(offset / 20) + 1
    $('#page').innerText = currentPage
    $('#total-pages').innerText = totalPages
}

const fetchData = async (url) => {
    const response = await fetch(url)
    const data = await response.json()
    return data.data
}

const getData = async () => {
    const searchTerm = $('#search-term').value.trim()
    const resource = type.value
    let url = `${urlBase}${resource}?${ts}${publicKey}${hash}&offset=${offset}&orderBy=${sort.value}`

    if (searchTerm) {
        resource === 'comics' ? url += `&titleStartsWith=${searchTerm}` : url += `&nameStartsWith=${searchTerm}`
    }

    console.log('URL', url)
    return fetchData(url)
}

const getResourceData = async (resource, id, subResource = '') => {
    let resourceUrl = `${urlBase}${resource}/${id}`
    
    if (subResource) {
        resourceUrl += `/${subResource}`
    }

    resourceUrl += `?${ts}${publicKey}${hash}&offset=${offset}`
    console.log('resourceURL', resourceUrl)

    return fetchData(resourceUrl)
}

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

const updatePagination = async (callback) => {
    console.log('offset antes de los eventos',offset)
    if (!isEventAtached) {
        $('#first-page').addEventListener('click', async () => {
            resetOffset()
            await callback()
        })
        $('#prev-page').addEventListener('click', async () => {
            offset -= 20
            console.log('offset prev', offset)
            await callback()
        })
        $('#next-page').addEventListener('click', async () => {
            offset += 20
            console.log('offset next', offset)
            await callback()
        })
        $('#last-page').addEventListener('click', async () => {
            offset = (totalPages - 1) * 20
            console.log('offset last', offset)
            await callback()
        })
        type.addEventListener('change', () => {
            resetOffset()
        })
        
        isEventAtached = true
    }
    isEventAtached = false
}

const renderComicCard = (comic) => {
    return `
        <div class="show-comic-details comic cursor-pointer" data-id="${comic.id}">
            <figure class="shadow-lg shadow-gray-400 transition duration-300">
                <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="marvel-comic" class="h-full mb-4">
            </figure>
            <h3 class="text-sm font-bold transition duration-300">${comic.title}</h3>
        </div>
    `
}

const renderCharacterCard = (character) => {
    return `<div class="show-character-details character cursor-pointer" data-id="${character.id}"> 
        <figure class="border-b-4 border-red-600 overflow-hidden">
            <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="marvel-character" class="character-thumbnail transition duration-300">
        </figure>
        <div class="character-name bg-gray-950 transition duration-300">
            <h3 class="h-24 py-4 px-6 text-sm font-bold text-white">${character.name}</h3>
        </div>
    </div>`
}

const renderComics = (data) => {
    let acc = ''
    data.forEach(comic => {
        acc += renderComicCard(comic)
    })

    container.innerHTML = acc
    container.classList.remove("grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6")
    container.classList.add("grid-cols-3", "md:grid-cols-5")

    getIdResource($$('.show-comic-details'), (id) => showComicDetails(id), (id) => updateResourceData('comics', id, 'characters'))
}

const renderCharacters = (data) => {
    let acc = ''
    data.forEach(character => {
        acc += renderCharacterCard(character)
    })

    container.innerHTML = acc
    container.classList.remove("grid-cols-3", "md:grid-cols-5")
    container.classList.add("grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6")

    getIdResource($$('.show-character-details'), (id) => showCharacterDetails(id), (id) => updateResourceData('characters', id, 'comics'))
}

const renderOptions = () => {
    cleanContainer(sort)
    type.value === "characters" ? 
        sort.innerHTML += 
            `<option value="name">A/Z</option>
            <option value="-name">Z/A</option>`
        :
        sort.innerHTML += 
            `<option value="title">A/Z</option>
            <option value="-title">Z/A</option>
            <option value="-focDate">Más nuevos</option>
            <option value="focDate">Más viejos</option>`
}

const showComicDetails = async (comicId) => {
    showDetails()
    const { results: [comic] } = await getResourceData('comics', comicId)
    const writers = comic.creators.items
        .filter(creator => creator.role === 'writer')
        .map(writer => writer.name)
        .join(', ')

    $('#resource-details').innerHTML =
        `<figure class="max-w-96 flex-none">
            <img class="w-full h-full" src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="comic">
        </figure>
        <div>
            <h2 class="mb-5 text-2xl font-bold">${comic.title}</h2>
            <h3 class="mb-5 text-lg font-bold">Publicado:</h3>
            <p class="mb-5"></p>
            <h3 class="mb-5 text-lg font-bold">Guionistas:</h3>
            <p class="mb-5">${writers}</p>
            <h3 class="mb-5 text-lg font-bold">Descripción:</h3>
            <p class="mb-5">${comic.description}</p>
        </div>`
}

const showCharacterDetails = async (characterId) => {
    showDetails()
    const { results: [character] } = await getResourceData('characters', characterId)

    $('#resource-details').innerHTML =
        `<figure class="w-full max-w-96">
            <img class="w-full" src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="character">
        </figure>
        <div>
            <h2 class="mb-5 text-2xl font-bold">${character.name}</h2>
            <p class="mb-5">${character.description}</p>
        </div>`
}

const updateResults = async () => {
    showLoader()
    const { results, total } = await getData()

    updateTotalResults(total)
    updateTotalPages(total)
    renderTitle(results)

    if (type.value === 'characters') {
        renderCharacters(results)
    } else {
        renderComics(results)
    }

    handlePagination()
    hideLoader()
}

const updateResourceData = async (resource, id, subresource) => {
    showLoader()
    const { results, total } = await getResourceData(resource, id, subresource)

    renderTitle(results)
    updateTotalResults(total)
    updateTotalPages(total)
    subresource === 'characters' ? renderCharacters (results) : renderComics(results)
    handlePagination()
    hideLoader()
}

const initializeApp = () => {
    $('#search').addEventListener('click', () =>{
        resetOffset()
        updateResults()
        hideDetails()
    })

    type.addEventListener('change', renderOptions)
    
    renderOptions()
    updatePagination(updateResults)
    updateResults()
}

window.addEventListener('load', initializeApp)