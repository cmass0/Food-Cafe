import "server-only";

export async function listRecipes(): Promise<any[]> {
  throw new Error("Not implemented: listRecipes");
}

export async function createRecipe(input: any): Promise<any> {
  throw new Error("Not implemented: createRecipe");
}

export async function getRecipe(id: string): Promise<any | null> {
  throw new Error("Not implemented: getRecipe");
}

export async function updateRecipe(id: string, input: any): Promise<any | null> {
  throw new Error("Not implemented: updateRecipe");
}

export async function deleteRecipe(id: string): Promise<void> {
  throw new Error("Not implemented: deleteRecipe");
}

