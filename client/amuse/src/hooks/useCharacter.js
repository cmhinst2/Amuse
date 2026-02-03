import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";

export const useCharacter = (characterId, option = {}) => {
  return useQuery({
    queryKey: ['muse', 'character', characterId],
    queryFn: () => amuseAPI.get(`/api/muse/${characterId}`).then(res => res.data),
    ...option
  })
};