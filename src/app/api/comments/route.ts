
import { commentInsertSchema } from "@/features/comment/schema";
import * as commentService from "@/features/comment/service";
import { getServerSupabase } from "@/lib/supabase/server";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";




export async function GET(req: Request) {
 try{
   const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "");
  const pageParam = Number(url.searchParams.get("page") ?? "");
  const limit = Number.isFinite(limitParam) ? limitParam : undefined;
  const page = Number.isFinite(pageParam) ? pageParam : undefined;
  const parentType = url.searchParams.get("parentType") as "recipe" | "post" ?? undefined;
  const parentId = url.searchParams.get("parentId") ?? undefined;


  const supabase = getServerSupabase()
  const data = await commentService.listComments(supabase, {
    limit: limit,
    page: page,
    parentType: parentType,
    parentId : parentId,
  })
  return Response.json({data}, {headers: {"Cache-Control" : "no-store"}});
 }catch(error){
  
    console.error("[posts] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
 }
 
}

export async function POST(req :Request) {
  try{
    const json = await req.json();
    const parsed= commentInsertSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const supabase = getServerSupabase();
    const {data: { user },} = await supabase.auth.getUser();
    const created = await commentService.createComment(supabase, user!.id,parsed.data);
    return Response.json({data: created}, {status: 201});

  }catch(error){
    return Response.json({error: 'INETRNAL_ERROR'}, {status : 500});
  }
}

