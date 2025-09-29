import { findUserByUsername } from "@/features/user/api";

async function checkDuplicate(username) {
  if (!username) return false;
  try {
    const payload = await findUserByUsername(username);
    return Boolean(payload?.data);
  } catch (error) {
    console.error("Failed to check username duplication", error);
    return false;
  }
}

export { checkDuplicate };
