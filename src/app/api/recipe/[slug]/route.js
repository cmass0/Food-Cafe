// /**
//  * Handles GET requests.
//  *
//  * @param {Request} request - The request object.
//  * @returns {Promise<Response>} - A promise that resolves to a Response object.
//  */

import { NextRequest, NextResponse } from "next/server";

import {
  fetchRecipes,
  addRecipe,
  fetchRecipe,
  deleteARecipe,
  editARecipe,
} from "@/data/recipe";

//단일 레시피 get

export async function GET(request, { params }) {
  console.log("Received params:", params); // 여기서 로그 확인
  const { slug } = params;
  const fetchedRecipe = await fetchRecipe(slug);

  if (fetchedRecipe === null) {
    return new Response(null, { status: 204 });
  }

  const res = {
    data: fetchedRecipe,
  };
  return Response.json(res, { status: 200 });
}

//data add

export async function POST(request) {
  const { requestdata } = await request.json();

  if (!requestdata) {
    const error = new Error("레시피가 존재하지 않습니다.");
    err.code = "422";
    throw error;
  }

  const addedRecipe = await addRecipe({
    title: requestdata.title,
    email: requestdata.email,
    recipe: requestdata.request,
    name: requestdata.name,
    summary: requestdata.summary,
    image: requestdata.image,
  });

  const newres = {
    message: "추가 성공",
    data: addedRecipe,
  };

  return Response.json(newres, { status: 201 });
}

//단일 삭제

export async function DELETE(request) {
  // {params} : {params: (slug : string)})
  const { id } = await request.json();
  const deletedrecipe = await deleteARecipe(id);

  if (!deletedrecipe) {
    return new Response(null, { status: 204 });
  }
  const res = {
    message: "삭제 성공",
    deletedata: deletedrecipe,
  };
  return Response.json(res, { status: 200 });
}

//단일 수정

export async function PUT(request, { params }) {
  // {params} : {params: (slug : string)})

  const { image, email, name, recipe, summary, title, like, check, lastlike } =
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
    check,
    lastlike,
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
