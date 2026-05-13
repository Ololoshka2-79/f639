export const ADMIN_IDS = [1077071564, 790931541];

export const isAdmin = (userId) => {
  return ADMIN_IDS.includes(Number(userId));
};
