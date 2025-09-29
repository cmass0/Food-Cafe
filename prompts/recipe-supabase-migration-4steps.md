# ������ Supabase ���̱׷��̼� ���̵� (4��Ʈ)

Firebase �� Supabase ��ȯ�� ���� �ܰ躰 üũ����Ʈ�Դϴ�. �� ��Ʈ�� ������� �����ϰ� ���� �׸��� Ȯ���ϼ���.

## ���� ����
- `src/lib/supabase/{browser.ts, server.ts}`
- `src/features/recipe/{types.ts, schema.ts, repository.ts, service.ts, ui/*}`
- `src/app/recipes/{page.tsx, new/page.tsx, [id]/page.tsx, actions.ts}`
- `src/middleware.ts` (����)

## ���� �۾�
- ȯ�� ���� Ȯ��: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- DB/RLS ����: `recipes/users/posts/comments` ���̺� RLS Ȱ��ȭ �� ��å ���� Ȯ��

---

## 1) lib - Supabase Ŭ���̾�Ʈ ����
**��ǥ**: ������/���� ���� Supabase Ŭ���̾�Ʈ�� �����ϰ� ���� ��� RLS�� �ؼ��Ѵ�.

**���� ���**
- `browser.ts`: public anon Ű ��� `createBrowserClient` �̱��� ����
- `server.ts`: Next.js cookies �긮���� �Բ� `createServerClient` ���� (�̵������� �׼� ����)

**����**
- �͸� SELECT�� ���� ������Ʈ���� ���� ����
- ������ ����ڸ� create/update/delete ����, �͸��� 401/403

**üũ����Ʈ**
- [ ] ������ Ŭ���̾�Ʈ�� anon Ű�� ����ϰ� ���� �� Ű�� ������� �ʴ´�.
- [ ] ���� ȯ�濡�� �������� ���� write�� ���ܵǾ� �ִ�.

---

## 2) features/recipe - ������/����/����/UI
**��ǥ**: ������ ������ ������ Supabase �߽� ������ �������ϰ� �Է� ������UI ��ĳ���带 �����.

**���� ���**
- `types.ts`: Supabase ��Ű�� ��� Ÿ�� (`RecipeRow`, `RecipeInsert`, `RecipeUpdate` ��)
- `schema.ts`: Zod �Է� ���� (�ʼ�/����/�̹��� URL ��)
- `repository.ts`: Supabase RLS-aware ���� ���� (list/get/create/update/remove)
- `service.ts`: ���� �� ����Ͻ� ��Ģ orchestration (legacy id, �±�/�̹��� ����ȭ)
- `ui/*`: SSR ���, �Է� ��, ī�� ������Ʈ �⺻ ����

**����**
- Repository�� SELECT/INSERT/UPDATE/DELETE �� ���� �ź� ��θ� ó��
- Service�� �߸��� �Է��� ���� �ǹ� �ִ� ������ ��ȯ

**üũ����Ʈ**
- [x] SELECT�� ���� ���� ��� RLS ��å�� �ؼ��ϵ��� �����Ǿ� �ִ�.
- [x] `created_at DESC, id ASC` ��� Ŀ�� ���������̼� ����
- [x] �ʿ��� �ε����� �������� Ȯ���ߴ� (���� ��Ű���� ����)

---

## 3) app/recipes - App Router ������ & ���� �׼�
**��ǥ**: SSR �������� ���� �׼����� Supabase�� ����ϰ� ���� ���ĸ� Ȯ���Ѵ�.

**���� ���**
- `page.tsx`: Supabase ���� + `RecipeList`�� �̿��� SSR ������ ���
- `new/page.tsx`: `RecipeForm`�� `createRecipeAction`�� ������ �ۼ� �帧
- `[id]/page.tsx`: �� + ����/���� ��ư (���� �׼� ����)
- `actions.ts`: create/update/remove ���� �׼� (���� ����, revalidate ó��)

**����**
- ��α��� ����ڴ� ��ȸ�� ����, ���̴� ���� (���� �α��� �׽�Ʈ �ʿ�)
- ���� �׼��� ���� �� �����̷�Ʈ/��������, ���� �� ���� ���� ǥ��

**üũ����Ʈ**
- [x] Ŭ���̾�Ʈ ������Ʈ�� DB�� ���� ȣ������ �ʰ� ���� �׼��� ����Ѵ�.
- [x] ���� �׼��� Redirect/���� ó���� �ϰ��ǰ� ������ UX�� �����ȴ�.

---

## 4) middleware (����) - ����/��Ű ����
**��ǥ**: ��ȣ ��� ���Ѱ� SSR �� Supabase ��Ű ������ �ٷ��.

**���� ��� (����)**
- `/recipes/new` �� ���� �ʿ��� ��� ���� �� �α��� �������� �����̷���
- �ʿ� �� Supabase ���� ��Ű ���� ó��

**üũ����Ʈ**
- [ ] �̵����� �ʿ��� ��ο��� �����Ѵ�.
- [ ] ���� �׼ǰ� �ߺ��Ǵ� ���� �˻簡 �߻����� �ʵ��� �Ѵ�.