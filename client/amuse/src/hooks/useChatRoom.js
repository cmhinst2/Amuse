import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";

export const useChatRoom = (roomId) => {
  return useQuery({
    queryKey: ['muse', 'chatRoom', 'detail', roomId],
    queryFn: () => amuseAPI.get(`/api/muse/room/${roomId}`).then(res => res.data),
    retry: false,
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5,
  });
};