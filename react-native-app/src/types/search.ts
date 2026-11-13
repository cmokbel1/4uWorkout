// Keyword search: GET /exercises/search?q= and /exercises/search/suggestions.

// The server rejects queries outside these lengths (after trimming), and any
// character other than letters, digits and spaces.
export const SEARCH_MIN_LENGTH = 3;
export const SEARCH_MAX_LENGTH = 40;

// Most search results the server returns at once (closest names first, random
// within each rank). A full sample means Shuffle can bring different ones.
export const SEARCH_SAMPLE_SIZE = 11;

export interface SearchSuggestion {
  // Already in a form the search accepts ("pull-up" comes as "pull up").
  value: string;
  count: number;
}

// The most common values of each kind, most common first. A value can be in
// more than one group ("chest" is a body part and a target).
export interface SearchSuggestions {
  equipment: SearchSuggestion[];
  bodyParts: SearchSuggestion[];
  targets: SearchSuggestion[];
}
