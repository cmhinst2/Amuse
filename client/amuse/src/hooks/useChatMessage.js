import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";

export const useChatMessage = (roomId, option = {}) => {
  return useQuery({
    queryKey: ['muse','chatRoom','chatMessages', roomId],
    queryFn: () => amuseAPI.get(`/api/muse/${roomId}/messages`).then(res => res.data),
    ...option
  })
};