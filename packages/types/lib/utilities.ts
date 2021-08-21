import {
  IBasicVideo,
  ICollection,
  IEpisodicShow,
  IEpisodicVideo,
  IPlaylist,
  ISeasonedShow,
  ISerialVideo,
  IShow,
  IVideo
} from "@lib/entities";
import {
  BasicVideo,
  Browsable,
  EpisodicShow,
  EpisodicVideo,
  Playlist,
  SeasonedShow,
  SerialVideo,
  Show,
  Video
} from "@lib/types";
import {
  Response,
  CursorResponse,
  Cursor,
  ErrorResponse
} from "@lib/responses";

/*
 * General Utilities
 */

export function omit(
  data: Record<string, unknown>,
  keys: string | string[]
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(data).filter((entry) => ![keys].flat().includes(entry[0]))
  );
}

export function pick(
  data: Record<string, unknown>,
  keys: string | string[]
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(data).filter((entry) => [keys].flat().includes(entry[0]))
  );
}

/*
 * Response Utilities
 */
export function isErrorResponse(
  response: Response | CursorResponse
): response is ErrorResponse {
  return (response as ErrorResponse).error !== undefined;
}

export function isResponse<T>(response: Response<T>): response is T {
  return !isErrorResponse(response);
}

export function isCursor<T>(
  response: CursorResponse<T>
): response is Cursor<T> {
  return !isErrorResponse(response);
}

/*
 * Entity Utilities
 */

export function isISerialVideo(content: IVideo): content is ISerialVideo {
  return (content as ISerialVideo).playlist !== undefined;
}

export function isIEpisodicVideo(content: IVideo): content is IEpisodicVideo {
  return (content as IEpisodicVideo).show !== undefined;
}

export function isIBasicVideo(content: IVideo): content is IBasicVideo {
  return !isISerialVideo(content) && !isIEpisodicVideo(content);
}

export function isISeasonedShow(show: ICollection): show is ISeasonedShow {
  return (show as ISeasonedShow).seasons !== undefined;
}

export function isIEpisodicShow(show: ICollection): show is IEpisodicShow {
  return (show as IEpisodicShow).episodes !== undefined;
}

export function isIShow(collection: ICollection): collection is IShow {
  return isISeasonedShow(collection) || isIEpisodicShow(collection);
}

export function isIPlaylist(collection: ICollection): collection is IPlaylist {
  return (collection as IPlaylist).videos !== undefined;
}

/*
 * Types Utilties
 */

export function isVideo(content: Browsable): content is Video {
  return (content as Video).content !== undefined;
}

export function isSerialVideo(content: Browsable): content is SerialVideo {
  return (content as SerialVideo).playlist !== undefined;
}

export function isEpisodicVideo(content: Browsable): content is EpisodicVideo {
  return (content as EpisodicVideo).show !== undefined;
}

export function isBasicVideo(content: Browsable): content is BasicVideo {
  return (
    isVideo(content) && !isSerialVideo(content) && !isEpisodicVideo(content)
  );
}

export function isSeasonedShow(content: Browsable): content is SeasonedShow {
  return (content as SeasonedShow).seasons !== undefined;
}

export function isEpisodicShow(content: Browsable): content is EpisodicShow {
  return (content as EpisodicShow).episodes !== undefined;
}

export function isShow(content: Browsable): content is Show {
  return isSeasonedShow(content) || isEpisodicShow(content);
}

export function isPlaylist(content: Browsable): content is Playlist {
  return (content as Playlist).videos !== undefined;
}
