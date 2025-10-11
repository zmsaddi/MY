import { confirmationMessages } from '../../theme/designSystem';

export default function getConfirmationConfig(type, overrides = {}) {
  const base = confirmationMessages[type] || {};
  const variant = overrides.variant || base.variant || 'confirm';

  return {
    variant,
    title: overrides.title || base.title || 'تأكيد الإجراء',
    description: overrides.description || base.description || '',
    primaryLabel: overrides.primaryLabel || base.primaryLabel || 'متابعة',
    secondaryLabel: overrides.secondaryLabel || base.secondaryLabel || 'إلغاء',
    primaryColor: overrides.primaryColor || base.primaryColor,
    allowBackdropClose:
      overrides.allowBackdropClose ??
      base.allowBackdropClose ??
      variant !== 'destructive',
    allowEscapeClose:
      overrides.allowEscapeClose ??
      base.allowEscapeClose ??
      variant !== 'destructive',
    requireAcknowledgement:
      overrides.requireAcknowledgement ??
      base.requireAcknowledgement ??
      false,
    acknowledgementLabel:
      overrides.acknowledgementLabel || base.acknowledgementLabel
  };
}
