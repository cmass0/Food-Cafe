import "server-only";

export async function listUsers(): Promise<any[]> {
  throw new Error("Not implemented: listUsers");
}

export async function createUser(input: { email: string; username: string }): Promise<any> {
  throw new Error("Not implemented: createUser");
}

export async function getUser(id: string): Promise<any | null> {
  throw new Error("Not implemented: getUser");
}

export async function updateUser(id: string, input: { username?: string }): Promise<any | null> {
  throw new Error("Not implemented: updateUser");
}

export async function deleteUser(id: string): Promise<void> {
  throw new Error("Not implemented: deleteUser");
}

