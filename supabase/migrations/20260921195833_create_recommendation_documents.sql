create extension if not exists vector with schema extensions;

-- 원본 레시피/콤보를 대체하는 테이블이 아니라 검색만 빠르게 하기 위한 파생 인덱스다.
-- 제목·본문 등이 바뀌면 이 행도 다시 만들지만, 사용자에게 보여줄 값은 항상 원본에서 재조회한다.
create table private.recommendation_documents (
  source_type text not null,
  source_id uuid not null,
  search_text text not null,
  search_vector tsvector generated always as (
    to_tsvector('simple'::regconfig, search_text)
  ) stored,
  -- 모델을 확정하기 전이라 차원을 열어 둔다. 운영 모델을 정하면 vector(차원)과 HNSW 인덱스를
  -- 별도 마이그레이션으로 고정해야 잘못된 차원을 차단하고 대규모 검색 성능을 확보할 수 있다.
  embedding extensions.vector,
  category text,
  difficulty text,
  time_minutes integer,
  tools_required boolean not null default false,
  ingredient_names text[] not null default '{}'::text[],
  -- 원본 내용이 같으면 재임베딩하지 않기 위한 비교값이다. 임베딩 자체의 해시는 아니다.
  content_hash text not null,
  embedding_model text,
  embedding_status text not null default 'pending',
  embedding_error text,
  embedded_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint recommendation_documents_pkey
    primary key (source_type, source_id),
  constraint recommendation_documents_source_type_check
    check (source_type in ('recipe', 'combo')),
  constraint recommendation_documents_search_text_check
    check (length(btrim(search_text)) > 0),
  constraint recommendation_documents_time_minutes_check
    check (time_minutes is null or time_minutes >= 0),
  constraint recommendation_documents_content_hash_check
    check (length(btrim(content_hash)) > 0),
  constraint recommendation_documents_embedding_status_check
    check (embedding_status in ('pending', 'ready', 'failed')),
  constraint recommendation_documents_ready_embedding_check
    check (
      embedding_status <> 'ready'
      or (
        embedding is not null
        and embedding_model is not null
        and length(btrim(embedding_model)) > 0
        and embedded_at is not null
        and embedding_error is null
      )
    )
);

comment on table private.recommendation_documents is
  '레시피와 콤보를 통합 검색하기 위한 파생 인덱스. 원본 데이터의 기준은 public.recipes와 public.combos이다.';

comment on column private.recommendation_documents.embedding is
  '임베딩 모델 확정 전까지 차원을 고정하지 않는다. 모델 확정 후 차원 제약과 벡터 인덱스를 별도 마이그레이션으로 추가한다.';

create index recommendation_documents_search_vector_idx
  on private.recommendation_documents
  using gin (search_vector);

create index recommendation_documents_ingredient_names_idx
  on private.recommendation_documents
  using gin (ingredient_names);

create index recommendation_documents_pending_idx
  on private.recommendation_documents (embedding_status, updated_at)
  where embedding_status <> 'ready';

create trigger recommendation_documents_set_updated_at
before update on private.recommendation_documents
for each row
execute function public.set_updated_at();

alter table private.recommendation_documents enable row level security;

-- 브라우저와 일반 로그인 사용자는 파생 테이블을 직접 읽거나 수정하지 못한다.
-- 검색은 public RPC만, 색인 갱신은 서버의 service_role 작업만 사용한다.
revoke all on table private.recommendation_documents
  from public, anon, authenticated, service_role;

grant select, insert, update, delete
  on table private.recommendation_documents
  to service_role;
