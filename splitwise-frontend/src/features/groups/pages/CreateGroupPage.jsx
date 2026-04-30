import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FormInputField, FormSelectField, FormTextareaField } from '../../../components/form-fields';
import { AppShell, PageHeader } from '../../../components/shared';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Form } from '../../../components/ui/form';
import { useAuth } from '../../../context/AuthContext';
import { useCreateGroupMutation } from '../../../hooks/useGroups';
import { createGroupSchema } from '../../../schemas';
import { MemberSelector } from '../components/MemberSelector';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createGroupMutation = useCreateGroupMutation();
  const [apiError, setApiError] = useState('');

  const form = useForm({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      members: [],
      currency: 'INR',
    },
  });

  const description = form.watch('description') || '';
  const isSubmitting = form.formState.isSubmitting || createGroupMutation.isPending;

  const onSubmit = async (values) => {
    setApiError('');
    try {
      const payload = {
        name: values.name,
        description: values.description,
        currency: values.currency,
        members: Array.from(new Set([...(values.members || []), user?._id].filter(Boolean))),
      };
      await createGroupMutation.mutateAsync(payload);
    } catch {
      setApiError('Unable to create group. Please try again.');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Create Group"
        action={(
          <Button variant="ghost" onClick={() => navigate('/groups')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
      />

      <Card className="mx-auto w-full max-w-[520px]">
        <CardContent className="p-6">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormInputField
                control={form.control}
                name="name"
                label="Group Name"
                placeholder="Trip to Goa"
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <FormTextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Optional group description..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs md:text-sm text-slate-900 font-medium">Members</p>
                <Controller
                  control={form.control}
                  name="members"
                  render={({ field }) => (
                    <MemberSelector
                      selectedIds={field.value || []}
                      onChange={field.onChange}
                      creatorId={user?._id}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.members ? (
                  <p className="text-red-500 text-sm font-normal">{form.formState.errors.members.message}</p>
                ) : null}
              </div>

              <FormSelectField
                control={form.control}
                name="currency"
                label="Currency"
                options={['INR', 'USD', 'EUR', 'GBP']}
                disabled={isSubmitting}
              />

              {apiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Create Group
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default CreateGroupPage;

