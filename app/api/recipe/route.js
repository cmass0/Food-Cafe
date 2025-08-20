// /**
//  * Handles GET requests.
//  *
//  * @param {Request} request - The request object.
//  * @returns {Promise<Response>} - A promise that resolves to a Response object.
//  */

import { NextRequest, NextResponse } from "next/server";

import { fetchRecipes, addRecipe } from "@/data/recipe";

export async function GET() {
  const fetchRecipe = await fetchRecipes();
  const res = {
    data: fetchRecipe,
  };
  return Response.json(res, {
    status: 200,
  });
}

//data add

export async function POST(request) {
  const { image, title, email, recipe, name, summary, id } =
    await request.json();

  const addedRecipe = await addRecipe({
    image: image || null,
    title,
    email,
    recipe,
    name,
    summary,
    id: id || null,
  });

  const newres = {
    message: "추가 성공",
    data: addedRecipe,
  };

  return Response.json(newres, { status: 201 });
}

//단일 삭제

export async function DELETE(request, { params }) {
  // {params} : {params: (slug : string)})

  const res = {
    id: params.slug,
    message: "delete",
    data: dummydata,
  };
  return Response.json(res, { status: 200 });
}

//단일 수정

export async function PUT(request, { params }) {
  // {params} : {params: (slug : string)})

  const { message } = await request.json();

  const editedres = {
    id: params.slug,
    title: message,
    data: dummydata,
  };

  return Response.json(editedres, { status: 200 });
}
