import { toast } from 'sonner';

export const showSuccessToast = (message) => toast.success(message);

export const showErrorToast = (error) => {
  const status = error?.response?.status;
  if (status === 403) return toast.error("You don't have permission to do this");
  if (status === 404) return toast.error('Not found');
  if (!error?.response) return toast.error('Connection error. Check your internet.');

  const message = error?.response?.data?.message || 'Something went wrong';
  return toast.error(message);
};

