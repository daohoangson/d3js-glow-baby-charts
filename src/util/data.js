import { json } from 'd3-fetch'

export function fetch ({ key = null }) {
  let p = json('merged.json')

  if (key !== null) {
    p = p.then((rows) => {
      const filtered = []

      rows.forEach((row) => {
        if (row.key === key) {
          filtered.push(row)
        }
      })

      return filtered
    })
  }

  return p
}
