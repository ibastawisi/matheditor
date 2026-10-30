export type Services = {
  uploadImage?: (file: File) => Promise<{
    error: unknown;
    data: {
      id: string;
      path: string;
      fullPath: string;
    } | null;
  }>;
  getImageSignedUrl?: (path: string) => Promise<{
    error: unknown;
    data: {
      signedUrl: string;
    } | null;
  }>;
};
