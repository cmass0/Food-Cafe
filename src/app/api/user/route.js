// /**
//  * Handles GET requests.
//  *
//  * @param {Request} request - The request object.
//  * @returns {Promise<Response>} - A promise that resolves to a Response object.
//  */

import { NextRequest, NextResponse } from "next/server";
import { fetchRecipes, addRecipe } from "@/data/recipe";
import { addUser, fetchUser } from "@/data/user";

//단일 레시피 get

export async function GET(id) {
  // 여기서 로그 확인

  const fetchedUser = await fetchUser(id);

  if (fetchUser === null) {
    return new Response(null, { status: 204 });
  }

  const res = {
    data: fetchedUser,
  };
  return Response.json(res, { status: 200 });
}

//data add

export async function POST(request) {
  try {
    const { username, email, password, likerecipe } = await request.json();

    const addedUser = await addUser({
      username: username,
      email: email,
      password: password,
      likerecipe,
    });

    const newres = {
      message: "추가 성공",
      data: addedUser,
    };

    return Response.json(newres, { status: 201 });
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: err.message || "회원가입 중 오류발생",
        code: err.code,
      }),
      { status: 400 }
    );
  }
}

//단일 삭제

export async function DELETE(request, { params }) {
  // {params} : {params: (slug : string)})
  const deletedrecipe = await deleteARecipe(params.slug);

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
