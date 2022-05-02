const baseUrl = 'https://jsonbin.org/ibastawisi/matheditor'
const authorization = "token d93aaba1-4b96-4208-848f-22d177464e3e"

export const post = (id: string, body: string) => fetch(`${baseUrl}/${id}`, { method: 'post', headers: { authorization }, body })

// export const patch = (id: string, body: string) => fetch(`${baseUrl}/${id}`, { method: 'patch', headers: { authorization }, body })

export const get = (id: string) => fetch(`${baseUrl}/${id}`, { method: 'get', headers: { authorization } }).then(res => res.json())

export const del = (id: string) =>  fetch(`${baseUrl}/${id}`, { method: 'delete', headers: { authorization } })
