import type { PageBlock } from "./types";
import { mapRoomsToCards } from "./roomBlockMapper";

function wantsLiveRooms(props: Record<string, unknown>): boolean {
  const v = props.useLiveRooms;
  return v === true || v === "true";
}

/** Inject live room list into blocks for preview (does not persist to saved page JSON). */
export function hydrateBlocksWithRooms(blocks: PageBlock[], rooms: unknown[]): PageBlock[] {
  if (!rooms.length) return blocks;

  const cards = mapRoomsToCards(rooms);

  return blocks.map((block) => {
    const props = block.props ?? {};
    const isAllRooms = block.type === "hotel-all-rooms";
    const isLiveRoomTypes = block.type === "hotel-room-types" && wantsLiveRooms(props);
    if (!isAllRooms && !isLiveRoomTypes) return block;

    return {
      ...block,
      props: {
        ...props,
        useLiveRooms: true,
        rooms: cards,
        liveRoomCount: cards.length,
      },
    };
  });
}
