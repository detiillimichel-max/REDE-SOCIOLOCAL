-- REDE-SOCIOLOCAL
-- Estrutura inicial do banco Neon
-- Versão: 1.0
-- Objetivo: criar a base de metadados, publicações, interações,
-- cache externo, controle de consumo e configurações do aplicativo.
--
-- Regras de segurança:
-- 1. Este arquivo não contém DROP TABLE.
-- 2. As tabelas são criadas somente se ainda não existirem.
-- 3. Vídeos e arquivos brutos não são armazenados no banco.
-- 4. O banco guarda metadados, URLs e identificadores de reprodução.

BEGIN;

-- Necessário para gerar UUIDs no PostgreSQL/Neon.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PERFIS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(120),
    avatar_url TEXT,
    bio TEXT,
    city VARCHAR(120),
    state VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_display_name
    ON profiles (display_name);

CREATE INDEX IF NOT EXISTS idx_profiles_location
    ON profiles (state, city);

-- Vínculo simples com o provedor de autenticação do aplicativo.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS email VARCHAR(320);

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email
    ON profiles (email)
    WHERE email IS NOT NULL;

-- ============================================================
-- 2. PUBLICAÇÕES E METADADOS DE MÍDIA
-- ============================================================

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    media_type VARCHAR(30) NOT NULL,
    title VARCHAR(240),
    description TEXT,
    category VARCHAR(100),
    duration_seconds INTEGER,
    source VARCHAR(80),
    source_url TEXT,
    thumbnail_url TEXT,
    storage_url TEXT,
    mux_asset_id VARCHAR(180),
    mux_playback_id VARCHAR(180),
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_duration_nonnegative
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT media_type_valid
        CHECK (media_type IN (
            'short_video',
            'mux_video',
            'image',
            'image_audio',
            'external_video'
        )),
    CONSTRAINT media_status_valid
        CHECK (status IN (
            'pending',
            'processing',
            'ready',
            'failed',
            'removed'
        ))
);

CREATE INDEX IF NOT EXISTS idx_media_author_id
    ON media (author_id);

CREATE INDEX IF NOT EXISTS idx_media_created_at
    ON media (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_status
    ON media (status);

CREATE INDEX IF NOT EXISTS idx_media_type_category
    ON media (media_type, category);

CREATE INDEX IF NOT EXISTS idx_media_source_url
    ON media (source_url);

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_mux_asset_id
    ON media (mux_asset_id)
    WHERE mux_asset_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_mux_playback_id
    ON media (mux_playback_id)
    WHERE mux_playback_id IS NOT NULL;

-- ============================================================
-- 3. INTERAÇÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS media_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    interaction_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_interaction_type_valid
        CHECK (interaction_type IN (
            'like',
            'view',
            'share',
            'save'
        ))
);

CREATE INDEX IF NOT EXISTS idx_media_interactions_media_id
    ON media_interactions (media_id);

CREATE INDEX IF NOT EXISTS idx_media_interactions_user_id
    ON media_interactions (user_id);

CREATE INDEX IF NOT EXISTS idx_media_interactions_type_created
    ON media_interactions (interaction_type, created_at DESC);

-- Uma curtida por usuário para cada mídia.
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_interactions_like
    ON media_interactions (media_id, user_id, interaction_type)
    WHERE interaction_type = 'like';

-- ============================================================
-- 3A. VISUALIZAÇÕES
-- ============================================================
-- Visualizações ficam separadas das interações sociais para não
-- inflar a tabela usada por curtidas, compartilhamentos e salvamentos.

CREATE TABLE IF NOT EXISTS media_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(180),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_views_media_id
    ON media_views (media_id);

CREATE INDEX IF NOT EXISTS idx_media_views_user_id
    ON media_views (user_id);

CREATE INDEX IF NOT EXISTS idx_media_views_created_at
    ON media_views (created_at DESC);

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS media_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT media_comment_content_not_empty
        CHECK (length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_media_comments_media_id
    ON media_comments (media_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_comments_author_id
    ON media_comments (author_id);

-- ============================================================
-- 5. CACHE DE CONTEÚDOS EXTERNOS
-- ============================================================

CREATE TABLE IF NOT EXISTS content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(80) NOT NULL,
    external_id VARCHAR(240) NOT NULL,
    title VARCHAR(300),
    description TEXT,
    category VARCHAR(100),
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    content_url TEXT,
    source_url TEXT,
    published_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_displayed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_cache_duration_nonnegative
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT content_cache_source_external_unique
        UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_content_cache_source
    ON content_cache (source);

CREATE INDEX IF NOT EXISTS idx_content_cache_category
    ON content_cache (category);

CREATE INDEX IF NOT EXISTS idx_content_cache_expires_at
    ON content_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_content_cache_collected_at
    ON content_cache (collected_at DESC);

-- ============================================================
-- 6. JANELAS DE CONSUMO DAS APIs
-- ============================================================

CREATE TABLE IF NOT EXISTS api_usage_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(80) NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    window_ends_at TIMESTAMPTZ NOT NULL,
    official_limit INTEGER,
    operational_limit INTEGER,
    requests_used INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    last_request_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT api_usage_official_limit_nonnegative
        CHECK (official_limit IS NULL OR official_limit >= 0),
    CONSTRAINT api_usage_operational_limit_nonnegative
        CHECK (operational_limit IS NULL OR operational_limit >= 0),
    CONSTRAINT api_usage_requests_nonnegative
        CHECK (requests_used >= 0),
    CONSTRAINT api_usage_window_order
        CHECK (window_ends_at > window_started_at),
    CONSTRAINT api_usage_status_valid
        CHECK (status IN (
            'available',
            'near_limit',
            'blocked'
        ))
);

CREATE INDEX IF NOT EXISTS idx_api_usage_source_window
    ON api_usage_windows (source, window_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_status
    ON api_usage_windows (status);

-- ============================================================
-- 7. CONFIGURAÇÕES CENTRAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(120) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações iniciais. Não substitui valores já existentes.
INSERT INTO app_settings (key, value, description)
VALUES
    ('short_video_max_duration_seconds', '120', 'Duração máxima inicial para vídeos curtos.'),
    ('cache_default_item_limit', '100', 'Quantidade aproximada de itens buscados por ciclo.'),
    ('cache_default_ttl_hours', '24', 'Tempo padrão inicial de validade do cache.'),
    ('api_operational_margin_percent', '25', 'Reserva operacional para banco e infraestrutura.'),
    ('public_api_operational_percent', '70', 'Teto operacional inicial para APIs públicas.'),
    ('restricted_api_operational_percent', '15', 'Teto operacional inicial para APIs restritas.'),
    ('feed_page_size', '15', 'Quantidade inicial de itens carregados por página.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 8. CONTADORES DE CURTIDAS E COMENTÁRIOS
-- ============================================================

-- Garante que schemas executados sobre uma versão já existente também
-- recebam os novos contadores sem recriar a tabela.
ALTER TABLE media
    ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- Reconcilia os contadores existentes antes de instalar os triggers.
UPDATE media m
SET
    likes_count = (
        SELECT COUNT(*)::INTEGER
        FROM media_interactions mi
        WHERE mi.media_id = m.id
          AND mi.interaction_type = 'like'
    ),
    comments_count = (
        SELECT COUNT(*)::INTEGER
        FROM media_comments mc
        WHERE mc.media_id = m.id
    );

CREATE OR REPLACE FUNCTION update_media_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE media
            SET likes_count = likes_count + 1
            WHERE id = NEW.media_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE media
            SET likes_count = GREATEST(likes_count - 1, 0)
            WHERE id = OLD.media_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$func$;

DROP TRIGGER IF EXISTS trg_media_interactions_like_count ON media_interactions;
CREATE TRIGGER trg_media_interactions_like_count
    AFTER INSERT OR DELETE ON media_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_media_like_count();

CREATE OR REPLACE FUNCTION update_media_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE media
        SET comments_count = comments_count + 1
        WHERE id = NEW.media_id;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE media
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.media_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$func$;

DROP TRIGGER IF EXISTS trg_media_comments_count ON media_comments;
CREATE TRIGGER trg_media_comments_count
    AFTER INSERT OR DELETE ON media_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_media_comment_count();

-- ============================================================
-- 9. ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_media_updated_at ON media;
CREATE TRIGGER trg_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_media_comments_updated_at ON media_comments;
CREATE TRIGGER trg_media_comments_updated_at
    BEFORE UPDATE ON media_comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_content_cache_updated_at ON content_cache;
CREATE TRIGGER trg_content_cache_updated_at
    BEFORE UPDATE ON content_cache
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_api_usage_windows_updated_at ON api_usage_windows;
CREATE TRIGGER trg_api_usage_windows_updated_at
    BEFORE UPDATE ON api_usage_windows
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;

-- Fim do schema inicial da REDE-SOCIOLOCAL.
