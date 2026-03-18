/**
 * Generate Report Form
 * Form to create new reports with date range and type selection
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateReportDefaults, GenerateReportFormData, generateReportSchema } from '@/lib/forms/dashboard';


interface GenerateReportFormProps {
  onSubmit: (data: GenerateReportFormData) => Promise<void>;
  isLoading?: boolean;
}

export const GenerateReportForm: React.FC<GenerateReportFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: generateReportDefaults,
  });

  const isLoading_ = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Report Type */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Report Type
        </label>
        <select
          {...register('type')}
          disabled={isLoading_}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground transition-all"
        >
          <option value="daily_summary">Daily Summary</option>
          <option value="sales">Sales Report</option>
          <option value="inventory">Inventory Report</option>
          <option value="customer">Customer Report</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2">
            Start Date
          </label>
          <input
            type="date"
            {...register('startDate')}
            disabled={isLoading_}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground transition-all"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            End Date
          </label>
          <input
            type="date"
            {...register('endDate')}
            disabled={isLoading_}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground transition-all"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading_}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isLoading_ && (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        )}
        {isLoading_ ? 'Generating...' : 'Generate Report'}
      </button>
    </form>
  );
};
