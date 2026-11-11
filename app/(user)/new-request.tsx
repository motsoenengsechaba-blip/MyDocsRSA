import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Page } from '@/components/page';
import { SelectField, type SelectOption } from '@/components/select-field';
import { Banner, Button, Field } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { ApiError } from '@/lib/api';
import { submitRequest } from '@/lib/certification';
import { pickDocument, validateFile, type PickedFile } from '@/lib/files';
import { formatFileSize } from '@/lib/format';
import { DOCUMENT_TYPES, type CreateRequestResult, type DocumentType } from '@/lib/types';

type FormErrors = { docType?: string; other?: string; hasCopy?: string; file?: string };

const TYPE_OPTIONS: SelectOption<DocumentType>[] = DOCUMENT_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
  hint: t.hint,
}));

export default function NewRequestScreen() {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [otherText, setOtherText] = useState('');
  const [hasCopy, setHasCopy] = useState<boolean | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateRequestResult | null>(null);

  async function chooseFile() {
    try {
      const picked = await pickDocument();
      if (!picked) return;
      const problem = validateFile(picked);
      if (problem) {
        setFile(null);
        setErrors((e) => ({ ...e, file: problem }));
        return;
      }
      setFile(picked);
      setErrors((e) => ({ ...e, file: undefined }));
    } catch (error) {
      setErrors((e) => ({ ...e, file: error instanceof Error ? error.message : 'Could not open the file picker. Try again.' }));
    }
  }

  async function handleSubmit() {
    const found: FormErrors = {};
    if (!docType) found.docType = 'Choose the type of document.';
    if (docType === 'OTHER' && (otherText.trim().length < 3 || otherText.trim().length > 120)) found.other = 'Describe the document type using 3–120 characters.';
    if (hasCopy === null) found.hasCopy = 'Tell us whether you have a certified copy.';
    if (!file) found.file = 'Choose the file to upload.';
    setErrors(found);
    setServerError('');
    if (!docType || hasCopy === null || !file || Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      setResult(
        await submitRequest({
          documentType: docType,
          otherDescription: docType === 'OTHER' ? otherText.trim() : undefined,
          hasCertifiedCopy: hasCopy,
          file,
        }),
      );
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function startAnother() {
    setDocType(null);
    setOtherText('');
    setHasCopy(null);
    setFile(null);
    setErrors({});
    setServerError('');
    setResult(null);
  }

  // ---- Success ----
  if (result) {
    return (
      <Page title={result.reused ? 'Already verified' : 'Request sent'} subtitle="All done">
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>{result.reused ? 'This document is already verified' : 'Submitted for verification'}</Text>
          <Text style={styles.successText}>
            {result.reused
              ? 'This exact document already has an active digital card, so no new review is needed.'
              : 'An officer will review your document. You can follow the progress under Requests.'}
          </Text>
        </View>
        <Banner kind="success" message={result.message} />
        <Button
          title={result.reused ? 'Go to my documents' : 'Track my request'}
          onPress={() => router.replace(result.reused ? '/wallet' : '/requests')}
        />
        <Button title="Submit another document" variant="secondary" onPress={startAnother} />
      </Page>
    );
  }

  // ---- Form ----
  return (
    <Page title="Upload document" subtitle="Add a document for an officer to verify" back>
      <View style={{ gap: 6 }}>
        <Pressable onPress={chooseFile} style={[styles.upload, errors.file ? styles.uploadError : null]}>
          <View style={styles.uploadIcon}>
            <Ionicons name={file ? 'document-attach-outline' : 'cloud-upload-outline'} size={30} color={colors.primary} />
          </View>
          {file ? (
            <>
              <Text style={styles.uploadTitle} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.uploadHint}>{formatFileSize(file.size)} · tap to choose a different file</Text>
            </>
          ) : (
            <>
              <Text style={styles.uploadTitle}>Tap to upload your document</Text>
              <Text style={styles.uploadHint}>PDF, JPG or PNG (max 10MB)</Text>
            </>
          )}
        </Pressable>
        {errors.file ? <Text style={styles.error}>{errors.file}</Text> : null}
      </View>

      <SelectField
        label="Document type"
        options={TYPE_OPTIONS}
        value={docType}
        onChange={(v) => {
          setDocType(v);
          setErrors((e) => ({ ...e, docType: undefined }));
        }}
        placeholder="Select document type"
        error={errors.docType}
      />

      {docType === 'OTHER' ? (
        <Field
          label="What kind of document is it?"
          value={otherText}
          onChangeText={(t) => {
            setOtherText(t);
            setErrors((e) => ({ ...e, other: undefined }));
          }}
          error={errors.other}
          maxLength={120}
          placeholder="e.g. Marriage certificate"
        />
      ) : null}

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Do you have a certified copy?</Text>
        <Text style={styles.helper}>
          A certified copy is stamped and signed by a commissioner of oaths or a police station. Choosing Yes speeds up your review.
        </Text>
        <View style={styles.row}>
          {[
            { label: 'Yes, I have one', value: true },
            { label: 'No', value: false },
          ].map((choice) => {
            const on = hasCopy === choice.value;
            return (
              <Pressable
                key={choice.label}
                onPress={() => {
                  setHasCopy(choice.value);
                  setErrors((e) => ({ ...e, hasCopy: undefined }));
                }}
                style={[styles.choice, on ? styles.choiceOn : null]}>
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={on ? colors.primary : colors.faint} />
                <Text style={[styles.choiceText, on ? { color: colors.primary } : null]}>{choice.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.hasCopy ? <Text style={styles.error}>{errors.hasCopy}</Text> : null}
      </View>

      {serverError ? <Banner message={serverError} /> : null}
      <Button title="Upload document" icon="shield-checkmark-outline" onPress={handleSubmit} loading={loading} />
    </Page>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  helper: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.cardTint },
  choiceText: { fontSize: 14, fontWeight: '700', color: colors.text },
  upload: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7DB9A3',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 28,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  uploadError: { borderColor: colors.danger },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: colors.text, maxWidth: '100%' },
  uploadHint: { fontSize: 12, color: colors.muted },
  success: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    ...cardShadow,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  successText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
