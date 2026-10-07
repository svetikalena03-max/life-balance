export const LEGAL_DOCUMENT_VERSION = "2026-10-07";

export type RegistrationConsents = {
  privacyAndData: boolean;
  terms: boolean;
  medical: boolean;
  documentVersion: string;
  acceptedAt: string;
};

export function createRegistrationConsents(): RegistrationConsents {
  return {
    privacyAndData: true,
    terms: true,
    medical: true,
    documentVersion: LEGAL_DOCUMENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
}

export function allRequiredConsentsAccepted(consents?: RegistrationConsents | null) {
  return Boolean(
    consents?.privacyAndData &&
    consents.terms &&
    consents.medical &&
    consents.documentVersion === LEGAL_DOCUMENT_VERSION,
  );
}

export function legalConsentMetadata(consents: RegistrationConsents) {
  return {
    privacy_policy_accepted: consents.privacyAndData,
    personal_data_accepted: consents.privacyAndData,
    user_agreement_accepted: consents.terms,
    medical_disclaimer_accepted: consents.medical,
    legal_document_version: consents.documentVersion,
    legal_accepted_at: consents.acceptedAt,
  };
}

export function readRegistrationConsents(
  metadata?: Record<string, unknown>,
): RegistrationConsents | null {
  if (!metadata) return null;
  const consents: RegistrationConsents = {
    privacyAndData:
      metadata.privacy_policy_accepted === true && metadata.personal_data_accepted === true,
    terms: metadata.user_agreement_accepted === true,
    medical: metadata.medical_disclaimer_accepted === true,
    documentVersion: String(metadata.legal_document_version ?? ""),
    acceptedAt: String(metadata.legal_accepted_at ?? ""),
  };
  return allRequiredConsentsAccepted(consents) ? consents : null;
}
