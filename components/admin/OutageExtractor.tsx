'use client';

import { useState } from 'react';
import type { NewsFlag } from '@/lib/db/schema';
import type { FieldConfidence, OutageKind, StructuredOutage } from '@/lib/outage/types';
import { OUTAGE_KINDS } from '@/lib/outage/types';
import { UI_TEXT, getOutageKindLabel } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Check, Plus, Wand2, X } from 'lucide-react';

interface OutageExtractorProps {
  newsId: string;
  /** Flags the admin has selected but may not have saved yet. */
  flags: NewsFlag[];
  /** Already-approved data, when this item has been through the flow before. */
  initial?: StructuredOutage | null;
}

/**
 * Extract → edit → approve, for a notice flagged as Caída de Sistema.
 *
 * Extraction is a read-only call: what comes back is a proposal held in local
 * state. Nothing reaches the database until "Aprobar y guardar".
 */
export function OutageExtractor({ newsId, flags, initial = null }: OutageExtractorProps) {
  const [draft, setDraft] = useState<StructuredOutage | null>(initial);
  const [existing, setExisting] = useState<StructuredOutage | null>(initial);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  // An item that arrives with approved data is already in a saved state.
  const [saved, setSaved] = useState(initial !== null);
  const [error, setError] = useState<string | null>(null);

  /** Any edit means a human stands behind the value, so the record says so. */
  function update(patch: Partial<StructuredOutage>) {
    setDraft((current) => (current ? { ...current, ...patch, source: 'edited' } : current));
    setSaved(false);
  }

  async function handleExtract() {
    setExtracting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/news/${newsId}/extract-outage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al extraer los datos');

      setDraft(data.structured);
      setExisting(data.existing);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setExtracting(false);
    }
  }

  async function handleApprove() {
    if (!draft) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/news/${newsId}/structured-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structured: draft, flags }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.issues?.map((i: { message: string }) => i.message).join(' · ');
        throw new Error(detail || data.error || 'Error al guardar los datos');
      }

      setExisting(draft);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/news/${newsId}/structured-data`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar los datos');

      setDraft(null);
      setExisting(null);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{UI_TEXT.admin.outage.title}</h4>

        <div className="flex items-center gap-2">
          {/* Only once the current draft matches what was stored — an edit
              since the last save clears it, so this never reads as a
              confirmation of unsaved changes. */}
          {existing && saved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" />
              {UI_TEXT.admin.outage.saved}
            </span>
          )}

          <Button variant="outline" size="sm" onClick={handleExtract} disabled={extracting || saving}>
            <Wand2 />
            {extracting
              ? UI_TEXT.admin.outage.extracting
              : draft
                ? UI_TEXT.admin.outage.reextract
                : UI_TEXT.admin.outage.extract}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {!draft && !error && (
        <p className="mt-2 text-xs text-muted-foreground">{UI_TEXT.admin.outage.notStored}</p>
      )}

      {draft && (
        <div className="mt-4 space-y-4">
          {existing && draft.source === 'edited' && (
            <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              {UI_TEXT.admin.outage.existing}
            </p>
          )}

          <Field label={UI_TEXT.admin.outage.kind} confidence={draft.confidence.kind}>
            <select
              value={draft.kind}
              onChange={(event) => update({ kind: event.target.value as OutageKind })}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {OUTAGE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {getOutageKindLabel(kind)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={UI_TEXT.admin.outage.startsAt} confidence={draft.confidence.window}>
              <Input
                type="datetime-local"
                value={toInputValue(draft.startsAt)}
                onChange={(event) => update({ startsAt: fromInputValue(event.target.value) })}
              />
            </Field>

            <Field label={UI_TEXT.admin.outage.endsAt} confidence={draft.confidence.window}>
              <Input
                type="datetime-local"
                value={toInputValue(draft.endsAt)}
                onChange={(event) => update({ endsAt: fromInputValue(event.target.value) })}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={draft.inProgress}
              onCheckedChange={(checked) => update({ inProgress: checked === true })}
            />
            {UI_TEXT.admin.outage.inProgress}
          </label>

          <Field label={UI_TEXT.admin.outage.services} confidence={draft.confidence.services}>
            <div className="space-y-2">
              {draft.services.length === 0 && (
                <p className="text-xs text-muted-foreground">{UI_TEXT.admin.outage.noServices}</p>
              )}

              {draft.services.map((service, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={service}
                    onChange={(event) => {
                      const services = [...draft.services];
                      services[index] = event.target.value;
                      update({ services });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar ${service}`}
                    onClick={() =>
                      update({ services: draft.services.filter((_, i) => i !== index) })
                    }
                  >
                    <X />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => update({ services: [...draft.services, ''] })}
              >
                <Plus />
                {UI_TEXT.admin.outage.addService}
              </Button>
            </div>
          </Field>

          <Field label={UI_TEXT.admin.outage.scope}>
            <Input
              value={draft.scope ?? ''}
              placeholder={UI_TEXT.admin.outage.scopePlaceholder}
              onChange={(event) => update({ scope: event.target.value.trim() || null })}
            />
          </Field>

          <Field label={UI_TEXT.admin.outage.cause}>
            <Textarea
              value={draft.cause ?? ''}
              placeholder={UI_TEXT.admin.outage.causePlaceholder}
              rows={2}
              onChange={(event) => update({ cause: event.target.value.trim() || null })}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={handleApprove} disabled={saving}>
              <Check />
              {saving ? UI_TEXT.admin.outage.saving : UI_TEXT.admin.outage.approve}
            </Button>

            {existing && (
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={saving}>
                <X />
                {UI_TEXT.admin.outage.clear}
              </Button>
            )}

            {!existing && (
              <span className="text-xs text-muted-foreground">
                {UI_TEXT.admin.outage.notStored}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A labelled field. Anything the parser did not read cleanly gets an amber
 * marker, so review effort lands where the extraction was uncertain.
 */
function Field({
  label,
  confidence,
  children,
}: {
  label: string;
  confidence?: FieldConfidence;
  children: React.ReactNode;
}) {
  const needsReview = confidence === 'missing' || confidence === 'partial';

  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {label}
        {needsReview && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-2.5" />
            {UI_TEXT.admin.outage.review}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* datetime-local <-> ISO                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `datetime-local` has no timezone, and the notices are always Lima time, so
 * the wall-clock reading is shown and re-attached to the -05:00 offset on the
 * way out. Going through the browser's own zone would shift every value for an
 * admin outside Peru.
 */
const LIMA_OFFSET = '-05:00';

function toInputValue(iso: string | null): string {
  if (!iso) return '';

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (match) return `${match[1]}T${match[2]}`;

  return '';
}

function fromInputValue(value: string): string | null {
  if (!value) return null;

  // The input yields "YYYY-MM-DDTHH:MM"; seconds and the offset are ours to add.
  return `${value}:00${LIMA_OFFSET}`;
}
