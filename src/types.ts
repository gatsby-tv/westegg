// Abstract entity types
export interface IHandled {
  handle: string;
}

export interface INamed {
  displayName: string;
}

/**
 * A filter is a generic way to search for objects have a key that matches the value.
 */
export interface IFiltered {
  key: string;
  value: string;
}
