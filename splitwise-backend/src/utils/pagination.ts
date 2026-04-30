type CursorLike = { _id: { toString: () => string } };

export const paginateCursor = <T extends CursorLike>(items: T[], limit: number) => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
  return { data, nextCursor };
};

export const buildPageMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

