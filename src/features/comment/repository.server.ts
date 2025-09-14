import "server-only";

export async function listComments(): Promise<any[]> {
  throw new Error("Not implemented: listComments");
}

export async function createComment(input: any): Promise<any> {
  throw new Error("Not implemented: createComment");
}

export async function getComment(id: string): Promise<any | null> {
  throw new Error("Not implemented: getComment");
}

export async function updateComment(id: string, input: any): Promise<any | null> {
  throw new Error("Not implemented: updateComment");
}

export async function deleteComment(id: string): Promise<void> {
  throw new Error("Not implemented: deleteComment");
}

