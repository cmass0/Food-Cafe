// tools/migrations/hooks/recipes.js
// Firestore → Supabase document shaping for recipes
module.exports = (_collection, doc) => {
  const toISO = (t) => {
    if (!t) return null;
    if (t?.toDate) return t.toDate().toISOString();
    const parsed = Date.parse(t);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  };

  doc.created_at = toISO(doc.createdAt) || new Date().toISOString();
  doc.updated_at = toISO(doc.updatedAt) || doc.created_at;
  doc.last_liked_at = toISO(doc.lastLikedAt) || null;

  if (doc.content && !doc.recipe) doc.recipe = String(doc.content);

  if (doc.images && !Array.isArray(doc.images)) doc.images = [String(doc.images)];
  if (!doc.images) doc.images = [];
  if (doc.tags && !Array.isArray(doc.tags)) doc.tags = [String(doc.tags)];
  if (!doc.tags) doc.tags = [];

  if (doc.like_count == null && doc.likeCount != null) doc.like_count = Number(doc.likeCount) || 0;
  if (doc.like_count == null) doc.like_count = 0;

  if (doc.view_count == null && doc.viewCount != null) doc.view_count = Number(doc.viewCount) || 0;
  if (doc.view_count == null) doc.view_count = 0;

  if (doc.status != null) doc.status = Number(doc.status); else doc.status = 0;

  if (doc.writerUid) doc.writer_uid_legacy = String(doc.writerUid);
  if (doc.writerName && !doc.writer_name) doc.writer_name = doc.writerName;
  if (doc.writerEmail && !doc.writer_email) doc.writer_email = doc.writerEmail;

  delete doc.createdAt; delete doc.updatedAt; delete doc.lastLikedAt;
  delete doc.likeCount; delete doc.viewCount;
  delete doc.writerUid; delete doc.writerName; delete doc.writerEmail;
  delete doc.content;
  return doc;
};
