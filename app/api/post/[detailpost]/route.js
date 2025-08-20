// /**
//  * Handles GET requests.
//  *
//  * @param {Request} request - The request object.
//  * @returns {Promise<Response>} - A promise that resolves to a Response object.
//  */

import { deleteAPost, editAPost, fetchPost } from "@/data/post";

// read
export async function GET(request, { params }) {
  console.log("Recived params: ", params);
  const { detailpost } = params;
  const fetchedPost = await fetchPost(detailpost);

  if (fetchedPost === null) {
    return new Response(null, { status: 204 });
  }

  const res = {
    data: fetchedPost,
  };
  return Response.json(res, { status: 200 });
}

// update
export async function PUT(request, { params }) {
  // {params} : {params: (slug : string)})

  const { title, writer, content, check } = await request.json();
  console.log("check text: ", check);

  const editedPost = await editAPost(params.detailpost, {
    title,
    writer,
    content,
    check,
  });

  if (!editedPost) {
    return new Response(null, { status: 204 });
  }

  const editedres = {
    id: params.detailpost,
    data: editedPost,
  };

  return Response.json(editedres, { status: 200 });
}

// delete
export async function DELETE(request) {
  // {params} : {params: (slug : string)})
  const { id } = await request.json();
  const deletedpost = await deleteAPost(id);

  if (!deletedpost) {
    return new Response(null, { status: 204 });
  }
  const res = {
    message: "삭제 성공",
    deletedata: deletedpost,
  };
  return Response.json(res, { status: 200 });
}
