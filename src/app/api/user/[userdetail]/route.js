import { fetchUser, deleteAUser } from "@/data/user";

// GET /api/user/[userdetail]
export async function GET(request, { params }) {
  const id = params?.userdetail;
  if (!id) return new Response(null, { status: 400 });

  const user = await fetchUser(id);
  if (!user) return new Response(null, { status: 204 });

  return Response.json({ data: user }, { status: 200 });
}

// DELETE /api/user/[userdetail]
export async function DELETE(request, { params }) {
  const id = params?.userdetail;
  if (!id) return new Response(null, { status: 400 });

  const deleted = await deleteAUser(id);
  if (!deleted) return new Response(null, { status: 204 });

  return Response.json({ message: "삭제 완료", data: deleted }, { status: 200 });
}

