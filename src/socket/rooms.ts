export const rooms = {
  user: (id: string) => `user:${id}`,
  room: (id: string) => `room:${id}`, // lobby AND race use the same room
};
