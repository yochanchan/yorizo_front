export type Toast = {
  id?: string
  title?: string
  description?: string
}

export function useToast() {
  return {
    toasts: [] as Toast[],
    toast: (_toast?: Toast) => {},
  }
}

export const toast = (_toast?: Toast) => {}
