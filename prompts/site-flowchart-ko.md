# Food Cafe 사용자 플로우 개요 (Mermaid)

```mermaid
flowchart TD
    Visitor([방문자]) --> Home[/홈 페이지/]
    Home -->|상단 네비| MealsList[/레시피 목록 /meals/]
    Home -->|상단 네비| CommuList[/커뮤니티 목록 /commu/]
    Home -->|검색 입력| Search{검색어 입력?}
    Search -->|예| SearchResults[[검색 결과 페이지]]
    Search -->|아니오| Home

    MealsList --> MealsDetail[/레시피 상세 /meals/{id}/]
    MealsDetail --> CommentsMeals[[댓글 API /api/comments]]
    MealsDetail --> LikeRecipe{로그인?}
    LikeRecipe -->|예| UpdateLike[[/api/recipes/{id} 좋아요 증가]]
    LikeRecipe -->|아니오| Login[/로그인 페이지/]

    MealsList --> ShareCTA{레시피 공유 클릭?}
    ShareCTA -->|예| ShareAuth{로그인?}
    ShareAuth -->|예| MealsShare[/레시피 등록 /meals/share/]
    ShareAuth -->|아니오| Login
    MealsShare --> UploadImage[[Firebase Storage 업로드]]
    MealsShare --> CreateRecipe[[/api/recipes POST]]
    CreateRecipe --> MealsList

    MealsDetail --> EditRecipe{작성자 본인?}
    EditRecipe -->|예| RecipeEdit[/레시피 수정 /meals/{id}/recipeedit/]
    RecipeEdit --> UpdateRecipe[[/api/recipes/{id} PUT]]

    CommuList --> CommuDetail[/커뮤니티 상세 /commu/{id}/]
    CommuDetail --> CommentsPost[[댓글 API /api/comments]]
    CommuDetail --> EditPost{작성자 본인?}
    EditPost -->|예| PostEdit[/게시글 수정 /commu/{id}/editform/]
    PostEdit --> UpdatePost[[/api/posts/{id} PUT]]
    CommuDetail --> DeletePost[[/api/posts/{id} DELETE]]

    CommuList --> WriteCTA{글쓰기 클릭?}
    WriteCTA -->|예| WriteAuth{로그인?}
    WriteAuth -->|예| CommuWrite[/게시글 작성 /commu/writeform/]
    CommuWrite --> UploadPostImage[[Firebase Storage 업로드]]
    CommuWrite --> CreatePost[[/api/posts POST]]
    WriteAuth -->|아니오| Login

    Login --> AuthAPI[[Firebase Auth]]
    AuthAPI --> Home

    Signup[/회원가입 /signup/ ] --> RegisterAPI[[/api/user POST + Firebase Admin]]
    RegisterAPI --> Login
```
