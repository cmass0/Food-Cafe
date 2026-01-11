import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RecipeListResult } from "@/domain/recipe/types";
import { Bookmark, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  recipes: RecipeListResult;
  searchParams: Record<string, string | string[] | undefined>;
};

export default function SearchResultRecipe({ recipes, searchParams }: Props) {
  const recipeitems = recipes.items;
  const basePath = `${process.env.NEXT_PUBLIC_BASE_URL}/search`;
  const query = searchParams;
  const pageImtemCount = recipes.limit;
  const total = recipes.total;
  const currentPage = Number(query.page) ?? 1;
  console.log("qs: ", query);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h2 className="font-bold text-xl mb-5">
          <Separator orientation="vertical" />
          레시피
        </h2>
        {recipeitems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4">
            {recipeitems.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex rounded-xl border hover:shadow-md transition-shadow overflow-hidden h-28"
                >
                  <div className="w-28 h-28 flex-shrink-0 relative">
                    {recipe.image ? (
                      <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-sm truncate mb-1">{recipe.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{recipe.summary}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      {recipe.tags && recipe.tags.length > 0 ? (
                        <div className="flex gap-1 overflow-hidden">
                          {recipe.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                          {recipe.likeCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Bookmark className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {recipe.bookmarkCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <PaginationComponent
        basePath={basePath}
        page={currentPage}
        pageItemSize={pageImtemCount}
        blockSize={5}
        total={total}
        query={query}
      />
    </Card>
  );
}
