import "server-only";

export async function listPosts(): Promise<any[]> {
  throw new Error("Not implemented: listPosts");
}

export async function createPost(input: any): Promise<any> {
  throw new Error("Not implemented: createPost");
}

export async function getPost(id: string): Promise<any | null> {
  throw new Error("Not implemented: getPost");
}

export async function updatePost(id: string, input: any): Promise<any | null> {
  throw new Error("Not implemented: updatePost");
}

export async function deletePost(id: string): Promise<void> {
  throw new Error("Not implemented: deletePost");
}

