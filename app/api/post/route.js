import { addPost, fetchPosts } from "@/data/post";

export async function GET() {
  const fetchPost = await fetchPosts();
  const res = {
    data: fetchPost,
  };
  return Response.json(res, {
    status: 200,
  });
}

//create
export async function POST(request) {
  const { writer, title, content, number } = await request.json();

  const addedPost = await addPost({
    writer,
    title,
    content,
    number,
  });

  const newres = {
    message: "추가 성공",
    data: addedPost,
  };

  return Response.json(newres, { status: 201 });
}
