-- 移除 user_settings 表的 notes 列
-- 备注功能已从产品中删除，设置仅保留 AI 集成配置字段

alter table public.user_settings drop column if exists notes;
