
import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";

export const useNovel = (novelId, options = {}) => {
  return useQuery({
    queryKey: ['novel', novelId],
    queryFn: () => amuseAPI.get(`/api/novel/${novelId}`).then(res => res.data),
    ...options
  });
};