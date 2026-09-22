import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embedMany, gateway } from "ai";
import { config as loadEnv } from "dotenv";

import {
  buildComboRecommendationDocument,
  buildRecipeRecommendationDocument,
} from "../../src/domain/recommend/document";
import type {
  RecommendationComboDocumentSource,
  RecommendationDocument,
  RecommendationRecipeDocumentSource,
} from "../../src/domain/recommend/types";
import {
  RECOMMENDATION_EMBEDDING_DIMENSIONS,
  RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS,
} from "../../src/lib/ai/embedding-config";
import { formatRecommendationDocumentEmbeddingInput } from "../../src/lib/ai/embedding-input";
import type { Database, Json } from "../../src/types/supabase";

const DEFAULT_BATCH_SIZE = 16;
const MAX_BATCH_SIZE = 100;
const RECIPE_COLUMNS = `
  id, title, summary, chef_tip, steps, ingredients, category, tags, tools,
  tools_required, difficulty, time_minutes, servings
` as const;
const COMBO_COLUMNS = `
  id, title, summary, steps, items, tags, tools, tools_required,
  difficulty, time_minutes
` as const;

type ExistingDocumentState = {
  source_type: string;
  source_id: string;
  content_hash: string;
  embedding_model: string | null;
  embedding_status: string;
};

type PreparedDocument = RecommendationDocument & {
  contentHash: string;
  embeddingInput: string;
};

function loadLocalEnvironment() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (existsSync(path)) loadEnv({ path, override: false });
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

function getSupabaseUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (explicitUrl) return explicitUrl;

  const poolerPath = resolve(process.cwd(), "supabase/.temp/pooler-url");
  if (existsSync(poolerPath)) {
    const poolerUrl = readFileSync(poolerPath, "utf8");
    const projectRef = poolerUrl.match(/postgres\.([a-z0-9]+):/i)?.[1];
    if (projectRef) return `https://${projectRef}.supabase.co`;
  }

  throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 필요합니다.");
}

function parseBatchSize(args: string[]): number {
  const option = args.find((arg) => arg.startsWith("--batch-size="));
  if (!option) return DEFAULT_BATCH_SIZE;

  const value = Number(option.slice("--batch-size=".length));
  if (!Number.isInteger(value) || value < 1 || value > MAX_BATCH_SIZE) {
    throw new Error(`batch-size는 1 이상 ${MAX_BATCH_SIZE} 이하의 정수여야 합니다.`);
  }
  return value;
}

function splitIntoBatches<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function createPreparedDocument(
  document: RecommendationDocument,
  modelId: string
): PreparedDocument {
  const embeddingInput = formatRecommendationDocumentEmbeddingInput(
    document.title,
    document.searchText,
    modelId
  );
  const contentHash = createHash("sha256").update(embeddingInput).digest("hex");
  return { ...document, contentHash, embeddingInput };
}

function documentKey(sourceType: string, sourceId: string): string {
  return `${sourceType}:${sourceId}`;
}

function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadSourceDocuments(
  client: SupabaseClient<Database>
): Promise<RecommendationDocument[]> {
  const [recipeResult, comboResult] = await Promise.all([
    client.from("recipes").select(RECIPE_COLUMNS).order("id", { ascending: true }),
    client.from("combos").select(COMBO_COLUMNS).order("id", { ascending: true }),
  ]);

  if (recipeResult.error) throw recipeResult.error;
  if (comboResult.error) throw comboResult.error;

  const recipes = (recipeResult.data ?? []) as RecommendationRecipeDocumentSource[];
  const combos = (comboResult.data ?? []) as RecommendationComboDocumentSource[];
  return [
    ...recipes.map(buildRecipeRecommendationDocument),
    ...combos.map(buildComboRecommendationDocument),
  ];
}

async function loadExistingDocuments(
  client: SupabaseClient<Database>
): Promise<Map<string, ExistingDocumentState>> {
  const { data, error } = await client.rpc("get_recommendation_document_states");
  if (error) throw error;

  return new Map((data ?? []).map((row) => [documentKey(row.source_type, row.source_id), row]));
}

function toRpcDocument(
  document: PreparedDocument,
  modelId: string,
  status: "pending" | "ready" | "failed",
  embedding: number[] | null,
  error: string | null
): Json {
  return {
    source_type: document.sourceType,
    source_id: document.sourceId,
    search_text: document.searchText,
    embedding: embedding ? JSON.stringify(embedding) : null,
    category: document.category,
    difficulty: document.difficulty,
    time_minutes: document.timeMinutes,
    tools_required: document.toolsRequired,
    ingredient_names: document.ingredientNames,
    content_hash: document.contentHash,
    embedding_model: modelId,
    embedding_status: status,
    embedding_error: error,
  };
}

async function saveDocuments(
  client: SupabaseClient<Database>,
  documents: PreparedDocument[],
  modelId: string,
  status: "pending" | "ready" | "failed",
  embeddings?: number[][],
  failure?: unknown
) {
  const errorMessage = failure
    ? (failure instanceof Error ? failure.message : String(failure)).slice(0, 1000)
    : null;
  const payload = documents.map((document, index) =>
    toRpcDocument(document, modelId, status, embeddings?.[index] ?? null, errorMessage)
  );
  const { data, error } = await client.rpc("upsert_recommendation_documents", {
    p_documents: payload,
  });

  if (error) throw error;
  if (data !== documents.length) {
    throw new Error(`추천 문서 저장 개수가 다릅니다: ${data}/${documents.length}`);
  }
}

function validateEmbeddings(embeddings: number[][], expectedCount: number): number {
  if (embeddings.length !== expectedCount) {
    throw new Error(`임베딩 개수가 요청과 다릅니다: ${embeddings.length}/${expectedCount}`);
  }

  for (const embedding of embeddings) {
    if (
      embedding.length !== RECOMMENDATION_EMBEDDING_DIMENSIONS ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(
        `추천 문서 임베딩은 ${RECOMMENDATION_EMBEDDING_DIMENSIONS}차원이어야 합니다.`
      );
    }
  }
  return RECOMMENDATION_EMBEDDING_DIMENSIONS;
}

async function main() {
  loadLocalEnvironment();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const batchSize = parseBatchSize(args);
  const modelId = process.env.AI_RECOMMEND_EMBEDDING_MODEL?.trim() ?? "";
  const client = createAdminClient();
  const documents = await loadSourceDocuments(client);
  const recipeCount = documents.filter((document) => document.sourceType === "recipe").length;
  const comboCount = documents.length - recipeCount;

  if (!modelId) {
    console.log(`백필 대상: 레시피 ${recipeCount}개, 콤보 ${comboCount}개`);
    if (dryRun) {
      console.log("변경 여부 계산에는 AI_RECOMMEND_EMBEDDING_MODEL이 필요합니다.");
      return;
    }
    throw new Error("AI_RECOMMEND_EMBEDDING_MODEL 환경변수가 필요합니다.");
  }

  const prepared = documents.map((document) => createPreparedDocument(document, modelId));
  const existing = await loadExistingDocuments(client);
  const targets = prepared.filter((document) => {
    if (force) return true;
    const current = existing.get(documentKey(document.sourceType, document.sourceId));
    return !(
      current?.embedding_status === "ready" &&
      current.content_hash === document.contentHash &&
      current.embedding_model === modelId
    );
  });

  console.log(`백필 대상 원본: 레시피 ${recipeCount}개, 콤보 ${comboCount}개`);
  console.log(
    `임베딩 필요: ${targets.length}개, 변경 없음: ${documents.length - targets.length}개`
  );
  if (dryRun || targets.length === 0) return;

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error("AI_GATEWAY_API_KEY 또는 VERCEL_OIDC_TOKEN이 필요합니다.");
  }

  let completed = 0;
  let totalTokens = 0;
  let embeddingDimension: number | null = null;
  const batches = splitIntoBatches(targets, batchSize);

  for (const [batchIndex, batch] of batches.entries()) {
    await saveDocuments(client, batch, modelId, "pending");
    try {
      const result = await embedMany({
        model: gateway.embeddingModel(modelId),
        values: batch.map((document) => document.embeddingInput),
        providerOptions: RECOMMENDATION_EMBEDDING_PROVIDER_OPTIONS,
        maxParallelCalls: 2,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(60_000),
      });
      const currentDimension = validateEmbeddings(result.embeddings, batch.length);
      if (embeddingDimension !== null && embeddingDimension !== currentDimension) {
        throw new Error(
          `배치마다 임베딩 차원이 다릅니다: ${embeddingDimension}/${currentDimension}`
        );
      }
      embeddingDimension = currentDimension;
      totalTokens += result.usage.tokens;
      await saveDocuments(client, batch, modelId, "ready", result.embeddings);
      completed += batch.length;
      console.log(
        `배치 ${batchIndex + 1}/${batches.length}: ${completed}/${targets.length}개 저장`
      );
    } catch (error) {
      await saveDocuments(client, batch, modelId, "failed", undefined, error);
      throw error;
    }
  }

  console.log(
    `백필 완료: ${completed}개, 모델 ${modelId}, 차원 ${embeddingDimension}, 입력 토큰 ${totalTokens}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
