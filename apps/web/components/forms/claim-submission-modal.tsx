'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  tenantId: z.string().min(1),
  patientName: z.string().min(2),
  patientId: z.string().min(2),
  nationalId: z.string().min(10),
  amount: z.coerce.number().min(0),
  diagnosis: z.string().min(2),
});

export type ClaimFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  tenants: Array<{ id: string; name: string }>;
  submitting: boolean;
  onSubmit(values: ClaimFormValues): void;
  onClose(): void;
}

export function ClaimSubmissionModal({ open, tenants, submitting, onSubmit, onClose }: Props) {
  const { t } = useTranslation('common');
  const { register, handleSubmit, reset, formState } = useForm<ClaimFormValues>({
    resolver: zodResolver(schema),
  });
  const { errors } = formState;

  useEffect(() => {
    const defaults: ClaimFormValues = {
      tenantId: tenants[0]?.id ?? '',
      patientName: '',
      patientId: '',
      nationalId: '',
      amount: 0,
      diagnosis: '',
    };
    if (open) {
      reset(defaults);
    } else {
      reset(defaults);
    }
  }, [open, reset, tenants]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('claims.form.title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            {t('claims.form.close')}
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => onSubmit(values))}
        >
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-300">
              {t('claims.form.tenant')}
            </label>
            <select
              data-testid="claim-tenant"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              {...register('tenantId')}
            >
              <option value="">{t('claims.form.selectTenant')}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            {errors.tenantId && <p className="mt-1 text-xs text-rose-400">{t('claims.form.errors.tenant')}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label={t('claims.form.patientName')}
              error={errors.patientName && t('claims.form.errors.patientName')}
              inputProps={{
                ...register('patientName'),
              }}
            />
            <Field
              label={t('claims.form.patientId')}
              error={errors.patientId && t('claims.form.errors.patientId')}
              inputProps={{ ...register('patientId') }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label={t('claims.form.nationalId')}
              error={errors.nationalId && t('claims.form.errors.nationalId')}
              inputProps={{ ...register('nationalId') }}
            />
            <Field
              label={t('claims.form.amount')}
              error={errors.amount && t('claims.form.errors.amount')}
              inputProps={{ ...register('amount'), type: 'number', step: '0.01' }}
            />
          </div>

          <Field
            label={t('claims.form.diagnosis')}
            error={errors.diagnosis && t('claims.form.errors.diagnosis')}
            inputProps={{ ...register('diagnosis') }}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              {t('claims.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="claim-submit"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t('claims.form.submitting') : t('claims.form.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  inputProps,
}: {
  label: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-300">
        {label}
      </label>
      <input
        {...inputProps}
        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
