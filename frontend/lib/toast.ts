import { toast as reactToastify, ToastOptions, TypeOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'dark',
  style: {
    background: 'rgba(17, 17, 24, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
};

const getTypeStyles = (type: TypeOptions): Partial<ToastOptions> => {
  const styles: Record<TypeOptions, Partial<ToastOptions>> = {
    success: {
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #00ff88',
        boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)',
      },
      progressStyle: {
        background: 'linear-gradient(90deg, #00ff88, #00d9ff)',
      },
    },
    error: {
      autoClose: 7000,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #ff2e97',
        boxShadow: '0 8px 32px rgba(255, 46, 151, 0.2)',
      },
      progressStyle: {
        background: 'linear-gradient(90deg, #ff2e97, #ff6b6b)',
      },
    },
    warning: {
      autoClose: 6000,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #ffea00',
        boxShadow: '0 8px 32px rgba(255, 234, 0, 0.2)',
      },
      progressStyle: {
        background: 'linear-gradient(90deg, #ffea00, #ffa500)',
      },
    },
    info: {
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #00d9ff',
        boxShadow: '0 8px 32px rgba(0, 217, 255, 0.2)',
      },
      progressStyle: {
        background: 'linear-gradient(90deg, #00d9ff, #b537ff)',
      },
    },
    default: defaultOptions,
  };

  return styles[type] || styles.default;
};

const toast = {
  success: (message: string, options?: ToastOptions) => {
    return reactToastify.success(message, {
      ...defaultOptions,
      ...getTypeStyles('success'),
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return reactToastify.error(message, {
      ...defaultOptions,
      ...getTypeStyles('error'),
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return reactToastify.warning(message, {
      ...defaultOptions,
      ...getTypeStyles('warning'),
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return reactToastify.info(message, {
      ...defaultOptions,
      ...getTypeStyles('info'),
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return reactToastify.promise(
      promise,
      {
        pending: {
          render: messages.pending,
          ...defaultOptions,
          ...getTypeStyles('info'),
        },
        success: {
          render: messages.success,
          ...defaultOptions,
          ...getTypeStyles('success'),
        },
        error: {
          render: messages.error,
          ...defaultOptions,
          ...getTypeStyles('error'),
        },
      },
      options
    );
  },

  loading: (message: string, options?: ToastOptions) => {
    return reactToastify.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },

  update: (toastId: string | number, options: ToastOptions) => {
    return reactToastify.update(toastId, {
      ...defaultOptions,
      ...options,
    });
  },

  dismiss: (toastId?: string | number) => {
    return reactToastify.dismiss(toastId);
  },
};

export { toast };
export default toast;
