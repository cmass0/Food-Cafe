// /**
//  * Handles GET requests.
//  *
//  * @param {Request} request - The request object.
//  * @returns {Promise<Response>} - A promise that resolves to a Response object.
//  */

import {
  addcomment,
  deletecomment,
  fetchcommets,
  fetchUser,
} from "@/data/comment";

//단일  get

export async function GET() {
  // 여기서 로그 확인

  const fetchedComment = await fetchcommets();
  const res = {
    data: fetchedComment,
  };
  return Response.json(res, { status: 200 });
}

//data add

export async function POST(request) {
  const { comment, writer, type, id } = await request.json();

  const addedComment = await addcomment({
    comment,
    writer,
    type,
    id: id || null,
  });

  const newres = {
    message: "추가 성공",
    data: addedComment,
  };

  return Response.json(newres, { status: 201 });
}

//단일 삭제

export async function DELETE(request) {
  // {params} : {params: (slug : string)})
  const { id } = await request.json();
  const deletedcomment = await deletecomment(id);

  if (!deletedcomment) {
    return new Response(null, { status: 204 });
  }
  const res = {
    message: "삭제 성공",
    deletedata: deletedcomment,
  };
  return Response.json(res, { status: 200 });
}

//단일 수정

export async function PUT(request, { params }) {
  // {params} : {params: (slug : string)})

  const { image, email, name, recipe, summary, title, like } =
    await request.json();

  const editedrecipe = await editARecipe(params.slug, {
    image,
    email,
    name,
    title,
    summary,
    recipe,
    image,
    like,
  });

  if (!editedrecipe) {
    return new Response(null, { status: 204 });
  }

  const editedres = {
    id: params.slug,
    data: editedrecipe,
  };

  return Response.json(editedres, { status: 200 });
}
