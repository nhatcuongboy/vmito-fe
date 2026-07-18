export type AiSessionContentTemplateId = 'standard';

export interface AiSessionContentTemplate {
  id: AiSessionContentTemplateId;
  nameKey: `aiModal.templates.${AiSessionContentTemplateId}.name`;
  descriptionKey: `aiModal.templates.${AiSessionContentTemplateId}.description`;
  contentKey: `aiModal.templates.${AiSessionContentTemplateId}.content`;
}

export const AI_SESSION_CONTENT_TEMPLATES: readonly AiSessionContentTemplate[] =
  [
    {
      id: 'standard',
      nameKey: 'aiModal.templates.standard.name',
      descriptionKey: 'aiModal.templates.standard.description',
      contentKey: 'aiModal.templates.standard.content',
    },
  ];

const UNRESOLVED_PLACEHOLDER_PATTERN = /\[[^\]\n]+\]/;

export function hasUnresolvedTemplatePlaceholders(content: string): boolean {
  return UNRESOLVED_PLACEHOLDER_PATTERN.test(content);
}
