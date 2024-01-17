const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)
const cleanContainer = (selector) => selector.innerHTML = ''

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