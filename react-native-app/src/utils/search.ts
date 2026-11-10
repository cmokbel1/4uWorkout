import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, type SearchSuggestions } from "../types/search"

// Keeps only what the server accepts (letters, digits and spaces), so typing
// or pasting anything else simply doesn't appear in the field.
export function cleanSearchInput(text: string): string {
  return text.replace(/[^A-Za-z0-9 ]/g, "").slice(0, SEARCH_MAX_LENGTH)
}

// The query as the server reads it: trimmed, with single spaces.
export function normalizeQuery(text: string): string {
  return text.trim().replace(/ +/g, " ")
}

export function isSearchable(text: string): boolean {
  return normalizeQuery(text).length >= SEARCH_MIN_LENGTH
}

function queryWords(text: string): string[] {
  const normalized = normalizeQuery(text).toLowerCase()
  return normalized ? normalized.split(" ") : []
}

// Every suggestion once, most common first, whatever its group.
export function suggestionValues(suggestions: SearchSuggestions): string[] {
  const all = [...suggestions.equipment, ...suggestions.bodyParts, ...suggestions.targets]
  all.sort((a, b) => b.count - a.count)
  return [...new Set(all.map((suggestion) => suggestion.value))]
}

// A suggestion is "in" the query when all of its words are.
export function hasSuggestion(query: string, value: string): boolean {
  const words = queryWords(query)
  return queryWords(value).every((word) => words.includes(word))
}

// Adds a suggestion's words to the end of the query, or takes them out when
// they're all in it already. Null when adding would go over the length limit.
export function toggleSuggestion(query: string, value: string): string | null {
  if (hasSuggestion(query, value)) {
    const valueWords = queryWords(value)
    return queryWords(query)
      .filter((word) => !valueWords.includes(word))
      .join(" ")
  }
  const next = normalizeQuery(`${query} ${value}`)
  return next.length <= SEARCH_MAX_LENGTH ? next : null
}
